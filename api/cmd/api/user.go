package main

import (
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/userprofile"
	"net/http"
)

func getMeHandler(s *userprofile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := getUserIDFromContext(ctx)

		userProfile, errKind, err := s.GetUserMe(ctx, id)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", userProfile)
	}
}

func cancelSubscriptionAtPeriodEndHandler(s *subscription.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := getUserIDFromContext(ctx)

		errKind, err := s.CancelAtPeriodEnd(ctx, id)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Subscription is scheduled to cancel at period end", nil)
	}
}
