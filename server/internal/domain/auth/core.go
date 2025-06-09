package auth

import (
	"arthveda/internal/env"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const ACCESS_TOKEN_EXPIRATION_TIME = time.Minute * 15     // 15 minutes
const REFRESH_TOKEN_EXPIRATION_TIME = time.Hour * 24 * 30 // 30 days

type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func NewAuthTokens(userID uuid.UUID) (*AuthTokens, error) {
	accessTokenJWT := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().UTC().Add(ACCESS_TOKEN_EXPIRATION_TIME).Unix(),
	})

	accessToken, err := accessTokenJWT.SignedString([]byte(env.JWT_SECRET))
	if err != nil {
		return nil, fmt.Errorf("create access token: %w", err)
	}

	refreshTokenJWT := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().UTC().Add(REFRESH_TOKEN_EXPIRATION_TIME).Unix(),
	})

	refreshToken, err := refreshTokenJWT.SignedString([]byte(env.JWT_SECRET))
	if err != nil {
		return nil, fmt.Errorf("create refresh token: %w", err)
	}

	return &AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func RefreshAuthTokens(refreshToken string) (*AuthTokens, error) {
	refreshClaims := jwt.MapClaims{}

	_, err := jwt.ParseWithClaims(refreshToken, &refreshClaims, func(token *jwt.Token) (any, error) {
		return []byte(env.JWT_SECRET), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse refresh token: %w", err)
	}

	userIDInRefreshToken, ok := refreshClaims["user_id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid user ID in refresh token")
	}

	userID, err := uuid.Parse(userIDInRefreshToken)
	if err != nil {
		return nil, fmt.Errorf("parse user ID from refresh token: %w", err)
	}

	authTokens, err := NewAuthTokens(userID)

	if err != nil {
		return nil, fmt.Errorf("create new auth tokens: %w", err)
	}

	return authTokens, nil
}
