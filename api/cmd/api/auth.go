package main

import (
	"arthveda/internal/env"
	"arthveda/internal/feature/user_identity"
	"arthveda/internal/logger"
	"arthveda/internal/oauth"
	"arthveda/internal/session"
	"net/http"
)

func googleSignInHandler(_ *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		url := oauth.GoogleConfig.AuthCodeURL("")
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

		webURL := env.WEB_URL

		if webURL == "" {
			panic("WEB_URL is not set in environment variables")
		}

		code := r.URL.Query().Get("code")

		if code == "" {
			l.Error("Missing code parameter in OAuth callback")
			http.Redirect(w, r, webURL+"?oauth_error=true", http.StatusFound)
			return
		}

		userProfile, _, err := s.OAuthGoogleCallback(ctx, code)

		if err != nil {
			l.Errorw("Error during OAuth Google callback", "error", err)
			http.Redirect(w, r, webURL+"?oauth_error=true", http.StatusFound)
			return
		}

		session.Manager.Put(ctx, "user_id", userProfile.UserID.String())
		http.Redirect(w, r, webURL+"?oauth_success=true", http.StatusFound)
	}
}

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

		userProfile, errKind, err := s.SignIn(ctx, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		session.Manager.Put(ctx, "user_id", userProfile.UserID.String())
		successResponse(w, r, http.StatusOK, "Signin successful", userProfile)
	}
}

func signOutHandler(_ *user_identity.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session.Manager.Destroy(r.Context())
		successResponse(w, r, http.StatusOK, "Signout successful", nil)
	}
}
