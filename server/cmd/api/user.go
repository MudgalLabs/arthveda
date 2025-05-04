package main

import (
	"arthveda/internal/features/user_profile"
	"net/http"
)

func getMeHandler(s *user_profile.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := getUserIDFromContext(r)

		userProfile, errKind, err := s.GetUserProfile(ctx, id)
		if err != nil {
			serviceErrResponse(w, r, errKind, err)
			return
		}

		successResponse(w, r, http.StatusOK, "", userProfile)
	}
}
