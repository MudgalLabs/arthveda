package broker

import "context"

type Service struct{}

func NewService() *Service {
	return &Service{}

}

type supportedBroker struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

var supportedBrokers = []supportedBroker{
	{ID: "1", Name: "Zerodha"},
}

func (s *Service) List(ctx context.Context) []supportedBroker {
	return supportedBrokers
}
