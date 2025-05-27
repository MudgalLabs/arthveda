package main

import (
	"arthveda/internal/apires"
	"arthveda/internal/feature/position"
	"arthveda/internal/service"
	"errors"
	"net/http"

	"github.com/google/uuid"
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

		var payload position.CreatePayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		payload.CreatedBy = userID

		position, errKind, err := s.Create(ctx, payload)
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
		payload.Filters.CreatedBy = &userID

		result, errKind, err := s.Search(ctx, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}

func handleImportTrades(s *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		file, _, err := r.FormFile("file")
		if err != nil {
			badRequestResponse(w, r, errors.New("Unable to read file"))
			invalidInputResponse(w, r, service.NewInputValidationErrorsWithError(apires.NewApiError("Unable to read file", "", "file", nil)))
			return
		}

		defer file.Close()

		brokerID, err := uuid.Parse(r.FormValue("broker_id"))
		if err != nil {
			invalidInputResponse(w, r, service.NewInputValidationErrorsWithError(apires.NewApiError("Broker is invalid or not supported", "", "broker_id", r.FormValue("broker_id"))))
			return
		}

		payload := position.ImportPayload{
			File:     file,
			BrokerID: brokerID,
		}

		result, errKind, err := s.Import(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Positions imported successfully", result)
	}
}
