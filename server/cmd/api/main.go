package main

import (
	"arthveda/internal/dbx"
	"arthveda/internal/env"
	"arthveda/internal/features/position"
	"arthveda/internal/features/trade"
	"arthveda/internal/features/user_identity"
	"arthveda/internal/features/user_profile"
	"arthveda/internal/logger"
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// This contains all the global state that we need to run the API.
// Like all the services and repositories of Arthveda.
type app struct {
	service    services
	repository repositories
}

// All the services.
type services struct {
	UserIdentityService *user_identity.Service
	UserProfileService  *user_profile.Service
	PositionService     *position.Service
}

// Access to all repositories for reading.
// Write access only available to services.
type repositories struct {
	UserIdentity user_identity.Reader
	UserProfile  user_profile.Reader
	Position     position.Reader
}

func main() {
	env.Init()

	// IDK what this does but it was on the blogpost so I'm using it.
	// I think it has something to do with Go sync for multi threading?
	defer logger.Get().Sync()

	db, err := dbx.Init()
	if err != nil {
		panic(err)
	}

	defer db.Close()

	// UserProfile
	userProfileRepository := user_profile.NewRepository(db)
	userProfileService := user_profile.NewService(userProfileRepository)

	// UserIdentity
	userIdentityRepository := user_identity.NewRepository(db)
	userIdentityService := user_identity.NewService(userIdentityRepository, userProfileRepository)

	// Trade
	tradeRepository := trade.NewRepository(db)
	// tradeService := trade.NewService(tradeRepository)

	// Position
	positionRepository := position.NewRepository(db)
	positionService := position.NewService(positionRepository, tradeRepository)

	services := services{
		UserIdentityService: userIdentityService,
		UserProfileService:  userProfileService,
		PositionService:     positionService,
	}

	repositories := repositories{
		UserIdentity: userIdentityRepository,
		UserProfile:  userProfileRepository,
		Position:     positionRepository,
	}

	a := &app{
		service:    services,
		repository: repositories,
	}

	r := initRouter(a)

	err = run(r)
	if err != nil {
		panic(err)
	}
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
