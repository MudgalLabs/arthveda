package main

import (
	"arthveda/internal/apires"
	"arthveda/internal/domain/currency"
	"arthveda/internal/feature/position"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
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

		position, errKind, err := s.Create(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusCreated, "Position created successfully", map[string]any{"position": position})
	}
}

func getPositionHandler(s *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		positionID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("Invalid position ID", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid position ID"))
			return
		}

		position, errKind, err := s.Get(ctx, userID, positionID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusCreated, "", map[string]any{"position": position})
	}
}

func updatePositionHandler(s *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		positionID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("Invalid position ID", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid position ID"))
			return
		}

		var payload position.UpdatePayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		position, errKind, err := s.Update(ctx, userID, positionID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", map[string]any{"position": position})
	}
}

func deletePositionHandler(s *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		positionID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("Invalid position ID", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid position ID"))
			return
		}

		var payload position.UpdatePayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		errKind, err := s.Delete(ctx, userID, positionID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Position deleted successfully", nil)
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

		confirm := false
		confirmStr := r.FormValue("confirm")

		if confirmStr != "" {
			confirm, err = strconv.ParseBool(confirmStr)
			if err != nil {
				invalidInputResponse(w, r, service.NewInputValidationErrorsWithError(
					apires.NewApiError("", "Confirm must be a boolean", "confirm", confirmStr),
				))
				return
			}
		}

		currencyCode := currency.CurrencyINR
		currencyStr := r.FormValue("currency")

		if currencyStr != "" {
			currencyCode, err = currency.ParseCurrencyCode(currencyStr)
			if err != nil {
				invalidInputResponse(w, r, service.NewInputValidationErrorsWithError(
					apires.NewApiError("Invalid currency", "", "currency", currencyStr),
				))
				return
			}
		}

		riskAmount := decimal.Zero
		riskAmountStr := r.FormValue("risk_amount")
		if riskAmountStr != "" {
			riskAmount, err = decimal.NewFromString(riskAmountStr)
			if err != nil {
				invalidInputResponse(w, r, service.NewInputValidationErrorsWithError(
					apires.NewApiError("Invalid risk amount", "", "risk_amount", riskAmountStr),
				))
				return
			}

			if riskAmount.LessThanOrEqual(decimal.Zero) {
				invalidInputResponse(w, r, service.NewInputValidationErrorsWithError(
					apires.NewApiError("Risk amount must be greater than zero", "", "risk_amount", riskAmountStr),
				))
				return
			}
		}

		payload := position.ImportPayload{
			File:       file,
			BrokerID:   brokerID,
			Currency:   currencyCode,
			RiskAmount: riskAmount,
			Confirm:    confirm,
		}

		result, errKind, err := s.Import(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Positions imported successfully", result)
	}
}
