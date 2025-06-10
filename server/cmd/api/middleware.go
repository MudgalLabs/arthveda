package main

import (
	"arthveda/internal/logger"
	"arthveda/internal/session"
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type userID string

const userIDKey userID = "user_id"

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		errorMsg := "You need to be signed in to use this route. POST /auth/sign-in to sign in."

		userID := session.Manager.GetString(ctx, "user_id")

		if userID == "" {
			l.Warnw("no user ID found in the session")
			unauthorizedErrorResponse(w, r, errorMsg, errors.New("no user ID found in session"))
			return
		}

		l.Debugw("user ID found in the session", "user_id", userID)

		// Extend the session lifetime.
		session.Manager.SetDeadline(ctx, time.Now().Add(session.Lifetime))

		ctx = context.WithValue(ctx, userIDKey, userID)

		// Add `user_id` to this ctx's logger.
		l = l.With(zap.String(string(userIDKey), userID))
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
		panic("user ID not valid in context")
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		panic(fmt.Sprintf("user ID is not uuid: %s", err.Error()))
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
