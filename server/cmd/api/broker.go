package main

import (
	"arthveda/internal/domain/broker"
	"net/http"
)

func getBrokersHandler(s *broker.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		result := s.List(ctx)

		successResponse(w, r, http.StatusOK, "", result)
	}
}
