package user_identity

import (
	"arthveda/internal/apires"
	"arthveda/internal/features/user_profile"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"unicode/utf8"
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

type SignUpRequest struct {
	Email    string `json:"email" validate:"required, email"`
	Password string `json:"password" validate:"required"`
}

func (params *SignUpRequest) validate() error {
	var validationErrors service.InputValidationErrors = nil

	// Validate email
	const emailMaxLength = 100
	var validEmailSeq = regexp.MustCompile(`^[a-zA-Z0-9+._~\-]+@[a-zA-Z0-9+._~\-]+(\.[a-zA-Z0-9+._~\-]+)+$`)

	if strings.TrimSpace(params.Email) == "" {
		validationErrors.Add(apires.NewApiError("Email is required", "email cannot be empty", "email", params.Email))
	}

	if strings.ContainsAny(params.Email, " \t\r\n") {
		validationErrors.Add(apires.NewApiError("Email is invalid", "email cannot contain whitespace", "email", params.Email))
	}

	if strings.ContainsAny(params.Email, `"'`) {
		validationErrors.Add(apires.NewApiError("Email is invalid", "email cannot contain quotes", "email", params.Email))
	}

	if rc := utf8.RuneCountInString(params.Email); rc > emailMaxLength {
		validationErrors.Add(apires.NewApiError("Email is invalid", fmt.Sprintf("email cannot be over %d characters in length", emailMaxLength), "email", params.Email))
	}

	addr, err := mail.ParseAddress(params.Email)
	if err != nil {
		params.Email = strings.TrimSpace(params.Email)
		msg := strings.TrimPrefix(strings.ToLower(err.Error()), "mail: ")

		switch {
		case strings.Contains(msg, "missing '@'"):
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing the @ sign", "email", params.Email))

		case strings.HasPrefix(params.Email, "@"):
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing part before the @ sign", "email", params.Email))

		case strings.HasSuffix(params.Email, "@"):
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing part after the @ sign", "email", params.Email))
		}

		validationErrors.Add(apires.NewApiError("Email is invalid", "email invalid input: "+err.Error(), "email", params.Email))
	}

	if addr != nil && !validEmailSeq.MatchString(addr.Address) {
		_, end, _ := strings.Cut(addr.Address, "@")
		if !strings.Contains(end, ".") {
			validationErrors.Add(apires.NewApiError("Email is invalid", "email missing top-level domain (.com, .co.in, etc.)",
				"email", params.Email))
		}

		validationErrors.Add(apires.NewApiError("Email is invalid", "email must be an email address, e.g. email@example.com", "email", params.Email))
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

	if strings.TrimSpace(params.Password) == "" {
		validationErrors.Add(apires.NewApiError("Password cannot be empty", "", "password", params.Password))
	}

	rc := utf8.RuneCountInString(params.Password)
	if rc < passwordMinLength {
		validationErrors.Add(apires.NewApiError("Password must be 8 characters long", "", "password", params.Password))
	}

	if !atleastOneLetter.MatchString(params.Password) {
		validationErrors.Add(apires.NewApiError("Password must contain at least one letter", "", "password", params.Password))
	}

	if !atleastOneNumber.MatchString(params.Password) {
		validationErrors.Add(apires.NewApiError("Password must contain at least one number", "", "password", params.Password))
	}

	if !atleastOneSpecialChar.MatchString(params.Password) {
		validationErrors.Add(apires.NewApiError("Password must contain at least one special character", "", "password", params.Password))
	}

	if validationErrors != nil {
		return validationErrors
	}

	return nil
}

func (s *Service) SignUp(ctx context.Context, params SignUpRequest) (*user_profile.UserProfile, service.ErrKind, error) {
	err := params.validate()
	if err != nil {
		return nil, service.ErrInvalidInput, err
	}

	userIdentity, err := s.userIdentityRepository.FindUserIdentityByEmail(ctx, params.Email)
	if err != nil && err != repository.ErrNotFound {
		return nil, service.ErrInternalServerError, fmt.Errorf("find user identity by email: %w", err)
	}

	if userIdentity != nil && userIdentity.ID > 0 {
		return nil, service.ErrConflict, errors.New("Account with that email already exists")
	}

	newUserIdentity, err := newUserIdentity(params.Email, params.Password)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("new user identity: %w", err)
	}

	newUserProfile, err := s.userIdentityRepository.SignUp(ctx, newUserIdentity)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repository sign up: %w", err)
	}

	return newUserProfile, service.ErrNone, nil
}
