package analytics

import (
	"arthveda/internal/service"
	"context"
)

type Service struct {
	analyticsRepository ReadWriter
}

func NewService(analyticsRepository ReadWriter) *Service {
	return &Service{
		analyticsRepository,
	}
}

type StartDemoPayload struct {
	// email is the email address of the user starting the demo.
	Email string `json:"email"`
}

type StartDemoResult struct {
	// start_email is the email address of the user starting the demo.
	StartEmail string `json:"start_email"`

	// start_count is the number of times the demo has been started by the user.
	StartCount int `json:"start_count"`
}

func (s *Service) StartDemo(ctx context.Context, payload StartDemoPayload) (*StartDemoResult, service.Error, error) {
	count, err := s.analyticsRepository.StartDemo(ctx, payload)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	result := &StartDemoResult{
		StartEmail: payload.Email,
		StartCount: count,
	}

	return result, service.ErrNone, nil
}
