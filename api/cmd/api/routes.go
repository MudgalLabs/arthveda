package main

import (
	"arthveda/internal/session"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func initRouter(a *app) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(attachLoggerMiddleware)
	r.Use(logRequestMiddleware)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:6969", "https://arthveda.ceoshikhar.com", "https://*.arthveda.pages.dev", "https://arthveda.pages.dev"},
		AllowedMethods:   []string{"GET", "DELETE", "OPTIONS", "PATCH", "POST", "PUT"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(session.Manager.LoadAndSave)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		successResponse(w, r, http.StatusOK, "Hi, welcome to Arthveda API. Don't be naughty!!", nil)
	})

	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
		successResponse(w, r, http.StatusOK, "Pong", nil)
	})

	r.Route("/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Get("/oauth/google", googleSignInHandler(a.service.UserIdentityService))
			r.Get("/oauth/google/callback", googleCallbackHandler(a.service.UserIdentityService))
			r.Post("/sign-out", signOutHandler(a.service.UserIdentityService))
		})

		r.Route("/brokers", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/", getBrokersHandler(a.service.BrokerService))
		})

		r.Route("/currencies", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/", getCurrenciesHandler(a.service.CurrencyService))
		})

		r.Route("/dashboard", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/", getDashboardHandler(a.service.DashboardService))
			r.Get("/pnl-fluctuations", getDailyNetPnL(a.service.DashboardService))
		})

		r.Route("/positions", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Post("/", createPositionHandler(a.service.PositionService))
			r.Get("/{id}", getPositionHandler(a.service.PositionService))
			r.Patch("/{id}", updatePositionHandler(a.service.PositionService))
			r.Delete("/{id}", deletePositionHandler(a.service.PositionService))

			r.Post("/compute", computePositionHandler(a.service.PositionService))
			r.Post("/search", searchPositionsHandler(a.service.PositionService))
			r.Post("/import", handleImportTrades(a.service.PositionService))
		})

		r.Route("/users", func(r chi.Router) {
			r.Use(authMiddleware)

			r.Get("/me", getMeHandler(a.service.UserProfileService))
		})
	})

	return r
}
