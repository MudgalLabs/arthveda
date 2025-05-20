package main

import (
	"arthveda/internal/feature/user_identity"
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
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusCreated, "Signup successful", userProfile)
	}
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
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		cookie := http.Cookie{
			Name:     "Authentication",
			Value:    tokenString,
			Path:     "/",
			Domain:   "",
			MaxAge:   3600 * 24 * 30, // 30 days
			Secure:   false,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		}

		http.SetCookie(w, &cookie)

		successResponse(w, r, http.StatusOK, "Signin successful", userProfile)
	}
}

func signOutHandler(_ *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
}
