package main

import (
	"arthveda/internal/dbx"
	"arthveda/internal/domain/broker"
	"arthveda/internal/env"
	"arthveda/internal/feature/user_identity"
	"arthveda/internal/feature/user_profile"
	"arthveda/internal/logger"
	"context"
)

type services struct {
	brokerService       broker.Service
	userIdentityService user_identity.Service
}

type app struct {
	services services
}

func main() {
	env.Init()

	defer logger.Get().Sync()

	db, err := dbx.Init()
	if err != nil {
		panic(err)
	}

	defer db.Close()

	// Initialize repositories
	brokerRepository := broker.NewRepository(db)
	userIdentityRepository := user_identity.NewRepository(db)
	userProfileRepository := user_profile.NewRepository(db)

	// Initialize services
	brokerService := broker.NewService(brokerRepository)
	userIdentityService := user_identity.NewService(userIdentityRepository, userProfileRepository)

	// Create the app instance
	app := app{
		services: services{
			brokerService:       *brokerService,
			userIdentityService: *userIdentityService,
		},
	}

	ctx := context.Background()

	// Create a user
	createUserPayload := user_identity.SignUpPayload{
		Name:     "Arthveda User",
		Email:    "user@arthveda.io",
		Password: "password@123",
	}

	_, _, err = app.services.userIdentityService.SignUp(ctx, createUserPayload)
	if err != nil {
		logger.Get().Errorf("failed to create user: %v", err)
	}

}
