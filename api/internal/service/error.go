package service

import (
	"arthveda/internal/apires"
)

// Error is an error that any service may return.
type Error string

const (
	ErrNone Error = "no error"

	ErrBadRequest          Error = "bad request"
	ErrUnauthorized        Error = "unauthorized"
	ErrConflict            Error = "resource creation failed because it is conflicting with another resource"
	ErrInvalidInput        Error = "input is missing required fields or has bad values for parameters"
	ErrInternalServerError Error = "internal server error"
	ErrNotFound            Error = "resource does not exist"
	ErrPlanLimitExceeded   Error = "plan limit exceeded"
)

// A service must return this as `error` if `ErrKind` is `ErrInvalidInput`.

type InputValidationErrors []apires.ApiError

func (errs *InputValidationErrors) Add(err apires.ApiError) {
	if *errs == nil {
		*errs = []apires.ApiError{}
	}

	*errs = append(*errs, err)
}

func NewInputValidationErrorsWithError(err apires.ApiError) InputValidationErrors {
	errs := InputValidationErrors{}
	errs = append(errs, err)
	return errs
}

// !!!! **** DO NOT CALL THIS FUNCTION! **** !!!!
//
// Implementing it so that we can use `error` when validating inputs.
func (errors InputValidationErrors) Error() string {
	return ""
}
