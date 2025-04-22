package main

import (
	"arthveda/internal/lib/apires"
	"arthveda/internal/logger"
	"net/http"
)

func successResponse(w http.ResponseWriter, r *http.Request, statusCode int, message string, data any) {
	l := logger.Get()
	l.Infow("success response", "method", r.Method, "path", r.URL.Path, "message", message, "data", data)
	writeJSON(w, statusCode, apires.Success(statusCode, message, data))
}

func errorResponse(w http.ResponseWriter, r *http.Request, statusCode int, message string, errors []apires.ApiError) {
	l := logger.Get()
	l.Warnw("error response", "method", r.Method, "path", r.URL.Path, "message", message, "error", errors)
	writeJSON(w, statusCode, apires.Error(statusCode, message, errors))
}

func internalServerErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.Get()
	l.Errorw("internal error response", "method", r.Method, "path", r.URL.Path, "error", err.Error())
	writeJSON(w, http.StatusInternalServerError, apires.InternalError())
}

func invalidJSONResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.Get()
	l.Warnw("invalid JSON response", "method", r.Method, "path", r.URL.Path, "error", err.Error())
	writeJSON(w, http.StatusBadRequest, apires.InvalidRequestError(nil))
}

func unauthorizedErrorResponse(w http.ResponseWriter, r *http.Request, message string, err error) {
	l := logger.Get()
	l.Warnw("error response", "method", r.Method, "path", r.URL.Path, "message", message, "error", err)

	msg := "unauthorized"
	if message != "" {
		msg = message
	}

	writeJSON(w, http.StatusUnauthorized, apires.Error(http.StatusUnauthorized, msg, nil))
}
