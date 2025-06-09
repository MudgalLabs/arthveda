package user_identity

import (
	"arthveda/internal/domain/auth"
	"arthveda/internal/feature/user_profile"
	"arthveda/internal/oauth"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"fmt"
	"time"
)

type Service struct {
	userIdentityRepository ReadWriter
	userProfileRepository  user_profile.ReadWriter
}

func NewService(uir ReadWriter, upr user_profile.ReadWriter) *Service {
	return &Service{
		userIdentityRepository: uir,
		userProfileRepository:  upr,
	}
}

func (s *Service) OAuthGoogleCallback(ctx context.Context, code string) (*user_profile.UserProfile, *auth.AuthTokens, service.Error, error) {
	// Exchanging the code for an access token
	googleOAuthToken, err := oauth.GoogleConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, nil, service.ErrInternalServerError, fmt.Errorf("exchange code for token: %w", err)
	}

	// Creating an HTTP client to make authenticated request using the access key.
	// This client method also regenerate the access key using the refresh key.
	client := oauth.GoogleConfig.Client(ctx, googleOAuthToken)

	// Getting the user public details from google API endpoint
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, nil, service.ErrInternalServerError, fmt.Errorf("get user info: %w", err)
	}

	defer resp.Body.Close()

	userInfo, err := oauth.ParseGoogleUserInfo(resp.Body)
	if err != nil {
		return nil, nil, service.ErrInternalServerError, fmt.Errorf("parse google user info: %w", err)
	}

	if !userInfo.VerifiedEmail {
		return nil, nil, service.ErrBadRequest, fmt.Errorf("Email is not verified by Google")
	}

	// Look for an existing user identity with the email from Google.
	userIdentity, err := s.userIdentityRepository.FindUserIdentityByEmail(ctx, userInfo.Email)
	if err != nil {
		// If the error is not ErrNotFound, something went wrong.
		if err != repository.ErrNotFound {
			return nil, nil, service.ErrInternalServerError, fmt.Errorf("find user identity by email: %w", err)
		}
	}

	var userProfile *user_profile.UserProfile

	// No user found with the email, create a new user profile.
	if userIdentity == nil {
		userIdentity, err = new(userInfo.Email, "google", userInfo.VerifiedEmail)
		if err != nil {
			return nil, nil, service.ErrInternalServerError, fmt.Errorf("new user identity: %w", err)
		}

		userProfile, err = s.userIdentityRepository.SignUp(ctx, userInfo.Name, userIdentity)
		if err != nil {
			return nil, nil, service.ErrInternalServerError, fmt.Errorf("sign up: %w", err)
		}
	} else {
		// The user already exists.
		userProfile, err = s.userProfileRepository.FindUserProfileByUserID(ctx, userIdentity.ID)
		if err != nil {
			return nil, nil, service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
		}
	}

	now := time.Now().UTC()

	userIdentity.LastLoginAt = &now
	err = s.userIdentityRepository.Update(ctx, userIdentity)
	if err != nil {
		return nil, nil, service.ErrInternalServerError, fmt.Errorf("user identity update: %w", err)
	}

	// Update the user profile with the name and avatar URL.
	// We do this even if the user profile already exists, to ensure that the latest information is stored.
	userProfile.Name = userInfo.Name
	userProfile.AvatarURL = userInfo.AvatarURL

	err = s.userProfileRepository.Update(ctx, userProfile)
	if err != nil {
		return nil, nil, service.ErrInternalServerError, fmt.Errorf("user profile update: %w", err)
	}

	authTokens, err := auth.NewAuthTokens(userProfile.UserID)
	if err != nil {
		return nil, nil, service.ErrInternalServerError, fmt.Errorf("create new auth tokens: %w", err)
	}

	return userProfile, authTokens, service.ErrNone, nil
}

type RefreshAuthTokens struct{}

func (s *Service) RefreshAuthTokens(ctx context.Context, refreshToken string) (*auth.AuthTokens, service.Error, error) {
	newAuthTokens, err := auth.RefreshAuthTokens(refreshToken)
	if err != nil {
		return nil, service.ErrBadRequest, fmt.Errorf("refresh auth tokens: %w", err)
	}

	return newAuthTokens, service.ErrNone, nil
}
