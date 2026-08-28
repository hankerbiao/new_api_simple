package controller

import (
	"crypto/subtle"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const (
	oneLoginStateCookieName = "new_api_one_login_state"
	oneLoginStateParameter  = "one_login_state"
	oneLoginStateTTL        = 5 * time.Minute
)

func StartOneLogin(c *gin.Context) {
	config, err := service.LoadOneLoginConfig()
	if err != nil {
		logger.LogError(c.Request.Context(), "ONE Login is not configured")
		c.Redirect(http.StatusFound, oneLoginSignInURL("", "unavailable"))
		return
	}

	redirectPath := normalizeOneLoginRedirect(c.Query("redirect"), config.AppURL)
	state, err := common.GenerateRandomCharsKey(48)
	if err != nil {
		logger.LogError(c.Request.Context(), "ONE Login state generation failed: "+err.Error())
		c.Redirect(http.StatusFound, oneLoginSignInURL("", "failed"))
		return
	}

	callbackTarget := oneLoginCallbackTarget(config.AppURL, redirectPath, state)
	brokerURL, err := service.BuildOneLoginBrokerURL(config, callbackTarget)
	if err != nil {
		logger.LogError(c.Request.Context(), "ONE Login broker URL generation failed: "+err.Error())
		c.Redirect(http.StatusFound, oneLoginSignInURL("", "failed"))
		return
	}

	writeOneLoginStateCookie(c, state, oneLoginStateTTL)
	c.Redirect(http.StatusFound, brokerURL)
}

func HandleOneLoginCallback(c *gin.Context) {
	config, err := service.LoadOneLoginConfig()
	if err != nil {
		logger.LogError(c.Request.Context(), "ONE Login is not configured")
		c.Redirect(http.StatusFound, oneLoginSignInURL("", "unavailable"))
		return
	}

	redirectPath, state := oneLoginCallbackState(c.Query("next"), config.AppURL)
	if !verifyOneLoginState(c, state) {
		c.Redirect(http.StatusFound, oneLoginSignInURL("", "failed"))
		return
	}
	writeOneLoginStateCookie(c, "", -1)

	if c.Query("status") != "success" {
		c.Redirect(http.StatusFound, oneLoginSignInURL(redirectPath, "failed"))
		return
	}

	claims, err := service.VerifyOneLoginPayload(c.Query("payload"), config)
	if err != nil {
		logger.LogWarn(c.Request.Context(), "ONE Login callback payload verification failed")
		c.Redirect(http.StatusFound, oneLoginSignInURL(redirectPath, "failed"))
		return
	}

	user, err := findOrCreateOneLoginUser(claims)
	if err != nil {
		logger.LogError(c.Request.Context(), "ONE Login user synchronization failed: "+err.Error())
		c.Redirect(http.StatusFound, oneLoginSignInURL(redirectPath, "failed"))
		return
	}
	if user.Status != common.UserStatusEnabled {
		c.Redirect(http.StatusFound, oneLoginSignInURL(redirectPath, "failed"))
		return
	}

	bundle, err := service.CreateLoginSession(
		user.Id,
		"one_login",
		c.ClientIP(),
		c.Request.UserAgent(),
	)
	if err != nil {
		writeAuthSessionError(c, err)
		return
	}
	model.UpdateUserLastLoginAt(user.Id)
	service.WriteRefreshCookie(c, bundle.RefreshToken)
	setAuthNoStore(c)
	recordLoginAudit(user, c)
	c.Redirect(http.StatusFound, oneLoginSignInURL(redirectPath, ""))
}

func findOrCreateOneLoginUser(claims *service.OneLoginClaims) (*model.User, error) {
	itcode := strings.TrimSpace(claims.ITCode)
	if !isValidOneLoginITCode(itcode) {
		return nil, errors.New("invalid one login itcode")
	}

	user := &model.User{}
	err := model.DB.Where("username = ?", itcode).First(user).Error
	if err == nil {
		return user, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	exists, err := model.CheckUserExistOrDeleted(itcode, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("one login user is unavailable")
	}

	email := normalizeOneLoginEmail(claims.Email)
	if email != "" {
		available, err := model.IsEmailAvailable(email, 0)
		if err != nil {
			return nil, err
		}
		if !available {
			email = ""
		}
	}

	user = &model.User{
		Username:    itcode,
		DisplayName: oneLoginDisplayName(claims, itcode),
		Email:       email,
		Role:        common.RoleCommonUser,
		Status:      common.UserStatusEnabled,
		Group:       "default",
	}
	if err := user.Insert(0); err != nil {
		existingUser := &model.User{}
		if lookupErr := model.DB.Where("username = ?", itcode).First(existingUser).Error; lookupErr == nil {
			return existingUser, nil
		}
		return nil, err
	}
	return user, nil
}

func oneLoginDisplayName(claims *service.OneLoginClaims, fallback string) string {
	name := strings.TrimSpace(claims.RealName)
	if name == "" {
		name = strings.TrimSpace(claims.Name)
	}
	if name == "" || utf8.RuneCountInString(name) > model.UserNameMaxLength {
		return fallback
	}
	return name
}

func normalizeOneLoginEmail(email string) string {
	email = model.NormalizeEmail(email)
	if utf8.RuneCountInString(email) > 50 {
		return ""
	}
	return email
}

func isValidOneLoginITCode(itcode string) bool {
	if itcode == "" || utf8.RuneCountInString(itcode) > model.UserNameMaxLength {
		return false
	}
	for _, character := range itcode {
		if (character < 'a' || character > 'z') &&
			(character < 'A' || character > 'Z') &&
			(character < '0' || character > '9') &&
			character != '-' && character != '_' && character != '.' {
			return false
		}
	}
	return true
}

func oneLoginCallbackTarget(appURL *url.URL, redirectPath string, state string) string {
	callbackURL := *appURL
	callbackURL.Path = strings.TrimSuffix(callbackURL.Path, "/") + redirectPath
	callbackURL.RawQuery = ""
	callbackURL.Fragment = ""
	query := callbackURL.Query()
	query.Set(oneLoginStateParameter, state)
	callbackURL.RawQuery = query.Encode()
	return callbackURL.String()
}

func oneLoginCallbackState(rawNext string, appURL *url.URL) (string, string) {
	next, err := url.Parse(strings.TrimSpace(rawNext))
	if err != nil || appURL == nil || next.Scheme != appURL.Scheme || next.Host != appURL.Host {
		return "/dashboard", ""
	}
	basePath := strings.TrimSuffix(appURL.Path, "/")
	if basePath != "" && !strings.HasPrefix(next.Path, basePath+"/") && next.Path != basePath {
		return "/dashboard", ""
	}
	query := next.Query()
	state := query.Get(oneLoginStateParameter)
	query.Del(oneLoginStateParameter)
	next.RawQuery = query.Encode()

	redirectPath := next.EscapedPath()
	if redirectPath == "" {
		redirectPath = "/dashboard"
	}
	if next.RawQuery != "" {
		redirectPath += "?" + next.RawQuery
	}
	if next.Fragment != "" {
		redirectPath += "#" + next.EscapedFragment()
	}
	return normalizeOneLoginRedirect(redirectPath, appURL), state
}

func normalizeOneLoginRedirect(raw string, appURL *url.URL) string {
	fallback := "/dashboard"
	if appURL == nil {
		return fallback
	}
	target := strings.TrimSpace(raw)
	if target == "" || strings.Contains(target, "\\") || strings.HasPrefix(target, "//") {
		return fallback
	}
	parsed, err := url.Parse(target)
	if err != nil {
		return fallback
	}
	if parsed.IsAbs() && (parsed.Scheme != appURL.Scheme || parsed.Host != appURL.Host) {
		return fallback
	}
	if !parsed.IsAbs() && !strings.HasPrefix(parsed.Path, "/") {
		return fallback
	}
	path := parsed.EscapedPath()
	if path == "" {
		path = fallback
	}
	if parsed.RawQuery != "" {
		path += "?" + parsed.RawQuery
	}
	if parsed.Fragment != "" {
		path += "#" + parsed.EscapedFragment()
	}
	return path
}

func oneLoginSignInURL(redirectPath string, status string) string {
	query := url.Values{}
	if redirectPath != "" && redirectPath != "/dashboard" {
		query.Set("redirect", redirectPath)
	}
	if status != "" {
		query.Set("one_login", status)
	}
	if encoded := query.Encode(); encoded != "" {
		return "/sign-in?" + encoded
	}
	return "/sign-in"
}

func writeOneLoginStateCookie(c *gin.Context, value string, lifetime time.Duration) {
	maxAge := int(lifetime / time.Second)
	expiresAt := time.Now().Add(lifetime)
	if lifetime < 0 {
		maxAge = -1
		expiresAt = time.Unix(1, 0)
	}
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     oneLoginStateCookieName,
		Value:    value,
		Path:     "/auth/one-login",
		MaxAge:   maxAge,
		Expires:  expiresAt,
		HttpOnly: true,
		Secure:   common.SessionCookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}

func verifyOneLoginState(c *gin.Context, expected string) bool {
	if expected == "" {
		return false
	}
	actual, err := c.Cookie(oneLoginStateCookieName)
	if err != nil || len(actual) != len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(actual), []byte(expected)) == 1
}
