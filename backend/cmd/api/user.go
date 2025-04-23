package main

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"net/http"
)

func getMeHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: get logger from contextj
	l := logger.FromCtx(r.Context())
	id := getUserIDFromContext(r)

	u, err := user.GetByID(id)
	if err != nil {
		l.Error("failed to get user", "error", err)
		internalServerErrorResponse(w, r, err)
		return
	}

	successResponse(w, r, http.StatusOK, "", u)
}
