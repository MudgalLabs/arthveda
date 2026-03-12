package main

import (
	"arthveda/internal/feature/userprofile"
	"net/http"
)

func getMeHandler(s *userprofile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		userProfile, errKind, err := s.GetUserMe(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", userProfile)
	}
}

func markAsOnboardedHandler(s *userprofile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		errKind, err := s.MarkAsOnboarded(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "User is marked as onboarded", nil)
	}
}

func canUpdateHomeCurrency(s *userprofile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		result, errKind, err := s.CanUpdateHomeCurrency(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", map[string]any{"can_update": result})
	}
}

func updateHomeCurrency(s *userprofile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		var payload userprofile.UpdateHomeCurrencyPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		errKind, err := s.UpdateHomeCurrency(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Home currency updated successfully.", nil)
	}
}
