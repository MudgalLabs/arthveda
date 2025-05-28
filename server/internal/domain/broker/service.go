package broker

import (
	"arthveda/internal/apires"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"fmt"
)

type Service struct {
	brokerRepository ReadWriter
}

func NewService(br ReadWriter) *Service {
	return &Service{
		brokerRepository: br,
	}
}

type supportedBroker struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type CreatePayload struct {
	Name string `json:"name"`
}

func (s *Service) Create(ctx context.Context, payload CreatePayload) (*Broker, service.Error, error) {
	if payload.Name == "" {
		return nil, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError("Broker name cannot be empty", "", "name", payload.Name))
	}

	existingBroker, err := s.brokerRepository.GetByName(ctx, payload.Name)
	if err != nil && err != repository.ErrNotFound {
		return nil, service.ErrInternalServerError, fmt.Errorf("get broker by name: %w", err)
	}

	if existingBroker != nil {
		return nil, service.ErrConflict, fmt.Errorf("Broker %s already exists", payload.Name)
	}

	newBroker, err := new(payload.Name)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("new: %w", err)
	}

	err = s.brokerRepository.Create(ctx, newBroker)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("repository create: %w", err)
	}

	return newBroker, service.ErrNone, nil
}

func (s *Service) List(ctx context.Context) ([]*Broker, service.Error, error) {
	brokers, err := s.brokerRepository.List(ctx)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("list: %w", err)
	}

	return brokers, service.ErrNone, nil
}
