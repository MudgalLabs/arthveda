package main

import (
	"arthveda/internal/logger"
	"arthveda/internal/user"
	"net/http"
)

func getMeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	l := logger.FromCtx(ctx)
	id := getUserIDFromContext(r)

	u, err := user.GetByID(ctx, id)
	if err != nil {
		l.Error("failed to get user", "error", err)
		internalServerErrorResponse(w, r, err)
		return
	}

	successResponse(w, r, http.StatusOK, "", u)
}
