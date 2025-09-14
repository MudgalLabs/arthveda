package main

import (
	"arthveda/internal/feature/calendar"
	"net/http"

	"github.com/mudgallabs/tantra/httpx"
)

func getCalendarHandler(s *calendar.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)
		tz := getUserTimezoneFromCtx(ctx)
		enforcer := getPlanEnforcerFromCtx(ctx)

		// var payload dashboard.GetCalendarPayload
		// if err := decodeJSONRequest(&payload, r); err != nil {
		// 	malformedJSONResponse(w, r, err)
		// 	return
		// }

		result, errKind, err := s.Get(ctx, userID, tz, enforcer)
		if err != nil {
			httpx.ServiceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
