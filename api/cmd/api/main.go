package main

import (
	"arthveda/internal/dbx"
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/env"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/dashboard"
	"arthveda/internal/feature/notification"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/symbol"
	"arthveda/internal/feature/trade"
	"arthveda/internal/feature/user_identity"
	"arthveda/internal/feature/userbrokeraccount"
	"arthveda/internal/feature/userprofile"
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
	SubscriptionService      *subscription.Service
	SymbolService            *symbol.Service
	UserBrokerAccountService *userbrokeraccount.Service
	UserIdentityService      *user_identity.Service
	UserProfileService       *userprofile.Service
}

// Access to all repositories for reading.
// Write access only available to services.
type repositories struct {
	Broker            broker.Reader
	Dashboard         dashboard.Reader
	Position          position.Reader
	Subscription      subscription.Reader
	UserBrokerAccount userbrokeraccount.Reader
	UserIdentity      user_identity.Reader
	UserProfile       userprofile.Reader
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

	notification.Init()

	brokerRepository := broker.NewRepository(db)
	dashboardRepository := dashboard.NewRepository(db)
	positionRepository := position.NewRepository(db)
	subscriptionRepository := subscription.NewRepository(db)
	tradeRepository := trade.NewRepository(db)
	userProfileRepository := userprofile.NewRepository(db)
	userBrokerAccountRepository := userbrokeraccount.NewRepository(db)
	userIdentityRepository := user_identity.NewRepository(db)

	brokerService := broker.NewService(brokerRepository)
	currencyService := currency.NewService()
	dashboardService := dashboard.NewService(dashboardRepository, positionRepository, tradeRepository)
	positionService := position.NewService(brokerRepository, positionRepository, tradeRepository, userBrokerAccountRepository)
	subcriptionService := subscription.NewService(subscriptionRepository)
	symbolService := symbol.NewService(positionRepository)
	userBrokerAccountService := userbrokeraccount.NewService(userBrokerAccountRepository, brokerRepository)
	userIdentityService := user_identity.NewService(userIdentityRepository, userProfileRepository)
	userProfileService := userprofile.NewService(userProfileRepository, subscriptionRepository)

	services := services{
		BrokerService:            brokerService,
		CurrencyService:          currencyService,
		DashboardService:         dashboardService,
		PositionService:          positionService,
		SubscriptionService:      subcriptionService,
		SymbolService:            symbolService,
		UserBrokerAccountService: userBrokerAccountService,
		UserIdentityService:      userIdentityService,
		UserProfileService:       userProfileService,
	}

	repositories := repositories{
		Broker:            brokerRepository,
		Dashboard:         dashboardRepository,
		Position:          positionRepository,
		Subscription:      subscriptionRepository,
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
