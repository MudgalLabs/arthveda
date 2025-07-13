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

type ImportableTrade struct {
	Symbol     string          `json:"symbol"`
	Instrument Instrument      `json:"instrument"`
	TradeKind  TradeKind       `json:"trade_kind"`
	Quantity   decimal.Decimal `json:"quantity"`
	Price      decimal.Decimal `json:"price"`
	OrderID    string          `json:"order_id"`
	Time       time.Time       `json:"time"`
}
