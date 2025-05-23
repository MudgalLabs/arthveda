package main

import (
	"arthveda/internal/domain/currency"
	"net/http"
)

func getCurrenciesHandler(s *currency.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		result := s.List(ctx)

		successResponse(w, r, http.StatusOK, "", result)
	}
}
