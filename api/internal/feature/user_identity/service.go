package user_identity

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/notification"
	"arthveda/internal/feature/userprofile"
	"arthveda/internal/oauth"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	userIdentityRepository ReadWriter
	userProfileRepository  userprofile.ReadWriter
	subscriptionService    *subscription.Service
}

func NewService(
	uir ReadWriter, upr userprofile.ReadWriter,
	subscriptionService *subscription.Service,
) *Service {
	return &Service{
		userIdentityRepository: uir,
		userProfileRepository:  upr,
		subscriptionService:    subscriptionService,
	}
}

func (s *Service) OAuthGoogleCallback(ctx context.Context, code string) (*userprofile.UserProfile, service.Error, error) {
	now := time.Now().UTC()

	// Exchanging the code for an access token
	googleOAuthToken, err := oauth.GoogleConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("exchange code for token: %w", err)
	}

	// Creating an HTTP client to make authenticated request using the access key.
	// This client method also regenerate the access key using the refresh key.
	client := oauth.GoogleConfig.Client(ctx, googleOAuthToken)

	// Getting the user public details from google API endpoint
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("get user info: %w", err)
	}

	defer resp.Body.Close()

	userInfo, err := oauth.ParseGoogleUserInfo(resp.Body)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("parse google user info: %w", err)
	}

	if !userInfo.VerifiedEmail {
		return nil, service.ErrBadRequest, fmt.Errorf("Email is not verified. Please use a Google account with verified email.")
	}

	// Look for an existing user identity with the email from Google.
	userIdentity, err := s.userIdentityRepository.FindUserIdentityByEmail(ctx, userInfo.Email)
	if err != nil {
		// If the error is not ErrNotFound, something went wrong.
		if err != repository.ErrNotFound {
			return nil, service.ErrInternalServerError, fmt.Errorf("find user identity by email: %w", err)
		}
	}

	var userProfile *userprofile.UserProfile

	// No user found with the email, create a new user profile.
	if userIdentity == nil {
		userIdentity, err = new(userInfo.Email, "", "google", userInfo.VerifiedEmail)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("new user identity: %w", err)
		}

		userProfile, err = s.userIdentityRepository.SignUp(ctx, userInfo.Name, userIdentity)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("sign up: %w", err)
		}

		_, svcErr, err := s.subscriptionService.Start30DaysTrial(ctx, userProfile.UserID, now)
		if err != nil {
			return nil, svcErr, fmt.Errorf("start 30 days trial: %w", err)
		}

		_, err = notification.CreateRecipient(ctx, userProfile)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("create notification recipient: %w", err)
		}

		err = notification.SendWelcomeNotification(ctx, userProfile.UserID.String())
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("send welcome notification: %w", err)
		}
	} else {
		// The user already exists.
		userProfile, err = s.userProfileRepository.FindUserProfileByUserID(ctx, userIdentity.ID)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
		}

		fmt.Println("FOUND USER PROFILE:", userProfile)

		// Check if the user has an existing subscription.
		// If no subscription exists, start a new 30-day trial.
		_, err := s.subscriptionService.SubscriptionRepository.FindUserSubscriptionByUserID(ctx, userProfile.UserID)
		if err != nil {
			if err != repository.ErrNotFound {
				return nil, service.ErrInternalServerError, fmt.Errorf("find user subscription by user id: %w", err)
			}

			// No subscription found, start a new 30-day trial.
			_, svcErr, err := s.subscriptionService.Start30DaysTrial(ctx, userProfile.UserID, now)
			if err != nil {
				return nil, svcErr, fmt.Errorf("start 30 days trial: %w", err)
			}
		}
	}

	userIdentity.successfulSignin()

	err = s.userIdentityRepository.Update(ctx, userIdentity)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("user identity update: %w", err)
	}

	// Update the user profile with the name and avatar URL.
	// We do this even if the user profile already exists, to ensure that the latest information is stored.
	userProfile.Name = userInfo.Name
	userProfile.AvatarURL = userInfo.AvatarURL

	err = s.userProfileRepository.Update(ctx, userProfile)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("user profile update: %w", err)
	}

	return userProfile, service.ErrNone, nil
}

type SignUpPayload struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Service) SignUp(ctx context.Context, payload SignUpPayload) (*userprofile.UserProfile, service.Error, error) {
	userIdentity, err := s.userIdentityRepository.FindUserIdentityByEmail(ctx, payload.Email)
	if err != nil && err != repository.ErrNotFound {
		return nil, service.ErrInternalServerError, fmt.Errorf("find user identity by email: %w", err)
	}

	if userIdentity != nil && userIdentity.ID.String() != "" {
		return nil, service.ErrConflict, errors.New("Account with that email already exists")
	}

	newUserIdentity, err := new(payload.Email, payload.Password, "", false)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("new user identity: %w", err)
	}

	userProfile, err := s.userIdentityRepository.SignUp(ctx, payload.Name, newUserIdentity)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repository sign up: %w", err)
	}

	now := time.Now().UTC()
	_, svcErr, err := s.subscriptionService.Start30DaysTrial(ctx, userProfile.UserID, now)
	if err != nil {
		return nil, svcErr, fmt.Errorf("start 30 days trial: %w", err)
	}

	_, err = notification.CreateRecipient(ctx, userProfile)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("create notification recipient: %w", err)
	}

	err = notification.SendWelcomeNotification(ctx, userProfile.UserID.String())
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("send welcome notification: %w", err)
	}

	return userProfile, service.ErrNone, nil
}

type SignInPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Service) SignIn(ctx context.Context, payload SignInPayload) (*userprofile.UserProfile, service.Error, error) {
	userIdentity, err := s.userIdentityRepository.FindUserIdentityByEmail(ctx, payload.Email)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, errors.New("Incorrect email or password")
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("find user identity by email: %w", err)
	}

	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, userIdentity.ID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, errors.New("Incorrect email or password")
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	// If the user identity does not have a password hash, it means the user signed up using OAuth (e.g., Google).
	if userIdentity.PasswordHash == "" {
		return nil, service.ErrBadRequest, errors.New("Incorrect email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(userIdentity.PasswordHash), []byte(payload.Password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, service.ErrBadRequest, errors.New("Incorrect email or password")
		} else {
			return nil, service.ErrInternalServerError, fmt.Errorf("compare hash and password: %w", err)
		}
	}

	now := time.Now().UTC()

	// Check if the user has an existing subscription.
	// If no subscription exists, start a new 30-day trial.
	_, err = s.subscriptionService.SubscriptionRepository.FindUserSubscriptionByUserID(ctx, userProfile.UserID)
	if err != nil {
		if err != repository.ErrNotFound {
			return nil, service.ErrInternalServerError, fmt.Errorf("find user subscription by user id: %w", err)
		}

		// No subscription found, start a new 30-day trial.
		_, svcErr, err := s.subscriptionService.Start30DaysTrial(ctx, userProfile.UserID, now)
		if err != nil {
			return nil, svcErr, fmt.Errorf("start 30 days trial: %w", err)
		}
	}

	userIdentity.successfulSignin()

	err = s.userIdentityRepository.Update(ctx, userIdentity)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("user identity update: %w", err)
	}

	return userProfile, service.ErrNone, nil
}
