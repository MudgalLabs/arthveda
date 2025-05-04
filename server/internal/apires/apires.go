package apires

import "net/http"

const (
	msgInternalError   string = "Internal server error. Please try again later."
	msgBadRequestError string = "The request body is invalid. Check 'errors' for more details if any."
)

type ApiStatus = string

const (
	ApiResStatusSuccess ApiStatus = "success"
	ApiResStatusError   ApiStatus = "error"
)

type ApiError struct {
	// Message is something that can be shown to the API users on the UI.
	Message string `json:"message"`

	// Technical details regarding the error usually for API developers.
	Description string `json:"description"`

	// Indicates which part of the request triggered the error.
	PropertyPath string `json:"property_path,omitempty"`

	// Shows the value causing the error.
	InvalidValue any `json:"invalid_value,omitempty"`
}

func NewApiError(message, description, propertyPath string, invalidValue any) ApiError {
	return ApiError{
		Message:      message,
		Description:  description,
		PropertyPath: propertyPath,
		InvalidValue: invalidValue,
	}
}

type ApiRes struct {
	// A string indicating the outcome of the request.
	// Typically `success` for successful operations and
	// `error` represents a failure in the operation.
	Status ApiStatus `json:"status"`

	// HTTP response status code.
	StatusCode int `json:"status_code"`

	// A message explaining what has happened.
	Message string `json:"message"`

	// A list of errors to explain what was wrong in the request body
	// usually when the input fails some validation.
	Errors []ApiError `json:"errors,omitempty"`

	// This could be either an object of key-value or a  list of such objects.
	Data any `json:"data,omitempty"`
}

func new(status ApiStatus, statusCode int, message string, data any, errors []ApiError) ApiRes {
	return ApiRes{
		Status:     status,
		StatusCode: statusCode,
		Message:    message,
		Errors:     errors,
		Data:       data,
	}
}

func Success(statusCode int, message string, data any) ApiRes {
	return new(ApiResStatusSuccess, statusCode, message, data, nil)
}

func Error(statusCode int, message string, errors []ApiError) ApiRes {
	return new(ApiResStatusError, statusCode, message, nil, errors)
}

func InternalError() ApiRes {
	return new(ApiResStatusError, http.StatusInternalServerError, msgInternalError, nil, nil)
}

func MalformedJSONError() ApiRes {
	return new(ApiResStatusError, http.StatusBadRequest, "Request JSON is malformed", nil, nil)
}

func InvalidInputError(errors []ApiError) ApiRes {
	return new(ApiResStatusError, http.StatusBadRequest, msgBadRequestError, nil, errors)
}
