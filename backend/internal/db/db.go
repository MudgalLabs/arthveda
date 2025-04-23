package db

import (
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"fmt"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var DB *sqlx.DB

func Init() error {
	l := logger.Get()
	l.Info("connecting to database")

	connectionStr := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s  sslmode=disable", env.DB_HOST, env.DB_PORT, env.DB_NAME, env.DB_USER, env.DB_PASSWORD)

	l.Debug("conectionStr: ", connectionStr)

	db, err := sqlx.Connect("postgres", connectionStr)
	if err != nil {
		return err
	}

	l.Info("connected to database")

	// Set it to global variable.
	DB = db

	return nil
}
