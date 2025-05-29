package main

import (
	"arthveda/internal/feature/broker"
	"net/http"
)

func getBrokersHandler(s *broker.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		result, errKind, err := s.List(ctx)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", result)
	}
}
