package env

import (
	"os"

	"github.com/joho/godotenv"
)

var (
	APP_ENV              string
	PORT                 string
	DB_HOST              string
	DB_PORT              string
	DB_NAME              string
	DB_USER              string
	DB_PASSWORD          string
	DB_URL               string
	JWT_SECRET           string
	LOG_LEVEL            string
	LOG_FILE             string
	FRONTEND_URL         string
	GOOGLE_REDIRECT_URL  string
	GOOGLE_CLIENT_ID     string
	GOOGLE_CLIENT_SECRET string
)

func IsProd() bool {
	return APP_ENV == "production"
}

// When running in Docker, the environment variables are loaded by Docker from .env at the root.
func Init() {

	// We load the .env file from the parent directory just in case we are running in development mode.
	// This is because the .env file is in the root of the project.
	err := godotenv.Load("../.env")

	APP_ENV = os.Getenv("GO_APP_ENV")
	PORT = os.Getenv("GO_PORT")
	JWT_SECRET = os.Getenv("GO_JWT_SECRET")
	LOG_LEVEL = os.Getenv("GO_LOG_LEVEL")
	LOG_FILE = os.Getenv("GO_LOG_FILE")
	DB_HOST = os.Getenv("DB_HOST")
	DB_PORT = os.Getenv("DB_PORT")
	DB_NAME = os.Getenv("DB_NAME")
	DB_USER = os.Getenv("DB_USER")
	DB_PASSWORD = os.Getenv("DB_PASSWORD")
	DB_URL = os.Getenv("DB_URL")
	FRONTEND_URL = os.Getenv("FRONTEND_URL")
	GOOGLE_REDIRECT_URL = os.Getenv("GOOGLE_REDIRECT_URL")
	GOOGLE_CLIENT_ID = os.Getenv("GOOGLE_CLIENT_ID")
	GOOGLE_CLIENT_SECRET = os.Getenv("GOOGLE_CLIENT_SECRET")

	// TODO: We should validate the environment variables here to ensure they are set correctly.

	// If APP_ENV is not set, we either missed it in the .env file or the .env file was not loaded
	// by Docker or by the application above. That's why we check if APP_ENV is empty, then
	// if we got error loading the .env file, if both are true, we panic with an error message.
	if APP_ENV == "" {
		if err != nil {
			panic("Error loading .env file: " + err.Error())
		}
	}
}
