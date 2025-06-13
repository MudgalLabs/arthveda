package env

import (
	"os"

	"github.com/joho/godotenv"
)

var (
	API_ENV              string
	LOG_LEVEL            string
	LOG_FILE             string
	DB_URL               string
	WEB_URL              string
	GOOGLE_REDIRECT_URL  string
	GOOGLE_CLIENT_ID     string
	GOOGLE_CLIENT_SECRET string
)

func IsProd() bool {
	return API_ENV == "production"
}

// When running in Docker, the environment variables are loaded by Docker from .env at the root.
func Init() {

	// We load the .env file from the parent directory just in case we are running in development mode.
	// This is because the .env file is in the root of the project.
	err := godotenv.Load("../.env")

	API_ENV = os.Getenv("API_ENV")
	LOG_LEVEL = os.Getenv("API_LOG_LEVEL")
	LOG_FILE = os.Getenv("API_LOG_FILE")
	DB_URL = os.Getenv("DB_URL")
	WEB_URL = os.Getenv("WEB_URL")
	GOOGLE_REDIRECT_URL = os.Getenv("GOOGLE_REDIRECT_URL")
	GOOGLE_CLIENT_ID = os.Getenv("GOOGLE_CLIENT_ID")
	GOOGLE_CLIENT_SECRET = os.Getenv("GOOGLE_CLIENT_SECRET")

	// TODO: We should validate the environment variables here to ensure they are set correctly.

	// If APP_ENV is not set, we either missed it in the .env file or the .env file was not loaded
	// by Docker or by the application above. That's why we check if APP_ENV is empty, then
	// if we got error loading the .env file, if both are true, we panic with an error message.
	if API_ENV == "" {
		if err != nil {
			panic("Error loading .env file: " + err.Error())
		}
	}
}
