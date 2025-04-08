package apires

const ERROR_INTERNAL = "Something went wrong. Please try again."
const ERROR_INVALID = "The request body is invalid. Check 'errors' for more details."

type ApiResStatus = string

const (
	ApiResStatusSuccess ApiResStatus = "success"
	ApiResStatusError   ApiResStatus = "error"
)

type ApiResError struct {
	Message     string `json:"message"`
	Description string `json:"description"`
}

type ApiRes struct {
	Status  ApiResStatus  `json:"status"`
	Message string        `json:"message"`
	Errors  []ApiResError `json:"errors,omitempty"`
	Data    any           `json:"data,omitempty"`
}

func New(status ApiResStatus, message string, errors []ApiResError, data any) ApiRes {
	return ApiRes{
		Status:  status,
		Message: message,
		Errors:  errors,
		Data:    &data,
	}
}

func Success(message string, data any) ApiRes {
	return ApiRes{
		Status:  ApiResStatusSuccess,
		Message: message,
		Errors:  nil,
		Data:    data,
	}
}

func Error(message string, errors []ApiResError) ApiRes {
	return ApiRes{
		Status:  ApiResStatusError,
		Message: message,
		Errors:  errors,
		Data:    nil,
	}
}

func Internal() ApiRes {
	return ApiRes{
		Status:  ApiResStatusError,
		Message: ERROR_INTERNAL,
		Errors:  nil,
		Data:    nil,
	}
}

func Invalid(errors []ApiResError) ApiRes {
	return ApiRes{
		Status:  ApiResStatusError,
		Message: ERROR_INVALID,
		Errors:  errors,
		Data:    nil,
	}
}
