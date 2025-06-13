package broker

import (
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

func (s *Service) List(ctx context.Context) ([]*Broker, service.Error, error) {
	brokers, err := s.brokerRepository.List(ctx)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("list: %w", err)
	}

	return brokers, service.ErrNone, nil
}
