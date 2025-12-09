package main

import (
	"arthveda/internal/feature/calendar"
	"errors"
	"net/http"
	"time"

	"github.com/mudgallabs/tantra/httpx"
	"github.com/mudgallabs/tantra/service"
)

func getCalendarHandler(s *calendar.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)
		tz := getUserTimezoneFromCtx(ctx)
		enforcer := getPlanEnforcerFromCtx(ctx)

		result, errKind, err := s.Get(ctx, userID, tz, enforcer)
		if err != nil {
			httpx.ServiceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func getCalendarDayHandler(s *calendar.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)
		tz := getUserTimezoneFromCtx(ctx)
		enforcer := getPlanEnforcerFromCtx(ctx)

		dateStr := r.URL.Query().Get("date")
		if dateStr == "" {
			httpx.ServiceErrResponse(w, r, service.ErrBadRequest, errors.New("missing date query param"))
			return
		}

		date, err := time.ParseInLocation("2006-01-02", dateStr, tz)
		if err != nil {
			httpx.ServiceErrResponse(w, r, service.ErrBadRequest, errors.New("invalid date format, expected YYYY-MM-DD"))
			return
		}

		result, errKind, err := s.GetDay(ctx, userID, tz, enforcer, date)
		if err != nil {
			httpx.ServiceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
