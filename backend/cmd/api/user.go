package main

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"net/http"
)

func getMeHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: get logger from contextj
	l := logger.FromCtx(r.Context())
	email := getUserEmailFromContext(r)

	u, err := user.GetByEmail(email)
	if err != nil {
		l.Error("failed to get user", "error", err, logger.WhereKey, "getMeHandler", logger.ServiceKey, "user")
		internalServerErrorResponse(w, r, err)
		return
	}

	successResponse(w, r, http.StatusOK, "", u)
}
