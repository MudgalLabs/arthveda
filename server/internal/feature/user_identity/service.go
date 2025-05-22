package user_identity

import (
	"arthveda/internal/apires"
	"arthveda/internal/env"
	"arthveda/internal/feature/user_profile"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
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

type SignUpPayload struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (payload *SignUpPayload) validate() error {
	var validationErrors service.InputValidationErrors = nil

	// Validate name
	const nameMinLength = 3

	if strings.TrimSpace(payload.Name) == "" {
		validationErrors.Add(apires.NewApiError("Name is required", "name cannot be empty", "name", payload.Name))
	}

	if rc := utf8.RuneCountInString(payload.Name); rc < nameMinLength {
		validationErrors.Add(apires.NewApiError(fmt.Sprintf("Name must be longer than %d letters", nameMinLength), fmt.Sprintf("name must be longer than %d characters in length", nameMinLength), "name", payload.Name))
	}

	// Validate email
	const emailMaxLength = 100
	var validEmailSeq = regexp.MustCompile(`^[a-zA-Z0-9+._~\-]+@[a-zA-Z0-9+._~\-]+(\.[a-zA-Z0-9+._~\-]+)+$`)

	if strings.TrimSpace(payload.Email) == "" {
		validationErrors.Add(apires.NewApiError("Email is required", "email cannot be empty", "email", payload.Email))
	}

	if strings.ContainsAny(payload.Email, " \t\r\n") {
		validationErrors.Add(apires.NewApiError("Email is invalid", "email cannot contain whitespace", "email", payload.Email))
	}

	if strings.ContainsAny(payload.Email, `"'`) {
		validationErrors.Add(apires.NewApiError("Email is invalid", "email cannot contain quotes", "email", payload.Email))
	}

	if rc := utf8.RuneCountInString(payload.Email); rc > emailMaxLength {
		validationErrors.Add(apires.NewApiError("Email is invalid", fmt.Sprintf("email cannot be over %d characters in length", emailMaxLength), "email", payload.Email))
	}

	addr, err := mail.ParseAddress(payload.Email)
	if err != nil {
		payload.Email = strings.TrimSpace(payload.Email)
		msg := strings.TrimPrefix(strings.ToLower(err.Error()), "mail: ")

		switch {
		case strings.Contains(msg, "missing '@'"):
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing the @ sign", "email", payload.Email))

		case strings.HasPrefix(payload.Email, "@"):
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing part before the @ sign", "email", payload.Email))

		case strings.HasSuffix(payload.Email, "@"):
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing part after the @ sign", "email", payload.Email))
		}

		validationErrors.Add(apires.NewApiError("Email is invalid", "email invalid input: "+err.Error(), "email", payload.Email))
	}

	if addr != nil && !validEmailSeq.MatchString(addr.Address) {
		_, end, _ := strings.Cut(addr.Address, "@")
		if !strings.Contains(end, ".") {
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing top-level domain (.com, .co.in, etc.)",
				"email", payload.Email))
		}

		validationErrors.Add(apires.NewApiError("Email is invalid", "email must be an email address, e.g. email@example.com", "email", payload.Email))
	}

	// Validate password
	const (
		passwordMinLength = 8
	)
	var (
		atleastOneLetter      = regexp.MustCompile(`[a-zA-Z]`)
		atleastOneNumber      = regexp.MustCompile(`[0-9]`)
		atleastOneSpecialChar = regexp.MustCompile(`[^a-zA-Z0-9]`)
	)

	if strings.TrimSpace(payload.Password) == "" {
		validationErrors.Add(apires.NewApiError("Password cannot be empty", "", "password", payload.Password))
	}

	rc := utf8.RuneCountInString(payload.Password)
	if rc < passwordMinLength {
		validationErrors.Add(apires.NewApiError("Password must be 8 characters long", "", "password", payload.Password))
	}

	if !atleastOneLetter.MatchString(payload.Password) {
		validationErrors.Add(apires.NewApiError("Password must contain at least one letter", "", "password", payload.Password))
	}

	if !atleastOneNumber.MatchString(payload.Password) {
		validationErrors.Add(apires.NewApiError("Password must contain at least one number", "", "password", payload.Password))
	}

	if !atleastOneSpecialChar.MatchString(payload.Password) {
		validationErrors.Add(apires.NewApiError("Password must contain at least one special character", "", "password", payload.Password))
	}

	if validationErrors != nil {
		return validationErrors
	}

	return nil
}

func (s *Service) SignUp(ctx context.Context, payload SignUpPayload) (*user_profile.UserProfile, service.Error, error) {
	err := payload.validate()
	if err != nil {
		return nil, service.ErrInvalidInput, err
	}

	userIdentity, err := s.userIdentityRepository.FindUserIdentityByEmail(ctx, payload.Email)
	if err != nil && err != repository.ErrNotFound {
		return nil, service.ErrInternalServerError, fmt.Errorf("find user identity by email: %w", err)
	}

	if userIdentity != nil && userIdentity.ID.String() != "" {
		return nil, service.ErrConflict, errors.New("Account with that email already exists")
	}

	newUserIdentity, err := newUserIdentity(payload.Email, payload.Password)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("new user identity: %w", err)
	}

	newUserProfile, err := s.userIdentityRepository.SignUp(ctx, payload.Name, newUserIdentity)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repository sign up: %w", err)
	}

	return newUserProfile, service.ErrNone, nil
}

type SignInPayload struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Service) SignIn(ctx context.Context, payload SignInPayload) (*user_profile.UserProfile, string, service.Error, error) {
	userIdentity, err := s.userIdentityRepository.FindUserIdentityByEmail(ctx, payload.Email)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, "", service.ErrBadRequest, errors.New("Incorrect email or password")
		}

		return nil, "", service.ErrInternalServerError, fmt.Errorf("find user identity by email: %w", err)
	}

	userProfile, err := s.userProfileRepository.FindUserProfileByUserID(ctx, userIdentity.ID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, "", service.ErrBadRequest, errors.New("Incorrect email or password")
		}

		return nil, "", service.ErrInternalServerError, fmt.Errorf("find user profile by user id: %w", err)
	}

	err = bcrypt.CompareHashAndPassword([]byte(userIdentity.PasswordHash), []byte(payload.Password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, "", service.ErrBadRequest, errors.New("Incorrect email or password")
		} else {
			return nil, "", service.ErrInternalServerError, fmt.Errorf("compare hash and password: %w", err)
		}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userIdentity.ID,
		"exp":     time.Now().UTC().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString([]byte(env.JWT_SECRET))
	if err != nil {
		return nil, "", service.ErrInternalServerError, fmt.Errorf("create authentication token: %w", err)
	}

	return userProfile, tokenString, service.ErrNone, nil
}
