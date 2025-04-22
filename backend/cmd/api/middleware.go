package main

import (
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"context"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

type userIDKey string

const userID userIDKey = "user_id"

type userEmailKey string

const userEmail userEmailKey = "user_email"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		l := logger.Get()
		errorMsg := "You need to be signed in to use this route. POST /auth/sign-in to sign in."

		cookie, err := r.Cookie("Authentication")
		if err != nil {
			l.Warnw("(auth.Middleware) while reading the cookie", "error", err)
			unauthorizedErrorResponse(w, r, errorMsg, err)
			return
		}

		l.Infow("Authentication cookie found", "cookie", cookie.Value)

		token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (any, error) {
			return []byte(env.JWT_SECRET), nil
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

		if err != nil {
			l.Warnw("(auth.Middleware) while parsing the token", "error", err)
			unauthorizedErrorResponse(w, r, errorMsg, err)
			return
		}

		ctx := r.Context()

		// TODO: Instead store the user.
		// Maybe add a caching layer using Redis?
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			id := claims["user_id"].(float64)
			email := claims["user_email"].(string)

			ctx = context.WithValue(ctx, userID, id)
			ctx = context.WithValue(ctx, userEmail, email)
		} else {
			l.Warnw("(auth.Middleware) while checking claims in the token", "error", err)
			unauthorizedErrorResponse(w, r, errorMsg, err)
			return
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getUserIDFromContext(r *http.Request) float64 {
	id, _ := r.Context().Value(userID).(float64)
	return id
}

func getUserEmailFromContext(r *http.Request) string {
	email, _ := r.Context().Value(userEmail).(string)
	return email
}
