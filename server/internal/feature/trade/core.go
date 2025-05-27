package trade

import (
	"fmt"
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

	// The ID of the trade in the broker's system, if applicable.
	// This will help us to prevent duplicate trades.
	BrokerTradeID *string `json:"broker_trade_id" db:"broker_trade_id"`
}

type CreatePayload struct {
	PositionID uuid.UUID
	Kind       Kind            `json:"kind"`
	Time       time.Time       `json:"time"`
	Quantity   decimal.Decimal `json:"quantity"`
	Price      decimal.Decimal `json:"price"`
}

func New(payload CreatePayload) (*Trade, error) {
	now := time.Now().UTC()

	ID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	trade := &Trade{
		ID:         ID,
		PositionID: payload.PositionID,
		CreatedAt:  now,
		Kind:       payload.Kind,
		Time:       payload.Time,
		Quantity:   payload.Quantity,
		Price:      payload.Price,
	}

	return trade, nil
}

type UpdatePayload struct {
	Trade
}

type Kind string

const (
	TradeKindBuy  Kind = "buy"
	TradeKindSell Kind = "sell"
)
