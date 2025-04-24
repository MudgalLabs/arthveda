package main

import (
	"arthveda/internal/apires"
	"arthveda/internal/logger"
	"net/http"
)

func successResponse(w http.ResponseWriter, r *http.Request, statusCode int, message string, data any) {
	l := logger.FromCtx(r.Context())
	l.Infow("success response", "message", message, "data", data)
	writeJSON(w, statusCode, apires.Success(statusCode, message, data))
}

func errorResponse(w http.ResponseWriter, r *http.Request, statusCode int, message string, errors []apires.ApiError) {
	l := logger.FromCtx(r.Context())
	l.Warnw("error response", "message", message, "error", errors)
	writeJSON(w, statusCode, apires.Error(statusCode, message, errors))
}

func internalServerErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Errorw("internal error response", "error", err.Error())
	writeJSON(w, http.StatusInternalServerError, apires.InternalError())
}

func invalidJSONResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Warnw("invalid JSON response", "error", err.Error())
	writeJSON(w, http.StatusBadRequest, apires.InvalidRequestError(nil))
}

func unauthorizedErrorResponse(w http.ResponseWriter, r *http.Request, message string, err error) {
	l := logger.FromCtx(r.Context())
	l.Warnw("error response", "message", message, "error", err)

	msg := "unauthorized"
	if message != "" {
		msg = message
	}

	writeJSON(w, http.StatusUnauthorized, apires.Error(http.StatusUnauthorized, msg, nil))
}
