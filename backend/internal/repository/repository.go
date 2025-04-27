package repository

import (
	"errors"
)

// Errors that any repository may return.
var (
	ErrNotFound = errors.New("resource not found")
)
