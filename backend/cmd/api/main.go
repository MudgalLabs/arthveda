package main

import (
	"arthveda/internal/db"
	"arthveda/internal/lib/apires"
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	env.Init()

	// idk what this does but it was on the blogpost so I'm using it.
	defer logger.Get().Sync()

	err := db.Init()
	if err != nil {
		panic(err)
	}

	defer db.DB.Close()

	r := initRouter()

	err = run(r)
	if err != nil {
		panic(err)
	}
}

func initRouter() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(attachLoggerMiddleware)
	r.Use(logRequestMiddleware)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
		AllowOriginFunc: func(r *http.Request, origin string) bool {
			return true
		},
	}))

	// Set a timeout value on the request context (ctx), that will signal
	// through ctx.Done() that the request has timed out and further
	// processing should be stopped.
	r.Use(middleware.Timeout(60 * time.Second))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			writeJSON(w, http.StatusOK, apires.Success(http.StatusOK, "Hi! Welcome to Arthveda API. Don't be naughty.", nil))
		})

		r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
			writeJSON(w, http.StatusOK, apires.Success(http.StatusOK, "Pong", nil))
		})

		r.Route("/auth", func(r chi.Router) {
			r.Post("/signup", signUpHandler)
			r.Post("/signin", signInHandler)
			r.Post("/signout", signOutHandler)
		})

		r.Route("/user", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/me", getMeHandler)
		})
	})

	return r
}

func run(router http.Handler) error {
	l := logger.Get()
	srv := &http.Server{
		Addr:         ":" + env.PORT,
		Handler:      router,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	shutdown := make(chan error)

	go func() {
		quit := make(chan os.Signal, 1)

		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		l.Infow("signal caught", "signal", s.String())

		shutdown <- srv.Shutdown(ctx)
	}()

	l.Infow("server has started", "addr", srv.Addr, "env", env.APP_ENV)

	err := srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	err = <-shutdown
	if err != nil {
		return err
	}

	l.Infow("server has stopped", "addr", srv.Addr, "env", env.APP_ENV)
	return nil
}
