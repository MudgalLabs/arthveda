package currency

import "context"

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) List(ctx context.Context) []supportedCurrency {
	return supportedCurrencies
}
