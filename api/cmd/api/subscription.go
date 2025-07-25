package main

import (
	"arthveda/internal/domain/subscription"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func cancelSubscriptionAtPeriodEndHandler(s *subscription.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		errKind, err := s.CancelAtPeriodEnd(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "Subscription is scheduled to cancel at period end", nil)
	}
}

func listUserSubscriptionInvoices(s *subscription.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		invoices, errKind, err := s.ListUserSubscriptionInvoices(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", invoices)
	}
}

func getUserSubscriptionInvoiceDownloadLink(s *subscription.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		invoiceIDStr := chi.URLParam(r, "id")

		invoiceID, err := uuid.Parse(invoiceIDStr)
		if err != nil {
			badRequestResponse(w, r, errors.New("Invalid invoice ID"))
			return
		}

		downloadLink, errKind, err := s.GetUserSubscriptionInvoiceDownloadLink(ctx, invoiceID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", map[string]string{"download_link": downloadLink})
	}
}
