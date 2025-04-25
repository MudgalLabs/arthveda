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
	Message     string `json:"message"`
	Description string `json:"description"`
}

type ApiRes struct {
	Status     ApiStatus  `json:"status"`
	StatusCode int        `json:"status_code"`
	Message    string     `json:"message"`
	Errors     []ApiError `json:"errors,omitempty"`
	Data       any        `json:"data,omitempty"`
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

func InvalidRequestError(errors []ApiError) ApiRes {
	return new(ApiResStatusError, http.StatusBadRequest, msgBadRequestError, nil, errors)
}
