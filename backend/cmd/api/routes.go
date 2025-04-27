package main

import (
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
		AllowedOrigins:   []string{"http://localhost"},
		AllowedMethods:   []string{"GET", "DELETE", "OPTIONS", "PATCH", "POST", "PUT"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
		AllowOriginFunc: func(r *http.Request, origin string) bool {
			// FIXME: In prod, this should actually be allowing only the prod URL which
			// would most likely be arthveda.io or app.arthveda.io
			return true
		},
	}))

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			successResponse(w, r, http.StatusOK, "Hi! Welcome to Arthveda API. Don't be naughty.", nil)
		})

		r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
			successResponse(w, r, http.StatusOK, "Pong", nil)
		})

		r.Route("/auth", func(r chi.Router) {
			r.Post("/sign-up", signUpHandler(a.service.UserIdentityService))
			r.Post("/sign-in", signInHandler(a.service.UserIdentityService))
			r.Post("/sign-out", signOutHandler)
		})

		r.Route("/user", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/me", getMeHandler)
		})
	})

	return r
}
