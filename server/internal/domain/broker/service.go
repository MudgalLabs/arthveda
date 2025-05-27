package broker

import (
	"arthveda/internal/service"
	"context"
	"fmt"
)

type Service struct {
	brokerRepository ReadWriter
}

func NewService(brokerRepository ReadWriter) *Service {
	return &Service{
		brokerRepository: brokerRepository,
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
	broker, err := new(payload.Name)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("new: %w", err)
	}

	err = s.brokerRepository.Create(ctx, broker)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("create: %w", err)
	}

	return broker, service.ErrNone, nil
}

func (s *Service) List(ctx context.Context) ([]*Broker, service.Error, error) {
	brokers, err := s.brokerRepository.List(ctx)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("list: %w", err)
	}

	return brokers, service.ErrNone, nil
}
