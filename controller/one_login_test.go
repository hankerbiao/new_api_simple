package controller

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupOneLoginControllerTest(t *testing.T) []byte {
	t.Helper()
	previousDB := model.DB
	previousLogDB := model.LOG_DB
	previousRedisEnabled := common.RedisEnabled
	previousSessionSecret := common.SessionSecret
	previousNewUserQuota := common.QuotaForNewUser
	previousCookieSecure := common.SessionCookieSecure
	previousPasswordLoginEnabled := common.PasswordLoginEnabled

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&model.User{},
		&model.UserSession{},
		&model.TwoFA{},
		&model.Log{},
	))
	model.DB = db
	model.LOG_DB = db
	common.RedisEnabled = false
	common.SessionSecret = "one-login-controller-test-session-secret"
	common.QuotaForNewUser = 0
	common.SessionCookieSecure = false
	common.PasswordLoginEnabled = false

	key := []byte("one-login-controller-test-signing-key-at-least-32-bytes")
	t.Setenv("ONE_LOGIN_JWT_SECRET", string(key))
	t.Setenv("ONE_LOGIN_JWT_SECRET_BASE64URL", "")
	t.Setenv("ONE_LOGIN_APP_URL", "http://gateway.example.test:3001")
	t.Setenv("ONE_LOGIN_BROKER_URL", "https://one.example.test/login?environment=formal")
	t.Cleanup(func() {
		model.DB = previousDB
		model.LOG_DB = previousLogDB
		common.RedisEnabled = previousRedisEnabled
		common.SessionSecret = previousSessionSecret
		common.QuotaForNewUser = previousNewUserQuota
		common.SessionCookieSecure = previousCookieSecure
		common.PasswordLoginEnabled = previousPasswordLoginEnabled
	})
	return key
}

func TestAdminLoginOnlyAcceptsAdministrators(t *testing.T) {
	setupOneLoginControllerTest(t)
	gin.SetMode(gin.TestMode)

	password, err := common.Password2Hash("password-for-test")
	require.NoError(t, err)
	commonUser := &model.User{
		Username: "common-user",
		Password: password,
		AffCode:  "common-user-aff",
		Role:     common.RoleCommonUser,
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}
	require.NoError(t, model.DB.Create(commonUser).Error)
	administrator := &model.User{
		Username: "administrator",
		Password: password,
		AffCode:  "administrator-aff",
		Role:     common.RoleAdminUser,
		Status:   common.UserStatusEnabled,
		Group:    "default",
	}
	require.NoError(t, model.DB.Create(administrator).Error)

	router := gin.New()
	router.POST("/api/user/admin/login", AdminLogin)
	body, err := common.Marshal(LoginRequest{
		Username: commonUser.Username,
		Password: "password-for-test",
	})
	require.NoError(t, err)
	commonResponse := httptest.NewRecorder()
	router.ServeHTTP(commonResponse, httptest.NewRequest(
		http.MethodPost,
		"/api/user/admin/login",
		bytes.NewReader(body),
	))
	require.Equal(t, http.StatusOK, commonResponse.Code)
	var commonResult struct {
		Success bool `json:"success"`
	}
	require.NoError(t, common.Unmarshal(commonResponse.Body.Bytes(), &commonResult))
	assert.False(t, commonResult.Success)

	body, err = common.Marshal(LoginRequest{
		Username: administrator.Username,
		Password: "password-for-test",
	})
	require.NoError(t, err)
	adminResponse := httptest.NewRecorder()
	router.ServeHTTP(adminResponse, httptest.NewRequest(
		http.MethodPost,
		"/api/user/admin/login",
		bytes.NewReader(body),
	))
	require.Equal(t, http.StatusOK, adminResponse.Code)
	var adminResult struct {
		Success bool `json:"success"`
	}
	require.NoError(t, common.Unmarshal(adminResponse.Body.Bytes(), &adminResult))
	assert.True(t, adminResult.Success)
	var session model.UserSession
	require.NoError(t, model.DB.Where("user_id = ?", administrator.Id).First(&session).Error)
	assert.Equal(t, "admin_password", session.LoginMethod)
}

func TestOneLoginCallbackProvisionsUserAndCreatesSession(t *testing.T) {
	key := setupOneLoginControllerTest(t)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/auth/one-login/login", StartOneLogin)
	router.GET("/auth/one-login/callback", HandleOneLoginCallback)

	startResponse := httptest.NewRecorder()
	router.ServeHTTP(startResponse, httptest.NewRequest(http.MethodGet, "/auth/one-login/login?redirect=/keys", nil))
	require.Equal(t, http.StatusFound, startResponse.Code)
	stateCookie := startResponse.Result().Cookies()[0]

	brokerURL, err := url.Parse(startResponse.Header().Get("Location"))
	require.NoError(t, err)
	next := brokerURL.Query().Get("next")
	require.NotEmpty(t, next)

	payload, err := jwt.NewWithClaims(jwt.SigningMethodHS256, service.OneLoginClaims{
		ITCode:   "staff-1001",
		Email:    "staff-1001@example.test",
		RealName: "Staff Member",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
		},
	}).SignedString(key)
	require.NoError(t, err)

	callbackURL := "/auth/one-login/callback?status=success&payload=" + url.QueryEscape(payload) + "&next=" + url.QueryEscape(next)
	callbackRequest := httptest.NewRequest(http.MethodGet, callbackURL, nil)
	callbackRequest.AddCookie(stateCookie)
	callbackResponse := httptest.NewRecorder()
	router.ServeHTTP(callbackResponse, callbackRequest)

	require.Equal(t, http.StatusFound, callbackResponse.Code)
	assert.Equal(t, "/sign-in?redirect=%2Fkeys", callbackResponse.Header().Get("Location"))
	var user model.User
	require.NoError(t, model.DB.Where("username = ?", "staff-1001").First(&user).Error)
	assert.Equal(t, common.RoleCommonUser, user.Role)
	assert.Equal(t, "staff-1001@example.test", user.Email)
	var session model.UserSession
	require.NoError(t, model.DB.Where("user_id = ?", user.Id).First(&session).Error)
	assert.Equal(t, "one_login", session.LoginMethod)

	cookies := callbackResponse.Result().Cookies()
	var refreshCookie *http.Cookie
	for _, cookie := range cookies {
		if cookie.Name == service.RefreshCookieName {
			refreshCookie = cookie
			break
		}
	}
	require.NotNil(t, refreshCookie)
}

func TestOneLoginCallbackRejectsPayloadWithoutMatchingState(t *testing.T) {
	key := setupOneLoginControllerTest(t)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/auth/one-login/callback", HandleOneLoginCallback)

	payload, err := jwt.NewWithClaims(jwt.SigningMethodHS256, service.OneLoginClaims{
		ITCode: "staff-1002",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
		},
	}).SignedString(key)
	require.NoError(t, err)

	next := "http://gateway.example.test:3001/dashboard?one_login_state=missing"
	request := httptest.NewRequest(
		http.MethodGet,
		"/auth/one-login/callback?status=success&payload="+url.QueryEscape(payload)+"&next="+url.QueryEscape(next),
		nil,
	)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	assert.Equal(t, http.StatusFound, response.Code)
	assert.Equal(t, "/sign-in?one_login=failed", response.Header().Get("Location"))
	var count int64
	require.NoError(t, model.DB.Model(&model.User{}).Count(&count).Error)
	assert.Zero(t, count)
}
