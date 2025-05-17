package trade

import (
	"time"

	"github.com/shopspring/decimal"
)

type Trade struct {
	ID       int64           `json:"id" db:"id"`
	TradeID  int64           `json:"trade_id" db:"trade_id"` // The ID of the Trade to which this SubTrade belongs to.
	Kind     Kind            `json:"kind" db:"kind"`
	Time     time.Time       `json:"time" db:"time"`
	Quantity decimal.Decimal `json:"quantity" db:"quantity"`
	Price    decimal.Decimal `json:"price" db:"price"`
}

type Kind string

const (
	TradeKindBuy  Kind = "buy"
	TradeKindSell Kind = "sell"
)
