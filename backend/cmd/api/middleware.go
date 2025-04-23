package main

import (
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

type userID string

const userIDKey userID = "user_id"

type userEmailKey string

const userEmail userEmailKey = "user_email"

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		errorMsg := "You need to be signed in to use this route. POST /auth/sign-in to sign in."

		cookie, err := r.Cookie("Authentication")
		if err != nil {
			l.Warnw("failed to read cookie", "error", err)
			unauthorizedErrorResponse(w, r, errorMsg, err)
			return
		}

		l.Debugw("authentication cookie found", "cookie", cookie.Value)

		token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (any, error) {
			return []byte(env.JWT_SECRET), nil
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

		if err != nil {
			l.Warnw("failed to parse the token", "error", err)
			unauthorizedErrorResponse(w, r, errorMsg, err)
			return
		}

		// TODO: Instead store the user.
		// Maybe add a caching layer using Redis?
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			id := claims["user_id"].(float64)
			ctx = context.WithValue(ctx, userIDKey, id)
			// Add `user_id` to this ctx's logger.
			l = l.With(zap.Float64(string(userIDKey), id))
		} else {
			l.Warnw("failed to check claims in the token", "error", err)
			unauthorizedErrorResponse(w, r, errorMsg, err)
			return
		}

		lrw := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		// the logger is associated with the request context here
		// so that it may be retrieved in subsequent `http.Handlers`
		r = r.WithContext(logger.WithCtx(ctx, l))

		next.ServeHTTP(lrw, r)
	})
}

func getUserIDFromContext(r *http.Request) int64 {
	id, _ := r.Context().Value(userIDKey).(float64)
	return int64(id)
}

const requestIDCtxKey = "request_id"

func attachLoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.Get()

		requestID := middleware.GetReqID(ctx)

		// create a child logger containing the request ID so that it appears
		// in all subsequent logs
		l = l.With(zap.String(string(requestIDCtxKey), requestID))

		w.Header().Add(middleware.RequestIDHeader, requestID)

		lrw := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		// the logger is associated with the request context here
		// so that it may be retrieved in subsequent `http.Handlers`
		r = r.WithContext(logger.WithCtx(ctx, l))

		next.ServeHTTP(lrw, r)
	})
}

func logRequestMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		t1 := time.Now()

		defer func() {
			status := ww.Status()

			reqLogger := l.With(
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.Int("status", status),
				zap.Duration("elapsed", time.Since(t1)),
				zap.String("client_ip", r.RemoteAddr),
			)

			if status >= 500 {
				reqLogger.Error("served with error")
			} else if status >= 400 {
				reqLogger.Warn("served with warn")
			} else {
				reqLogger.Info("served with info")
			}

		}()

		next.ServeHTTP(ww, r)
	})
}
