package main

import (
	"arthveda/internal/env"
	"arthveda/internal/logger"
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type userID string

const userIDKey userID = "user_id"

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)

		errorMsg := "You are not logged in. Please log in to continue."

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			unauthorizedErrorResponse(w, r, errorMsg, errors.New("missing Authoriation header"))
			return
		}

		// Extract the token from the "Authorization: Bearer <Access_Token>" format
		const prefix = "Bearer "
		if !strings.HasPrefix(authHeader, prefix) {
			unauthorizedErrorResponse(w, r, errorMsg, errors.New("invalid Authorization header"))
			return
		}

		tokenString := strings.TrimPrefix(authHeader, prefix)
		tokenString = strings.TrimSpace(tokenString)

		if tokenString == "" {
			l.Warnw("empty bearer token")
			unauthorizedErrorResponse(w, r, errorMsg, errors.New("empty bearer token"))
			return
		}

		l.Debugw("authorization token found", "token", tokenString)

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
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
			id := claims["user_id"].(string)
			ctx = context.WithValue(ctx, userIDKey, id)
			// Add `user_id` to this ctx's logger.
			l = l.With(zap.String(string(userIDKey), id))
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

func getUserIDFromContext(ctx context.Context) uuid.UUID {
	idStr, ok := ctx.Value(userIDKey).(string)
	if !ok {
		panic("user id not valid in context")
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		panic(fmt.Sprintf("user id is not uuid: %s", err.Error()))
	}
	return id
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
				zap.String("ip", r.RemoteAddr),
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
