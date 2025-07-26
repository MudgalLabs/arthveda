package main

import (
	"arthveda/internal/feature/dashboard"
	"net/http"
)

func getDashboardHandler(s *dashboard.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)
		tz := getUserTimezoneFromCtx(ctx)
		enforcer := getPlanEnforcerFromCtx(ctx)

		var payload dashboard.GetDashboardPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.Get(ctx, userID, tz, enforcer, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
