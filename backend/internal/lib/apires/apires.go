package apires

import "net/http"

const (
	msgInternalError   string = "Something went wrong. Please try again."
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

func New(status ApiStatus, statusCode int, message string, errors []ApiError, data any) ApiRes {
	return ApiRes{
		Status:     status,
		StatusCode: statusCode,
		Message:    message,
		Errors:     errors,
		Data:       &data,
	}
}

func Success(statusCode int, message string, data any) ApiRes {
	return ApiRes{
		Status:     ApiResStatusSuccess,
		StatusCode: statusCode,
		Message:    message,
		Errors:     nil,
		Data:       data,
	}
}

func Error(statusCode int, message string, errors []ApiError) ApiRes {
	return ApiRes{
		Status:     ApiResStatusError,
		StatusCode: statusCode,
		Message:    message,
		Errors:     errors,
		Data:       nil,
	}
}

func InternalError() ApiRes {
	return ApiRes{
		Status:     ApiResStatusError,
		StatusCode: http.StatusInternalServerError,
		Message:    msgInternalError,
		Errors:     nil,
		Data:       nil,
	}
}

func InvalidRequestError(errors []ApiError) ApiRes {
	return ApiRes{
		Status:     ApiResStatusError,
		StatusCode: http.StatusBadRequest,
		Message:    msgBadRequestError,
		Errors:     errors,
		Data:       nil,
	}
}
