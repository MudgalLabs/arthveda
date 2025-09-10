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
	InstrumentFuture Instrument = "future"
	InstrumentOption Instrument = "option"
	InstrumentCrypto Instrument = "crypto"
)

// ImportableTrade represents a standardized trade format that can be imported
// from various sources (file imports, broker APIs, etc.)
type ImportableTrade struct {
	Symbol     string          `json:"symbol"`
	Instrument Instrument      `json:"instrument"`
	TradeKind  TradeKind       `json:"trade_kind"`
	Quantity   decimal.Decimal `json:"quantity"`
	Price      decimal.Decimal `json:"price"`
	Time       time.Time       `json:"time"`

	// Unique identifier for the order in the broker's system.
	// There can be multiple trades for the same order.
	OrderID string `json:"order_id"`

	// Sometimes, certain trades need to be ignored during processing.
	ShouldIgnore bool `json:"should_ignore"`
}
