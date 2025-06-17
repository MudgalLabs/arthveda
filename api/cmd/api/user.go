package main

import (
	"arthveda/internal/feature/user_profile"
	"net/http"
)

func getMeHandler(s *user_profile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := getUserIDFromContext(ctx)

		userProfile, errKind, err := s.GetUserMe(ctx, id)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", userProfile)
	}
}
