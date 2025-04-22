package main

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"net/http"
)

func handleGetMe(w http.ResponseWriter, r *http.Request) {
	// TODO: get logger from contextj
	l := logger.Get()
	email := getUserEmailFromContext(r)

	u, err := user.GetByEmail(email)
	if err != nil {
		l.Error("handleGetMe -> user.GetByEmail", "service", "user", "error", err)
		internalServerErrorResponse(w, r, err)
		return
	}

	successResponse(w, r, http.StatusOK, "", u)
}
