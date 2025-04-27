package main

import (
	"arthveda/internal/env"
	"arthveda/internal/features/user_identity"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"arthveda/internal/user"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func signUpHandler(s *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var req user_identity.SignUpRequest
		if err := decodeJSONRequest(&req, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		userProfile, errKind, err := s.SignUp(ctx, req)
		if err != nil && errKind != service.ErrNone {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusCreated, "Signup successful", userProfile)
	}
}

type signinRequestBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func signInHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	l := logger.FromCtx(ctx)

	var body signinRequestBody
	if err := decodeJSONRequest(&body, r); err != nil {
		malformedJSONResponse(w, r, err)
		return
	}

	u, err := user.GetByEmail(body.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			errorResponse(w, r, http.StatusNotFound, "Incorrect email or password", nil)
			return
		}

		internalServerErrorResponse(w, r, err)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(body.Password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			errorResponse(w, r, http.StatusBadRequest, "Incorrect email or password", nil)
			return
		} else {
			l.DPanicw("failed to compare hash and password", "error", err)
			internalServerErrorResponse(w, r, err)
			return
		}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": u.ID,
		"exp":     time.Now().UTC().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString([]byte(env.JWT_SECRET))
	if err != nil {
		l.Errorw("failed to create authentication token", "error", err)
		internalServerErrorResponse(w, r, err)
		return
	}

	cookie := http.Cookie{
		Name:     "Authentication",
		Value:    tokenString,
		Path:     "/",
		Domain:   "",
		MaxAge:   3600, // 1 hour
		Secure:   false,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, &cookie)

	successResponse(w, r, http.StatusOK, "Signin successful", u)
}

func signOutHandler(w http.ResponseWriter, r *http.Request) {
	cookie := http.Cookie{
		Name:     "Authentication",
		Value:    "",
		Path:     "/",
		Domain:   "",
		MaxAge:   -1, // 1 hour
		Secure:   false,
		HttpOnly: false,
	}

	http.SetCookie(w, &cookie)
	successResponse(w, r, http.StatusOK, "Signout successful", nil)
}
