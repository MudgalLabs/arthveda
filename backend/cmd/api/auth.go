package main

import (
	"arthveda/internal/features/user_identity"
	"arthveda/internal/service"
	"net/http"
)

func signUpHandler(s *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var payload user_identity.SignUpPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		userProfile, errKind, err := s.SignUp(ctx, payload)
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

func signInHandler(s *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var payload user_identity.SignInPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		userProfile, tokenString, errKind, err := s.SignIn(ctx, payload)
		if err != nil && errKind != service.ErrNone {
			serviceErrResponse(w, r, errKind, err)
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

		successResponse(w, r, http.StatusOK, "Signin successful", userProfile)
	}
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
