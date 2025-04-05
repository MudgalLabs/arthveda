package db

import (
	"arthveda/internal/logger"
	"fmt"
	"os"

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

var Db *sqlx.DB

func Init() error {
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	name := os.Getenv("DB_NAME")
	host := os.Getenv("DB_HOST")

	connectionStr := fmt.Sprintf("user=%s password=%s dbname=%s sslmode=disable host=%s", user, password, name, host)

	logger.Log.Debug().Msg("Connecting to database...")

	db, err := sqlx.Connect("postgres", connectionStr)
	if err != nil {
		return err
	}

	logger.Log.Debug().Msg("Connected to database!")

	// Quick way to create tables in the DB.
	db.MustExec(schema)

	// Set it to global variable.
	Db = db

	return nil
}
