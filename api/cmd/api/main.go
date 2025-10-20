package main

import (
	"arthveda/internal/dbx"
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/env"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/calendar"
	"arthveda/internal/feature/dashboard"
	"arthveda/internal/feature/journal_entry"
	"arthveda/internal/feature/journal_entry_content"
	"arthveda/internal/feature/notification"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/symbol"
	"arthveda/internal/feature/tag"
	"arthveda/internal/feature/trade"
	"arthveda/internal/feature/upload"
	"arthveda/internal/feature/user_identity"
	"arthveda/internal/feature/userbrokeraccount"
	"arthveda/internal/feature/userprofile"
	"arthveda/internal/logger"
	"arthveda/internal/oauth"
	"arthveda/internal/s3x"
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
	CalendarService          *calendar.Service
	CurrencyService          *currency.Service
	DashboardService         *dashboard.Service
	PositionService          *position.Service
	SubscriptionService      *subscription.Service
	SymbolService            *symbol.Service
	UploadService            *upload.Service
	UserBrokerAccountService *userbrokeraccount.Service
	UserIdentityService      *user_identity.Service
	UserProfileService       *userprofile.Service
	TagService               *tag.Service
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
	Tag               tag.Reader
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

	s3, err := s3x.Init()
	if err != nil {
		panic(err)
	}

	if env.ENABLE_GOOGLE_OAUTH {
		oauth.InitGoogle()
	}

	notification.Init()

	brokerRepository := broker.NewRepository(db)
	dashboardRepository := dashboard.NewRepository(db)
	journalEntryRepository := journal_entry.NewRepository(db)
	journalEntryContentRepository := journal_entry_content.NewRepository(db)
	positionRepository := position.NewRepository(db)
	subscriptionRepository := subscription.NewRepository(db)
	tradeRepository := trade.NewRepository(db)
	uploadRepository := upload.NewRepository(db)
	userProfileRepository := userprofile.NewRepository(db)
	userBrokerAccountRepository := userbrokeraccount.NewRepository(db)
	userIdentityRepository := user_identity.NewRepository(db)
	tagRepository := tag.NewRepository(db)

	brokerService := broker.NewService(brokerRepository)
	calendarService := calendar.NewService(positionRepository)
	currencyService := currency.NewService()
	dashboardService := dashboard.NewService(dashboardRepository, positionRepository, tradeRepository)
	journalEntryService := journal_entry.NewService(journalEntryRepository, journalEntryContentRepository)
	subcriptionService := subscription.NewService(subscriptionRepository)
	symbolService := symbol.NewService(positionRepository)
	uploadService := upload.NewService(s3, uploadRepository)
	userBrokerAccountService := userbrokeraccount.NewService(userBrokerAccountRepository, brokerRepository)
	userIdentityService := user_identity.NewService(userIdentityRepository, userProfileRepository)
	userProfileService := userprofile.NewService(userProfileRepository, subscriptionRepository,
		positionRepository, uploadRepository)
	tagService := tag.NewService(tagRepository)
	positionService := position.NewService(brokerRepository, positionRepository, tradeRepository,
		userBrokerAccountRepository, journalEntryService, uploadRepository, tagService, tagRepository)

	services := services{
		BrokerService:            brokerService,
		CalendarService:          calendarService,
		CurrencyService:          currencyService,
		DashboardService:         dashboardService,
		PositionService:          positionService,
		SubscriptionService:      subcriptionService,
		SymbolService:            symbolService,
		UploadService:            uploadService,
		UserBrokerAccountService: userBrokerAccountService,
		UserIdentityService:      userIdentityService,
		UserProfileService:       userProfileService,
		TagService:               tagService,
	}

	repositories := repositories{
		Broker:            brokerRepository,
		Dashboard:         dashboardRepository,
		Position:          positionRepository,
		Subscription:      subscriptionRepository,
		UserBrokerAccount: userBrokerAccountRepository,
		UserIdentity:      userIdentityRepository,
		UserProfile:       userProfileRepository,
		Tag:               tagRepository,
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
