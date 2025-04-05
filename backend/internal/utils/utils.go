package utils

import (
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func IsProd() bool {
	return getAppEnv() == "prod"
}

func getAppEnv() string {
	return os.Getenv("APP_ENV")
}

func VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func Now() time.Time {
	loc, _ := time.LoadLocation("Asia/Kolkata")
	return time.Now().In(loc)
}
