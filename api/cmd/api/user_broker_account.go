package main

import (
	"arthveda/internal/feature/user_broker_account"
	"arthveda/internal/logger"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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
			l.Warnw("Invalid position ID", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid broker account ID"))
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
			l.Warnw("Invalid position ID", "id", id, "error", err.Error())
			badRequestResponse(w, r, errors.New("Invalid broker account ID"))
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
