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
	GOOGLE_CLIENT_ID     string
	GOOGLE_CLIENT_SECRET string
)

func IsProd() bool {
	if APP_ENV == "" {
		panic("APP_ENV is not set. Did you call env.Init()? Make sure you have set the APP_ENV in your .env file?")
	}
	return APP_ENV == "production"
}

func Init() {
	err := godotenv.Load("../.env")
	if err != nil {
		panic("error loading .env file: " + err.Error())
	}

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
	GOOGLE_CLIENT_ID = os.Getenv("GOOGLE_CLIENT_ID")
	GOOGLE_CLIENT_SECRET = os.Getenv("GOOGLE_CLIENT_SECRET")
}
