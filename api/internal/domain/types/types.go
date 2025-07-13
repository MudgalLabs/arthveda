package types

import (
	"time"

	"github.com/shopspring/decimal"
)

type TradeKind string

const (
	TradeKindBuy  TradeKind = "buy"
	TradeKindSell TradeKind = "sell"
)

type Instrument string

const (
	InstrumentEquity Instrument = "equity"
)

// ImportableTrade represents a standardized trade format that can be imported
// from various sources (file imports, broker APIs, etc.)
type ImportableTrade struct {
	Symbol     string          `json:"symbol"`
	Instrument Instrument      `json:"instrument"`
	TradeKind  TradeKind       `json:"trade_kind"`
	Quantity   decimal.Decimal `json:"quantity"`
	Price      decimal.Decimal `json:"price"`

	// Unique identifier for the order in the broker's system. There can be multiple trades for the same order.
	OrderID string `json:"order_id"`

	// Time when the trade was executed. This is the time when the order was filled.
	Time time.Time `json:"time"`
}
