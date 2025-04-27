package service

import "arthveda/internal/apires"

// Kind of errors that any service may return.
type ErrKind string

const (
	ErrNone ErrKind = "no error"

	ErrUnauthorized        ErrKind = "unauthorized"
	ErrConflict            ErrKind = "resource creation failed because it is conflicting with another resource"
	ErrInvalidInput        ErrKind = "input is missing required fields or has bad values for parameters"
	ErrInternalServerError ErrKind = "something unexpected happened"
	ErrNotFound            ErrKind = "resource does not exist"
)

// A service must return this as `error` if `ErrKind` is `ErrInvalidInput`.
type InputValidationErrors []apires.ApiError

func (errs *InputValidationErrors) Add(err apires.ApiError) {
	if *errs == nil {
		*errs = []apires.ApiError{}
	}

	*errs = append(*errs, err)
}

// !!!! **** DO NOT CALL THIS FUNCTION! **** !!!!
//
// Implementing it so that we can use `error` when validating inputs.
func (errors InputValidationErrors) Error() string {
	return ""
}
