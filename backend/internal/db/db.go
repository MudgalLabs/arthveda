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

var DB *sqlx.DB

func Init() error {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")

	logger.Log.Debug().Msg("Connecting to database...")

	connectionStr := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s  sslmode=disable", host, port, dbName, user, password)
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
