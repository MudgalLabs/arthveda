package env

import (
	"os"

	"github.com/joho/godotenv"
)

var (
	APP_ENV     string
	PORT        string
	DB_HOST     string
	DB_PORT     string
	DB_NAME     string
	DB_USER     string
	DB_PASSWORD string
	JWT_SECRET  string
	LOG_LEVEL   string
	LOG_FILE    string
)

func IsProd() bool {
	return os.Getenv("GO_APP_ENV") == "production"
}

// NOTE: We only read variables in prod, in dev we have hard coded everything.
func Init() {
	godotenv.Load()

	if IsProd() {
		APP_ENV = "production"
		PORT = os.Getenv("GO_PORT")
		JWT_SECRET = os.Getenv("GO_JWT_SECRET")
		LOG_LEVEL = os.Getenv("GO_LOG_LEVEL")
		LOG_FILE = os.Getenv("GO_LOG_FILE")
		DB_HOST = os.Getenv("DB_HOST")
		DB_PORT = os.Getenv("DB_PORT")
		DB_NAME = os.Getenv("DB_NAME")
		DB_USER = os.Getenv("DB_USER")
		DB_PASSWORD = os.Getenv("DB_PASSWORD")
	} else {
		APP_ENV = "development"
		PORT = "1337"
		JWT_SECRET = "this_is_a_very_strong_jwt_secret_i_promise"
		LOG_LEVEL = "error"
		LOG_FILE = "arthveda_go.log"
		DB_HOST = "localhost"
		DB_PORT = "42069"
		DB_NAME = "postgres"
		DB_USER = "postgres"
		DB_PASSWORD = "postgres"
	}
}
