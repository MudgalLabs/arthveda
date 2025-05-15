package main

import (
	"arthveda/internal/features/trade"
	"fmt"
	"net/http"
)

func computeAddTradeHandler(s *trade.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var payload trade.ComputeAddTradePayload
		if err := decodeJSONRequest(&payload, r); err != nil {
			fmt.Println("ERRRR", err)
			malformedJSONResponse(w, r, err)
			return
		}

		result, errKind, err := s.ComputeAddTrade(ctx, payload)

		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
