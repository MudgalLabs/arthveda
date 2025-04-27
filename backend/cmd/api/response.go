package main

import (
	"arthveda/internal/apires"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"net/http"
)

func successResponse(w http.ResponseWriter, r *http.Request, statusCode int, message string, data any) {
	l := logger.FromCtx(r.Context())
	l.Infow("success response", "message", message, "data", data)
	writeJSONResponse(w, statusCode, apires.Success(statusCode, message, data))
}

func errorResponse(w http.ResponseWriter, r *http.Request, statusCode int, message string, errors []apires.ApiError) {
	l := logger.FromCtx(r.Context())
	l.Errorw("error response", "message", message, "error", errors)
	writeJSONResponse(w, statusCode, apires.Error(statusCode, message, errors))
}

func internalServerErrorResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Errorw("internal error response", "error", err.Error())
	writeJSONResponse(w, http.StatusInternalServerError, apires.InternalError())
}

func malformedJSONResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Warnw("malformed json response", "error", err.Error())
	writeJSONResponse(w, http.StatusBadRequest, apires.MalformedJSONError)
}

func invalidInputResponse(w http.ResponseWriter, r *http.Request, errs service.InputValidationErrors) {
	l := logger.FromCtx(r.Context())
	l.Warnw("invalid input response", "error", errs)
	writeJSONResponse(w, http.StatusBadRequest, apires.InvalidInputError(errs))
}

func conflictResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Warnw("conflict response", "error", err)
	writeJSONResponse(w, http.StatusConflict, apires.Error(http.StatusConflict, err.Error(), nil))
}

func notFoundResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Warnw("not found response", "error", err)
	writeJSONResponse(w, http.StatusNotFound, apires.Error(http.StatusNotFound, err.Error(), nil))
}

func unauthorizedErrorResponse(w http.ResponseWriter, r *http.Request, message string, err error) {
	l := logger.FromCtx(r.Context())
	l.Warnw("error response", "message", message, "error", err)

	msg := "unauthorized"
	if message != "" {
		msg = message
	}

	writeJSONResponse(w, http.StatusUnauthorized, apires.Error(http.StatusUnauthorized, msg, nil))
}

func serviceErrResponse(w http.ResponseWriter, r *http.Request, errKind service.ErrKind, err error) {
	l := logger.FromCtx(r.Context())

	switch {
	case errKind == service.ErrConflict:
		conflictResponse(w, r, err)
		return

	case errKind == service.ErrInvalidInput:
		invalidInputResponse(w, r, err.(service.InputValidationErrors))
		return

	case errKind == service.ErrNotFound:
		notFoundResponse(w, r, err)
		return

	case errKind == service.ErrInternalServerError:
		internalServerErrorResponse(w, r, err)
		return

	default:
		l.DPanicw("reached an unreachable switch-case", "error", err, "errKind", errKind)
	}
}
