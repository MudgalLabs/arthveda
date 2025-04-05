package db

import (
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
	dbName := os.Getenv("DB_NAME")

	db, err := sqlx.Connect(
		"postgres",
		fmt.Sprintf("user=%s password=%s dbname=%s sslmode=disable", user, password, dbName),
	)
	if err != nil {
		return err
	}

	// Quick way to create tables in the DB.
	db.MustExec(schema)

	// Set it to global variable.
	Db = db

	return nil
}
