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
	writeJSONResponse(w, http.StatusInternalServerError, apires.InternalError(err))
}

func malformedJSONResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Infow("malformed json response", "error", err.Error())
	writeJSONResponse(w, http.StatusBadRequest, apires.MalformedJSONError(err))
}

func malformedQueryResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Infow("malformed query response", "error", err.Error())
	writeJSONResponse(w, http.StatusBadRequest, apires.InvalidQueryError(err))
}

func invalidInputResponse(w http.ResponseWriter, r *http.Request, errs service.InputValidationErrors) {
	l := logger.FromCtx(r.Context())
	l.Infow("invalid input response", "error", errs)
	writeJSONResponse(w, http.StatusBadRequest, apires.InvalidInputError(errs))
}

func conflictResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Warnw("conflict response", "error", err)
	writeJSONResponse(w, http.StatusConflict, apires.Error(http.StatusConflict, err.Error(), nil))
}

func notFoundResponse(w http.ResponseWriter, r *http.Request, err error) {
	l := logger.FromCtx(r.Context())
	l.Infow("not found response", "error", err)
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

// A helper function that translates Service.ErrKind and error to an HTTP response.
func serviceErrResponse(w http.ResponseWriter, r *http.Request, errKind service.ErrKind, err error) {
	l := logger.FromCtx(r.Context())

	// Just a safety net.
	if err == nil || errKind == service.ErrNone {
		l.DPanicw("errKind and/ore err is not present", "error", err, "errKind", errKind)
		internalServerErrorResponse(w, r, err)
		return
	}

	switch {
	case errKind == service.ErrUnauthorized:
		unauthorizedErrorResponse(w, r, err.Error(), err)
		return

	case errKind == service.ErrConflict:
		conflictResponse(w, r, err)
		return

	case errKind == service.ErrInvalidInput:
		inputValidationErrors, ok := err.(service.InputValidationErrors)

		if !ok {
			inputValidationErrors = service.NewInputValidationErrorsWithError(apires.NewApiError("Something went wrong", err.Error(), "", nil))
		}

		invalidInputResponse(w, r, inputValidationErrors)
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
