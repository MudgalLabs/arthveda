package main

import (
	"arthveda/internal/feature/calendar"
	"errors"
	"net/http"
	"time"

	"github.com/mudgallabs/tantra/httpx"
	"github.com/mudgallabs/tantra/service"
)

func getCalendarAllHandler(s *calendar.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)
		tz := getUserTimezoneFromCtx(ctx)
		enforcer := getPlanEnforcerFromCtx(ctx)

		result, errKind, err := s.GetAll(ctx, userID, tz, enforcer)
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

		date, err := time.Parse(time.RFC3339, dateStr)
		if err != nil {
			httpx.ServiceErrResponse(w, r, service.ErrInvalidInput, errors.New("invalid date format, expected ISO 8601 string"))
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
