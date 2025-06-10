package apires

import "net/http"

const (
	SOMETHING_WENT_WRONG    string = "Something went wrong"
	INERTNAL_SERVER_ERROR   string = "Internal server error"
	INVALID_REQUEST_PAYLOAD string = "Invalid request payload"
	INVALID_REQUEST_QUERY   string = "Invalid request query"
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

func InternalError(err error) ApiRes {
	errs := []ApiError{}
	errs = append(errs, NewApiError(INERTNAL_SERVER_ERROR, "", "", ""))
	return new(ApiResStatusError, http.StatusInternalServerError, SOMETHING_WENT_WRONG, nil, errs)
}

func MalformedJSONError(err error) ApiRes {
	errs := []ApiError{}
	errs = append(errs, NewApiError(INVALID_REQUEST_PAYLOAD, err.Error(), "", ""))
	return new(ApiResStatusError, http.StatusBadRequest, SOMETHING_WENT_WRONG, nil, errs)
}

func InvalidInputError(errors []ApiError) ApiRes {
	return new(ApiResStatusError, http.StatusBadRequest, SOMETHING_WENT_WRONG, nil, errors)
}
