package broker

import (
	"arthveda/internal/domain/types"
	"slices"

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
	BrokerNameAngelOne Name = "Angel One"
	BrokerNameGroww    Name = "Groww"
	BrokerNameUpstox   Name = "Upstox"
	BrokerNameZerodha  Name = "Zerodha"
)

var supportedInstrumentsByBroker = map[Name][]types.Instrument{
	BrokerNameAngelOne: {types.InstrumentEquity},
	BrokerNameGroww:    {types.InstrumentEquity},
	BrokerNameUpstox:   {types.InstrumentEquity, types.InstrumentOption},
	BrokerNameZerodha:  {types.InstrumentEquity, types.InstrumentFuture, types.InstrumentOption},
}

func (b *Broker) IsInstrumentSupportedForImport(instrument types.Instrument) bool {
	supportedInstruments, exists := supportedInstrumentsByBroker[b.Name]
	if !exists {
		return false
	}

	return slices.Contains(supportedInstruments, instrument)
}
