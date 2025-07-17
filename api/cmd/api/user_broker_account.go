package main

import (
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/types"
	"arthveda/internal/env"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/user_broker_account"
	"arthveda/internal/logger"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func createUserBrokerAccountHandler(s *user_broker_account.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		var payload user_broker_account.CreatePayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		account, errKind, err := s.Create(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusCreated, "User broker account created successfully", account)
	}
}

func listUserBrokerAccountsHandler(s *user_broker_account.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		accounts, errKind, err := s.List(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", accounts)
	}
}

func updateUserBrokerAccountHandler(s *user_broker_account.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		accountID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("invalid user broker account id", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid Broker Account ID"))
			return
		}

		var payload user_broker_account.UpdatePayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		account, errKind, err := s.Update(ctx, userID, accountID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "User broker account updated successfully", account)
	}
}

func deleteUserBrokerAccountHandler(s *user_broker_account.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		accountID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("invalid user broker account id", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid Broker Account ID"))
			return
		}

		errKind, err := s.Delete(ctx, userID, accountID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "User broker account deleted successfully", nil)
	}
}

func connectUserBrokerAccountHandler(s *user_broker_account.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		ubaID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("invalid user broker account id", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid Broker Account ID"))
			return
		}

		var payload user_broker_account.ConnectPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.Connect(ctx, userID, ubaID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "User must be redirected to the login URL to complete the connect", result)
	}
}

func disconnectUserBrokerAccountHandler(s *user_broker_account.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		ubaID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("invalid user broker account id", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid Broker Account ID"))
			return
		}

		errKind, err := s.Disconnect(ctx, userID, ubaID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "User broker account connected successfully", nil)
	}
}

func syncUserBrokerAccountHandler(s *user_broker_account.Service, ps *position.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromCtx(ctx)
		userID := getUserIDFromContext(ctx)
		id := chi.URLParam(r, "id")

		ubaID, err := uuid.Parse(id)
		if err != nil {
			l.Warnw("invalid user broker account id", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid Broker Account ID"))
			return
		}

		type finalResult struct {
			*user_broker_account.SyncResult
			*position.ImportResult
		}

		syncResult, errKind, err := s.Sync(ctx, userID, ubaID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		var importResult *position.ImportResult
		if len(syncResult.ImportableTrades) > 0 {
			options := position.ImportPayload{
				UserID:                   userID,
				UserBrokerAccountID:      ubaID,
				Broker:                   syncResult.Broker,
				RiskAmount:               decimal.Zero,
				Currency:                 currency.CurrencyINR,
				ChargesCalculationMethod: position.ChargesCalculationMethodAuto,
				ManualChargeAmount:       decimal.Zero,
				Instrument:               types.InstrumentEquity,
				Confirm:                  true,
				Force:                    true,
			}

			importResult, errKind, err = ps.Import(ctx, syncResult.ImportableTrades, options)
			if err != nil {
				serviceErrResponse(w, r, errKind, err)
				return
			}
		}

		result := finalResult{
			SyncResult:   syncResult,
			ImportResult: importResult,
		}

		successResponse(w, r, http.StatusOK, "User broker account synced successfully", result)
	}
}

func zerodhaRedirectHandler(s *user_broker_account.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		// Get "uba_id"  from query parameters
		ubaIDStr := r.URL.Query().Get("uba_id")
		if ubaIDStr == "" {
			badRequestResponse(w, r, errors.New("Missing uba_id parameter"))
			return
		}

		ubaID, err := uuid.Parse(ubaIDStr)
		if err != nil {
			badRequestResponse(w, r, errors.New("Invalid uba_id parameter"))
			return
		}

		// Get "request_token"  from query parameters
		requestToken := r.URL.Query().Get("request_token")
		if requestToken == "" {
			badRequestResponse(w, r, errors.New("Missing request_token parameter"))
			return
		}

		// Get "user_id"  from query parameters
		userIDStr := r.URL.Query().Get("user_id")
		if userIDStr == "" {
			badRequestResponse(w, r, errors.New("Missing user_id parameter"))
			return
		}

		errKind, err := s.ZerodhaRedirect(ctx, userID, ubaID, requestToken)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		webURL := env.WEB_URL
		http.Redirect(w, r, webURL+"/settings/broker-accounts", http.StatusFound)
	}
}
