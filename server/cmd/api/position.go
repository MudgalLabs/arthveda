package main

import (
	"arthveda/internal/features/position"
	"net/http"
)

func computePositionHandler(s *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var payload position.ComputePayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.Compute(ctx, payload)

		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func createPositionHandler(s *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		var payload position.AddPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		position, errKind, err := s.Create(ctx, userID, payload)

		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusCreated, "Position created successfully", position)
	}
}

func searchPositionsHandler(s *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		var payload position.SearchPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		// We only want to return the positions for the authenticated user.
		payload.Filters.UserID = &userID

		result, errKind, err := s.Search(ctx, payload)

		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
