package oauth

import (
	"arthveda/internal/env"
	"encoding/json"
	"io"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var GoogleConfig *oauth2.Config

func InitGoogle() {
	clientID := env.GOOGLE_CLIENT_ID
	clientSecret := env.GOOGLE_CLIENT_SECRET

	if clientID == "" || clientSecret == "" {
		panic("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables")
	}

	GoogleConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://localhost:1337/v1/auth/oauth/google/callback",
		Scopes:       []string{"email", "profile"},
		Endpoint:     google.Endpoint,
	}
}

type GoogleUserInfo struct {
	Email         string `json:"email"`
	Name          string `json:"name"`
	AvatarURL     string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

func ParseGoogleUserInfo(body io.ReadCloser) (*GoogleUserInfo, error) {
	var userInfo GoogleUserInfo
	if err := json.NewDecoder(body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}
