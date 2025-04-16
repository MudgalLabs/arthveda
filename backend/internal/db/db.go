package db

import (
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"fmt"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

var schema = `
CREATE TABLE IF NOT EXISTS users (
        ID SERIAL PRIMARY KEY,
        EMAIL VARCHAR(255) NOT NULL UNIQUE,
        PASSWORD_HASH TEXT NOT NULL,
        CREATED_AT TIMESTAMPTZ NOT NULL,
        UPDATED_AT TIMESTAMPTZ
);
`

var DB *sqlx.DB

func Init() error {
	logger.Log.Debug().Msg("Connecting to database...")

	connectionStr := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s  sslmode=disable", env.DB_HOST, env.DB_PORT, env.DB_NAME, env.DB_USER, env.DB_PASSWORD)
	logger.Log.Debug().Msg("conectionStr" + connectionStr)

	db, err := sqlx.Connect("postgres", connectionStr)
	if err != nil {
		return err
	}

	logger.Log.Debug().Msg("Connected to database!")

	// Quick way to create tables in the DB.
	db.MustExec(schema)

	// Set it to global variable.
	DB = db

	return nil
}
