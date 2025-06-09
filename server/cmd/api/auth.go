package main

import (
	"arthveda/internal/feature/user_identity"
	"arthveda/internal/logger"
	"arthveda/internal/oauth"
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
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteNoneMode,
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

func googleSignInHandler(_ *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		url := oauth.GoogleConfig.AuthCodeURL("this_should_be_something_random_and_signed_like_a_jwt")
		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	}
}

func googleCallbackHandler(s *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: We should validate the state parameter here to prevent CSRF attacks.
		// The state parameter should be a random string that is signed and verified.
		// For now, we are skipping this step for simplicity.
		ctx := r.Context()
		l := logger.FromCtx(ctx)

		code := r.URL.Query().Get("code")

		if code == "" {
			l.Error("Missing code parameter in OAuth callback")
			http.Redirect(w, r, "http://localhost:6969/sign-in?oauth_error=true", http.StatusFound)
			return
		}

		_, tokenString, _, err := s.OAuthGoogleCallback(ctx, code)

		if err != nil {
			l.Errorw("Error during OAuth Google callback", "error", err)

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
			http.Redirect(w, r, "http://localhost:6969/sign-in?oauth_error=true", http.StatusFound)
			return
		}

		cookie := http.Cookie{
			Name:     "Authentication",
			Value:    tokenString,
			Path:     "/",
			Domain:   "",
			MaxAge:   3600 * 24 * 30, // 30 days
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteNoneMode,
		}

		http.SetCookie(w, &cookie)
		http.Redirect(w, r, "http://localhost:6969/dashboard", http.StatusFound)
	}
}
