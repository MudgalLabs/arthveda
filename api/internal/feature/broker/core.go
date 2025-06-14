package broker

import (
	"fmt"

	"github.com/google/uuid"
)

type Name string

const (
	BrokerNameZerodha Name = "Zerodha"
	BrokerNameGroww   Name = "Groww"
)

type Broker struct {
	ID   uuid.UUID `json:"id"`
	Name Name      `json:"name"`
}

func new(name Name) (*Broker, error) {
	ID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	return &Broker{
		ID:   ID,
		Name: name,
	}, nil

}
