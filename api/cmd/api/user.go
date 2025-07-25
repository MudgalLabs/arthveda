package main

import (
	"arthveda/internal/feature/userprofile"
	"net/http"
)

func getMeHandler(s *userprofile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		userID := getUserIDFromContext(ctx)

		userProfile, errKind, err := s.GetUserMe(ctx, userID)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", userProfile)
	}
}
