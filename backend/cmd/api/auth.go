package main

import (
	"arthveda/internal/lib/env"
	"arthveda/internal/lib/utils"
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"database/sql"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type signupRequestBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// TODO: Validate the request body.
// Make sure email is actually an email and password is strong.
func handleSignup(w http.ResponseWriter, r *http.Request) {
	var body signupRequestBody
	if err := readJSON(w, r, &body); err != nil {
		invalidJSONResponse(w, r, err)
		return
	}

	passwordHashBytes, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		internalServerErrorResponse(w, r, err)
		return
	}

	userByEmail, err := user.GetByEmail(body.Email)
	if err != nil && err != sql.ErrNoRows {
		internalServerErrorResponse(w, r, err)
	}

	if userByEmail.ID > 0 {
		errorResponse(w, r, http.StatusConflict, "Account already exists", nil)
		return
	}

	data := user.CreateData{
		Email:        body.Email,
		PasswordHash: string(passwordHashBytes),
	}

	u, err := user.Create(data)
	if err != nil {
		internalServerErrorResponse(w, r, err)
		return
	}

	successResponse(w, r, http.StatusCreated, "Signup successful", u)
}

type signinRequestBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func handleSignin(w http.ResponseWriter, r *http.Request) {
	l := logger.Get()

	var body signinRequestBody
	if err := readJSON(w, r, &body); err != nil {
		invalidJSONResponse(w, r, err)
		return
	}

	u, err := user.GetByEmail(body.Email)
	if err != nil {
		l.Errorw("auth.HandleSignin -> user.GetByEmail", "error", err, "service", "auth")

		if err == sql.ErrNoRows {
			errorResponse(w, r, http.StatusNotFound, "Account does not exist", nil)
			return
		}

		internalServerErrorResponse(w, r, err)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(body.Password))
	if err != nil {
		l.Errorw("bcrypt.CompareHashAndPassword", "error", err, "service", "auth")
		errorResponse(w, r, http.StatusBadRequest, "Password is incorrect", nil)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    u.ID,
		"user_email": u.Email,
		"exp":        utils.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	tokenString, err := token.SignedString([]byte(env.JWT_SECRET))
	if err != nil {
		l.Errorw("failed to create authentication token", "error", err, "service", "auth")
		internalServerErrorResponse(w, r, err)
		return
	}

	cookie := http.Cookie{
		Name:     "Authentication",
		Value:    tokenString,
		Path:     "/",
		Domain:   "",
		MaxAge:   3600, // 1 hour
		Secure:   false,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, &cookie)

	successResponse(w, r, http.StatusOK, "Signin successful", u)
}

func handleSignout(w http.ResponseWriter, r *http.Request) {
	cookie := http.Cookie{
		Name:     "Authentication",
		Value:    "",
		Path:     "/",
		Domain:   "",
		MaxAge:   -1, // 1 hour
		Secure:   false,
		HttpOnly: false,
	}

	http.SetCookie(w, &cookie)
	successResponse(w, r, http.StatusOK, "Signout successful", nil)
}
