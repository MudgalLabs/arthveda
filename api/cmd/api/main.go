package main

import (
	"arthveda/internal/dbx"
	"arthveda/internal/domain/currency"
	"arthveda/internal/env"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/dashboard"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/symbol"
	"arthveda/internal/feature/trade"
	"arthveda/internal/feature/user_broker_account"
	"arthveda/internal/feature/user_identity"
	"arthveda/internal/feature/user_profile"
	"arthveda/internal/logger"
	"arthveda/internal/oauth"
	"arthveda/internal/session"
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
	BrokerService            *broker.Service
	CurrencyService          *currency.Service
	DashboardService         *dashboard.Service
	PositionService          *position.Service
	SymbolService            *symbol.Service
	UserBrokerAccountService *user_broker_account.Service
	UserIdentityService      *user_identity.Service
	UserProfileService       *user_profile.Service
}

// Access to all repositories for reading.
// Write access only available to services.
type repositories struct {
	Broker            broker.Reader
	Dashboard         dashboard.Reader
	Position          position.Reader
	UserBrokerAccount user_broker_account.Reader
	UserIdentity      user_identity.Reader
	UserProfile       user_profile.Reader
}

func main() {
	env.Init("../.env")

	// IDK what this does but it was on the blogpost so I'm using it.
	// I think it has something to do with Go sync for multi threading?
	defer logger.Get().Sync()

	session.Init()

	db, err := dbx.Init()
	if err != nil {
		panic(err)
	}

	defer db.Close()

	if env.ENABLE_GOOGLE_OAUTH {
		oauth.InitGoogle()
	}

	brokerRepository := broker.NewRepository(db)
	userBrokerAccountRepository := user_broker_account.NewRepository(db)
	dashboardRepository := dashboard.NewRepository(db)
	userProfileRepository := user_profile.NewRepository(db)
	userIdentityRepository := user_identity.NewRepository(db)
	tradeRepository := trade.NewRepository(db)
	positionRepository := position.NewRepository(db)

	brokerService := broker.NewService(brokerRepository)
	userBrokerAccountService := user_broker_account.NewService(userBrokerAccountRepository, brokerRepository)
	currencyService := currency.NewService()
	dashboardService := dashboard.NewService(dashboardRepository, positionRepository, tradeRepository)
	positionService := position.NewService(brokerRepository, positionRepository, tradeRepository, userBrokerAccountRepository)
	symbolService := symbol.NewService(positionRepository)
	// tradeService := trade.NewService(tradeRepository)
	userIdentityService := user_identity.NewService(userIdentityRepository, userProfileRepository)
	userProfileService := user_profile.NewService(userProfileRepository)

	services := services{
		BrokerService:            brokerService,
		CurrencyService:          currencyService,
		DashboardService:         dashboardService,
		PositionService:          positionService,
		SymbolService:            symbolService,
		UserBrokerAccountService: userBrokerAccountService,
		UserIdentityService:      userIdentityService,
		UserProfileService:       userProfileService,
	}

	repositories := repositories{
		Broker:            brokerRepository,
		Dashboard:         dashboardRepository,
		Position:          positionRepository,
		UserBrokerAccount: userBrokerAccountRepository,
		UserIdentity:      userIdentityRepository,
		UserProfile:       userProfileRepository,
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
		Addr:         ":1337",
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

	l.Infow("server has started", "addr", srv.Addr, "env", env.API_ENV)

	err := srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	err = <-shutdown
	if err != nil {
		return err
	}

	l.Infow("server has stopped", "addr", srv.Addr, "env", env.API_ENV)
	return nil
}
