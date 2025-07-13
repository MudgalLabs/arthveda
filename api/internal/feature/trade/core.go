package trade

import (
	"arthveda/internal/domain/types"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// Trade represents a trade made in a Position and the `trade` table in the database.
// TODO: Add "Exchange" field to the Trade struct to indicate which exchange the trade was made on.
// This will help us with time related logic like buckets, intraday, etc.
type Trade struct {
	ID         uuid.UUID  `json:"id" db:"id"`
	PositionID uuid.UUID  `json:"position_id" db:"position_id"` // The ID of the Position to which this Trade belongs to.
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at" db:"updated_at"`

	Time     time.Time       `json:"time" db:"time"`
	Kind     types.TradeKind `json:"kind" db:"kind"`
	Quantity decimal.Decimal `json:"quantity" db:"quantity"`
	Price    decimal.Decimal `json:"price" db:"price"`

	ChargesAmount decimal.Decimal `json:"charges_amount" db:"charges_amount"`

	// The ID of the trade in the broker's system, if applicable.
	// This will help us to prevent duplicate trades.
	BrokerTradeID *string `json:"broker_trade_id" db:"broker_trade_id"`

	// These are the fields that are computed at runtime and are not stored in the database.
	// They are used for dashboard analytics. I am still not sure if we should store them in the database.
	// I am storing ChargesAmount, so I think we should store these too??
	RealisedPnL decimal.Decimal `json:"realised_pnl" db:"realised_pnl"`
	ROI         decimal.Decimal `json:"roi" db:"roi"`

	MatchedLots []MatchedLot `json:"matched_lots" db:"matched_lots"`
}

type MatchedLot struct {
	Qty      decimal.Decimal
	PriceIn  decimal.Decimal
	PriceOut decimal.Decimal
	PnL      decimal.Decimal
}

type CreatePayload struct {
	PositionID    uuid.UUID
	Kind          types.TradeKind `json:"kind"`
	Time          time.Time       `json:"time"`
	Quantity      decimal.Decimal `json:"quantity"`
	Price         decimal.Decimal `json:"price"`
	ChargesAmount decimal.Decimal `json:"charges_amount"`
	BrokerTradeID *string         `json:"broker_trade_id"`
}

func New(payload CreatePayload) (*Trade, error) {
	now := time.Now().UTC()

	ID, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("uuid: %w", err)
	}

	trade := &Trade{
		ID:            ID,
		PositionID:    payload.PositionID,
		CreatedAt:     now,
		Kind:          payload.Kind,
		Time:          payload.Time,
		Quantity:      payload.Quantity,
		Price:         payload.Price,
		ChargesAmount: payload.ChargesAmount,
		BrokerTradeID: payload.BrokerTradeID,
	}

	return trade, nil
}

type UpdatePayload struct {
	Trade
}
