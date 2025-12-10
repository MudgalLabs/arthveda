package trade

import (
	"arthveda/internal/domain/types"
	"fmt"
	"strings"
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
	RealisedGrossPnL decimal.Decimal `json:"realised_gross_pnl" db:"realised_gross_pnl"`
	RealisedNetPnL   decimal.Decimal `json:"realised_net_pnl" db:"realised_net_pnl"`
	ROI              decimal.Decimal `json:"roi" db:"roi"`

	MatchedLots []MatchedLot `json:"matched_lots" db:"matched_lots"`
}

type MatchedLot struct {
	Qty      decimal.Decimal `json:"qty" db:"qty"`
	PriceIn  decimal.Decimal `json:"price_in" db:"price_in"`
	PriceOut decimal.Decimal `json:"price_out" db:"price_out"`
	PnL      decimal.Decimal `json:"pnl" db:"pnl"`
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

var FnOSeries = []string{"jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"}

// IsSymbolFuture checks if the given symbol represents a Futures contract.
func IsSymbolFuture(symbol string) bool {
	if symbol == "" {
		return false
	}
	lowercaseSymbol := strings.ToLower(symbol)
	hasMonthSeries := false
	for _, series := range FnOSeries {
		if strings.Contains(lowercaseSymbol, series) {
			hasMonthSeries = true
			break
		}
	}
	if hasMonthSeries && strings.Contains(lowercaseSymbol, "fut") {
		return true
	}
	return false
}

// IsSymbolOption checks if the given symbol represents an Option contract.
func IsSymbolOption(symbol string) bool {
	if symbol == "" {
		return false
	}
	lowercaseSymbol := strings.ToLower(symbol)
	hasMonthSeries := false
	for _, series := range FnOSeries {
		if strings.Contains(lowercaseSymbol, series) {
			hasMonthSeries = true
			break
		}
	}
	if hasMonthSeries && (strings.Contains(lowercaseSymbol, "ce") || strings.Contains(lowercaseSymbol, "pe")) {
		return true
	}
	return false
}

// MakeSureSymbolIsEquity validates that a given trading symbol represents an equity instrument
// rather than a Futures & Options (F&O) instrument.
//
// The function performs pattern matching to detect F&O instruments by looking for:
// - Month series identifiers (jan, feb, mar, etc.)
// - F&O instrument types (fut for futures, ce for call options, pe for put options)
//
// If both patterns are found together in the symbol, it's considered an F&O instrument
// and an error is returned.
//
// Parameters:
//   - symbol: The trading symbol to validate (case-insensitive)
//
// Returns:
//   - error: nil if the symbol is valid equity, otherwise an error describing the issue
//
// Examples:
//   - "RELIANCE" -> nil (valid equity)
//   - "NIFTY24JANFUT" -> error (F&O instrument)
//   - "" -> error (empty symbol)
func MakeSureSymbolIsEquity(symbol string) error {
	if symbol == "" {
		return fmt.Errorf("trading symbol cannot be empty")
	}

	if IsSymbolFuture(symbol) {
		return fmt.Errorf("symbol '%s' appears to be a Futures contract, not equity", symbol)
	}

	if IsSymbolOption(symbol) {
		return fmt.Errorf("symbol '%s' appears to be an Option contract, not equity", symbol)
	}

	// If no F&O patterns found, assume it's equity
	return nil
}

// GetInstrumentFromSymbol returns the types.Instrument (equity, future, option) for a given symbol string.
func GetInstrumentFromSymbol(symbol string) types.Instrument {
	if IsSymbolFuture(symbol) {
		return types.InstrumentFuture
	}
	if IsSymbolOption(symbol) {
		return types.InstrumentOption
	}
	return types.InstrumentEquity
}
