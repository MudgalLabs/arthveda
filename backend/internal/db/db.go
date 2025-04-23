package db

import (
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Init() error {
	l := logger.Get()
	l.Info("connecting to database")

	connectionStr := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable", env.DB_HOST, env.DB_PORT, env.DB_NAME, env.DB_USER, env.DB_PASSWORD)

	l.Debug("conectionStr: ", connectionStr)

	config, err := pgxpool.ParseConfig(connectionStr)
	if err != nil {
		log.Panic(err)
	}
	db, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Panic(err)
	}

	l.Info("connected to database")

	// Set it to global variable.
	DB = db

	return nil
}
