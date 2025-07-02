package main

import (
	"arthveda/internal/feature/symbol"
	"net/http"
)

func searchSymbolsHandler(s *symbol.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		var payload symbol.SearchSymbolsPayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.SearchSymbols(ctx, userID, payload)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
