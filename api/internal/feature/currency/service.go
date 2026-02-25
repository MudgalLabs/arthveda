package currency

import (
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"context"
)

type Service struct {
	currencyRepository ReadWriter
}

func NewService(currencyRepository ReadWriter) *Service {
	return &Service{
		currencyRepository,
	}
}

func (s *Service) List(ctx context.Context) ([]*Currency, service.Error, error) {
	l := logger.FromCtx(ctx)

	currencies, err := s.currencyRepository.All(ctx)
	if err != nil {
		l.Errorf("currency.Serivce.List: %w", err)
		return nil, service.ErrInternalServerError, err
	}

	return currencies, service.ErrNone, nil
}
