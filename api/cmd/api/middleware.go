package main

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/logger"
	"arthveda/internal/repository"
	"arthveda/internal/session"
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type contextKey string

const ctxUserIDKey contextKey = "user_id"
const ctxUserTimezoneKey contextKey = "user_timezone"
const ctxPlanEnforcerKey contextKey = "plan_enforcer"

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		errorMsg := "You need to be signed in to use this route. POST /auth/sign-in to sign in."

		// Check if the session cookie exists
		_, err := r.Cookie("session")
		if err != nil {
			if errors.Is(err, http.ErrNoCookie) {
				l.Warn("no session found")
				unauthorizedErrorResponse(w, r, errorMsg, errors.New("no session found"))
				return
			}
		}

		userID := session.Manager.GetString(ctx, "user_id")

		if userID == "" {
			l.Warnw("no user ID found in the session")
			unauthorizedErrorResponse(w, r, errorMsg, errors.New("no user ID found in session"))
			return
		}

		l.Debugw("user ID found in the session", "user_id", userID)

		// Extend the session lifetime.
		session.Manager.SetDeadline(ctx, time.Now().Add(session.Lifetime))

		ctx = context.WithValue(ctx, ctxUserIDKey, userID)

		// Add `user_id` to this ctx's logger.
		l = l.With(zap.String(string(ctxUserIDKey), userID))
		lrw := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		// the logger is associated with the request context here
		// so that it may be retrieved in subsequent `http.Handlers`
		r = r.WithContext(logger.WithCtx(ctx, l))

		next.ServeHTTP(lrw, r)
	})
}

func getUserIDFromContext(ctx context.Context) uuid.UUID {
	idStr, ok := ctx.Value(ctxUserIDKey).(string)
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

			if status >= 500 && status < 600 {
				reqLogger.Errorf("[ %d SERVER ERROR ]", status)
			} else if status >= 400 && status < 500 {
				reqLogger.Infof("[ %d CLIENT ERROR ]", status)
			} else if status >= 300 && status < 400 {
				reqLogger.Infof("[ %d REDIRECTION ]", status)
			} else if status >= 200 && status < 300 {
				reqLogger.Infof("[ %d SUCCESS ]", status)
			}
		}()

		next.ServeHTTP(ww, r)
	})
}

func timezoneMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tz := r.Header.Get("X-Timezone")
		tz = strings.TrimSpace(tz)

		if tz == "" {
			tz = "UTC" // fallback
		}

		loc, err := time.LoadLocation(tz)
		if err != nil {
			loc = time.UTC
		}

		ctx := context.WithValue(r.Context(), ctxUserTimezoneKey, loc)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getUserTimezoneFromCtx(ctx context.Context) *time.Location {
	loc, ok := ctx.Value(ctxUserTimezoneKey).(*time.Location)
	if !ok || loc == nil {
		return time.UTC
	}
	return loc
}

func planEnforcerMiddleware(subscriptionService *subscription.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			userID := getUserIDFromContext(ctx)
			now := time.Now().UTC()

			sub, err := subscriptionService.SubscriptionRepository.FindUserSubscriptionByUserID(ctx, userID)
			if err != nil {
				if err != repository.ErrNotFound {
					internalServerErrorResponse(w, r, err)
					return
				}

				sub = nil
			}

			if sub.ValidUntil.Before(now) {
				// Mark the subscription as expired.
				err = subscriptionService.Expired(ctx, sub.Provider, sub.ExternalRef)
				if err != nil {
					internalServerErrorResponse(w, r, err)
					return
				}

				sub = nil
			}

			planEnforcer := subscription.NewPlanEnforcer(sub)
			updatedCtx := context.WithValue(r.Context(), ctxPlanEnforcerKey, planEnforcer)
			next.ServeHTTP(w, r.WithContext(updatedCtx))
		})
	}
}

func getPlanEnforcerFromCtx(ctx context.Context) *subscription.PlanEnforcer {
	enforcer, ok := ctx.Value(ctxPlanEnforcerKey).(*subscription.PlanEnforcer)
	if !ok {
		panic("plan enforcer not found in context")
	}
	return enforcer
}
