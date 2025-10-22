package main

import (
	"arthveda/internal/feature/analytics"
	"net/http"

	"github.com/mudgallabs/tantra/httpx"
)

func getAnalyticsTagsHandler(service *analytics.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)
		tz := getUserTimezoneFromCtx(ctx)
		enforcer := getPlanEnforcerFromCtx(ctx)

		result, errKind, err := service.GetTags(r.Context(), userID, tz, enforcer)
		if err != nil {
			httpx.ServiceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
