package broker

import (
	"fmt"

	"github.com/google/uuid"
)

type Broker struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

func new(name string) (*Broker, error) {
	ID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	return &Broker{
		ID:   ID,
		Name: name,
	}, nil

}
