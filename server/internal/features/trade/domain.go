package trade

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Trade struct {
	ID         uuid.UUID       `json:"id" db:"id"`
	PositionID uuid.UUID       `json:"position_id" db:"position_id"` // The ID of the Position to which this Trade belongs to.
	CreatedAt  time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt  *time.Time      `json:"updated_at" db:"updated_at"`
	Kind       Kind            `json:"kind" db:"kind"`
	Time       time.Time       `json:"time" db:"time"`
	Quantity   decimal.Decimal `json:"quantity" db:"quantity"`
	Price      decimal.Decimal `json:"price" db:"price"`
}

type CreatePayload struct {
	Kind     Kind            `json:"kind"`
	Time     time.Time       `json:"time"`
	Quantity decimal.Decimal `json:"quantity"`
	Price    decimal.Decimal `json:"price"`
}

type UpdatePayload struct {
	Trade
}

type Kind string

const (
	TradeKindBuy  Kind = "buy"
	TradeKindSell Kind = "sell"
)
