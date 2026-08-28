package middleware

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSanitizeLogPathRedactsOneLoginPayload(t *testing.T) {
	path := "/auth/one-login/callback?status=success&payload=sensitive.jwt.value&next=%2Fdashboard"

	sanitized := sanitizeLogPath(path)
	parsed, err := url.ParseRequestURI(sanitized)

	require.NoError(t, err)
	assert.NotContains(t, sanitized, "sensitive.jwt.value")
	assert.Equal(t, "[REDACTED]", parsed.Query().Get("payload"))
	assert.Equal(t, "success", parsed.Query().Get("status"))
	assert.Equal(t, "/dashboard", parsed.Query().Get("next"))
}
