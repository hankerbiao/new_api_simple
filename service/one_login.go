package service

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	defaultOneLoginBrokerURL = "https://one.1oa.com.cn/springboard/api/v1/broker/apps/ai_gateway/login?environment=formal"
	defaultOneLoginAppURL    = "http://10.2.50.149:3001"
)

var ErrOneLoginInvalidPayload = errors.New("one login payload is invalid")

type OneLoginConfig struct {
	BrokerURL  *url.URL
	AppURL     *url.URL
	SigningKey []byte
}

type OneLoginClaims struct {
	ITCode           string `json:"itcode"`
	Email            string `json:"邮件"`
	EmployeeNumber   string `json:"员工编号"`
	Department       string `json:"部门"`
	EmploymentStatus string `json:"在职状态"`
	Name             string `json:"姓名"`
	RealName         string `json:"真实姓名"`
	HireDate         string `json:"入职日期"`
	jwt.RegisteredClaims
}

func LoadOneLoginConfig() (OneLoginConfig, error) {
	brokerURL, err := parseOneLoginURL(
		"ONE_LOGIN_BROKER_URL",
		envOrDefault("ONE_LOGIN_BROKER_URL", defaultOneLoginBrokerURL),
		true,
	)
	if err != nil {
		return OneLoginConfig{}, err
	}
	appURL, err := parseOneLoginURL(
		"ONE_LOGIN_APP_URL",
		envOrDefault("ONE_LOGIN_APP_URL", defaultOneLoginAppURL),
		false,
	)
	if err != nil {
		return OneLoginConfig{}, err
	}

	rawKey := strings.TrimSpace(os.Getenv("ONE_LOGIN_JWT_SECRET"))
	key := []byte(rawKey)
	if rawKey == "" {
		encodedKey := strings.TrimSpace(os.Getenv("ONE_LOGIN_JWT_SECRET_BASE64URL"))
		if encodedKey == "" {
			return OneLoginConfig{}, errors.New("ONE_LOGIN_JWT_SECRET is not configured")
		}
		key, err = base64.RawURLEncoding.DecodeString(encodedKey)
		if err != nil {
			key, err = base64.URLEncoding.DecodeString(encodedKey)
		}
		if err != nil {
			return OneLoginConfig{}, errors.New("ONE_LOGIN_JWT_SECRET_BASE64URL is invalid")
		}
	}
	if len(key) < 32 {
		return OneLoginConfig{}, errors.New("ONE_LOGIN_JWT_SECRET is invalid")
	}

	return OneLoginConfig{
		BrokerURL:  brokerURL,
		AppURL:     appURL,
		SigningKey: key,
	}, nil
}

func VerifyOneLoginPayload(raw string, config OneLoginConfig) (*OneLoginClaims, error) {
	if strings.TrimSpace(raw) == "" || len(config.SigningKey) < 32 {
		return nil, ErrOneLoginInvalidPayload
	}

	claims := &OneLoginClaims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("%w: unexpected signing method", ErrOneLoginInvalidPayload)
		}
		return config.SigningKey, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired(), jwt.WithLeeway(5*time.Second))
	if err != nil || token == nil || !token.Valid || strings.TrimSpace(claims.ITCode) == "" {
		return nil, ErrOneLoginInvalidPayload
	}
	return claims, nil
}

func BuildOneLoginBrokerURL(config OneLoginConfig, next string) (string, error) {
	if config.BrokerURL == nil || config.AppURL == nil {
		return "", errors.New("one login configuration is incomplete")
	}

	brokerURL := *config.BrokerURL
	query := brokerURL.Query()
	query.Set("next", next)
	brokerURL.RawQuery = query.Encode()
	return brokerURL.String(), nil
}

func parseOneLoginURL(name string, raw string, requireHTTPS bool) (*url.URL, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return nil, fmt.Errorf("%s is invalid", name)
	}
	if requireHTTPS && parsed.Scheme != "https" {
		return nil, fmt.Errorf("%s must use https", name)
	}
	if !requireHTTPS && parsed.Scheme != "http" && parsed.Scheme != "https" {
		return nil, fmt.Errorf("%s must use http or https", name)
	}
	return parsed, nil
}

func envOrDefault(name string, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}
