package main

import (
	"arthveda/internal/env"
	"arthveda/internal/session"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
)

func initRouter(a *app) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(attachLoggerMiddleware)
	r.Use(timezoneMiddleware)
	r.Use(logRequestMiddleware)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{env.WEB_URL},
		AllowedMethods:   []string{"GET", "DELETE", "OPTIONS", "PATCH", "POST", "PUT"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Timezone"},
		ExposedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(session.Manager.LoadAndSave)

	// This is just to prevent abuse of the API by limiting the number of requests
	// from a single IP address. The limit is set to 100 requests per minute.
	// We would never hit this limit in normal usage, but it is a good practice to have
	// this in place to prevent abuse.
	r.Use(httprate.LimitByIP(100, time.Minute))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		successResponse(w, r, http.StatusOK, "Hi, welcome to Arthveda API. Don't be naughty!", nil)
	})

	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
		successResponse(w, r, http.StatusOK, "Pong", nil)
	})

	r.Route("/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			if env.ENABLE_SIGN_UP {
				r.Post("/sign-up", signUpHandler(a.service.UserIdentityService))
			}

			if env.ENABLE_SIGN_IN {
				r.Post("/sign-in", signInHandler(a.service.UserIdentityService))
			}

			if env.ENABLE_GOOGLE_OAUTH {
				r.Get("/oauth/google", googleSignInHandler(a.service.UserIdentityService))
				r.Get("/oauth/google/callback", googleCallbackHandler(a.service.UserIdentityService))
			}

			r.Post("/sign-out", signOutHandler(a.service.UserIdentityService))
		})

		r.Route("/brokers", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/", getBrokersHandler(a.service.BrokerService))
			r.Get("/zerodha/redirect", zerodhaRedirectHandler(a.service.UserBrokerAccountService))
		})

		r.Route("/currencies", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/", getCurrenciesHandler(a.service.CurrencyService))
		})

		r.Route("/dashboard", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Post("/", getDashboardHandler(a.service.DashboardService))
		})

		r.Route("/positions", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Post("/", createPositionHandler(a.service.PositionService))
			r.Get("/{id}", getPositionHandler(a.service.PositionService))
			r.Patch("/{id}", updatePositionHandler(a.service.PositionService))
			r.Delete("/{id}", deletePositionHandler(a.service.PositionService))

			r.Post("/compute", computePositionHandler(a.service.PositionService))
			r.Post("/search", searchPositionsHandler(a.service.PositionService))
			r.Post("/import", importHandler(a.service.PositionService))
		})

		r.Route("/symbols", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Post("/search", searchSymbolsHandler(a.service.SymbolService))
		})

		r.Route("/users", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/me", getMeHandler(a.service.UserProfileService))
			r.Post("/me/subscription/cancel-at-period-end", cancelSubscriptionAtPeriodEndHandler(a.service.SubscriptionService))
		})

		r.Route("/user-broker-accounts", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Post("/", createUserBrokerAccountHandler(a.service.UserBrokerAccountService))
			r.Get("/", listUserBrokerAccountsHandler(a.service.UserBrokerAccountService))
			r.Put("/{id}", updateUserBrokerAccountHandler(a.service.UserBrokerAccountService))
			r.Delete("/{id}", deleteUserBrokerAccountHandler(a.service.UserBrokerAccountService))
			r.Post("/{id}/connect", connectUserBrokerAccountHandler(a.service.UserBrokerAccountService))
			r.Post("/{id}/disconnect", disconnectUserBrokerAccountHandler(a.service.UserBrokerAccountService))
			r.Post("/{id}/sync", syncUserBrokerAccountHandler(a.service.UserBrokerAccountService, a.service.PositionService))
		})

		r.Route("/webhooks", func(r chi.Router) {
			r.Post("/paddle", paddleWebhookHandler(a.service.SubscriptionService))
		})
	})

	return r
}
