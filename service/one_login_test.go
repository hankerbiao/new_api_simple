package service

import (
	"encoding/base64"
	"errors"
	"net/url"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadOneLoginConfigSupportsRawAndLegacyBase64URLSigningKeys(t *testing.T) {
	key := "one-login-test-signing-key-must-be-at-least-32-bytes"
	tests := []struct {
		name       string
		rawKey     string
		encodedKey string
	}{
		{
			name:   "raw application secret",
			rawKey: key,
		},
		{
			name:       "legacy base64url secret",
			encodedKey: base64.RawURLEncoding.EncodeToString([]byte(key)),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Setenv("ONE_LOGIN_JWT_SECRET", test.rawKey)
			t.Setenv("ONE_LOGIN_JWT_SECRET_BASE64URL", test.encodedKey)
			t.Setenv("ONE_LOGIN_APP_URL", "http://gateway.example.test:3001")
			t.Setenv("ONE_LOGIN_BROKER_URL", "https://one.example.test/login?environment=formal")

			config, err := LoadOneLoginConfig()

			require.NoError(t, err)
			assert.Equal(t, []byte(key), config.SigningKey)
		})
	}
}

func TestVerifyOneLoginPayloadAcceptsValidHS256Assertion(t *testing.T) {
	key := []byte("one-login-test-signing-key-must-be-at-least-32-bytes")
	raw, err := jwt.NewWithClaims(jwt.SigningMethodHS256, OneLoginClaims{
		ITCode: "staff-1001",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
		},
	}).SignedString(key)
	require.NoError(t, err)

	claims, err := VerifyOneLoginPayload(raw, OneLoginConfig{SigningKey: key})

	require.NoError(t, err)
	assert.Equal(t, "staff-1001", claims.ITCode)
}

func TestVerifyOneLoginPayloadRejectsUnexpectedAlgorithmAndExpiredAssertion(t *testing.T) {
	key := []byte("one-login-test-signing-key-must-be-at-least-32-bytes")
	tests := []struct {
		name   string
		method jwt.SigningMethod
		expiry time.Time
	}{
		{
			name:   "unexpected algorithm",
			method: jwt.SigningMethodHS512,
			expiry: time.Now().Add(time.Minute),
		},
		{
			name:   "expired assertion",
			method: jwt.SigningMethodHS256,
			expiry: time.Now().Add(-time.Minute),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			raw, err := jwt.NewWithClaims(test.method, OneLoginClaims{
				ITCode: "staff-1001",
				RegisteredClaims: jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(test.expiry),
				},
			}).SignedString(key)
			require.NoError(t, err)

			_, err = VerifyOneLoginPayload(raw, OneLoginConfig{SigningKey: key})

			assert.True(t, errors.Is(err, ErrOneLoginInvalidPayload))
		})
	}
}

func TestBuildOneLoginBrokerURLPreservesBrokerParameters(t *testing.T) {
	brokerURL, err := url.Parse("https://one.example.test/login?environment=formal")
	require.NoError(t, err)
	appURL, err := url.Parse("http://gateway.example.test:3001")
	require.NoError(t, err)

	loginURL, err := BuildOneLoginBrokerURL(OneLoginConfig{
		BrokerURL: brokerURL,
		AppURL:    appURL,
	}, "http://gateway.example.test:3001/dashboard?one_login_state=state")

	require.NoError(t, err)
	parsed, err := url.Parse(loginURL)
	require.NoError(t, err)
	assert.Equal(t, "formal", parsed.Query().Get("environment"))
	assert.Equal(t, "http://gateway.example.test:3001/dashboard?one_login_state=state", parsed.Query().Get("next"))
}
