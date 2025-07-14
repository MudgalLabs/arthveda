package broker

import (
	"github.com/google/uuid"
)

type Broker struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	Name               Name      `json:"name" db:"name"`
	SupportsFileImport bool      `json:"supports_file_import" db:"supports_file_import"`
	SupportsTradeSync  bool      `json:"supports_trade_sync" db:"supports_trade_sync"`
}

type Name string

const (
	BrokerNameGroww   Name = "Groww"
	BrokerNameUpstox  Name = "Upstox"
	BrokerNameZerodha Name = "Zerodha"
)
