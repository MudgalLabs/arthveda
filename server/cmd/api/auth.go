package main

import (
	"arthveda/internal/env"
	"arthveda/internal/feature/user_identity"
	"arthveda/internal/logger"
	"arthveda/internal/oauth"
	"net/http"
)

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

		frontendURL := env.FRONTEND_URL

		if frontendURL == "" {
			panic("FRONTEND_URL is not set in environment variables")
		}

		code := r.URL.Query().Get("code")

		if code == "" {
			l.Error("Missing code parameter in OAuth callback")
			http.Redirect(w, r, frontendURL+"/sign-in?oauth_error=true", http.StatusFound)
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
			http.Redirect(w, r, frontendURL+"/sign-in?oauth_error=true", http.StatusFound)
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
		http.Redirect(w, r, frontendURL, http.StatusFound)
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
