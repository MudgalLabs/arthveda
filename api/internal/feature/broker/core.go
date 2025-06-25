package broker

import (
	"github.com/google/uuid"
)

type Name string

const (
	BrokerNameGroww   Name = "Groww"
	BrokerNameUpstox  Name = "Upstox"
	BrokerNameZerodha Name = "Zerodha"
)

type Broker struct {
	ID   uuid.UUID `json:"id"`
	Name Name      `json:"name"`
}
