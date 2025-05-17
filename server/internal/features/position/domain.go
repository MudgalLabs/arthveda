package position

import (
	"arthveda/internal/features/trade"
	"time"

	"github.com/guregu/null/v6/zero"
	"github.com/shopspring/decimal"
)

type Position struct {
	ID int64 `json:"id" db:"id"`

	//
	// Data provided by the user
	//

	Symbol        string          `json:"symbol" db:"symbol"`
	Instrument    Instrument      `json:"instrument" db:"instrument"`
	CurrencyID    int             `json:"currency_id" db:"currency_id"`
	RiskAmount    decimal.Decimal `json:"risk_amount" db:"risk_amount"`
	ChargesAmount decimal.Decimal `json:"charges_amount" db:"charges_amount"`

	//
	// Data computed by Arthveda based on data provided by user mentioned above & related SubTrade(s).
	// So if the data provideed by the user changes, the data below must be recomputed and saved.
	//

	Direction                   Direction       `json:"direction" db:"direction"`
	Outcome                     Status          `json:"outcome" db:"outcome"`
	OpenedAt                    time.Time       `json:"opened_at" db:"opened_at"`
	ClosedAt                    zero.Time       `json:"closed_at" db:"closed_at"`
	GrossPnLAmount              decimal.Decimal `json:"gross_pnl_amount" db:"gross_pnl_amount"`
	NetPnLAmount                decimal.Decimal `json:"net_pnl_amount" db:"net_pnl_amount"`
	RFactor                     float64         `json:"r_factor" db:"r_factor"`
	NetReturnPercentage         float64         `json:"net_return_percentage" db:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL float64         `json:"charges_as_percentage_of_net_pnl" db:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                float64         `json:"open_quantity" db:"open_quantity"`
	OpenAveragePriceAmount      decimal.Decimal `json:"open_average_price_amount" db:"open_average_price_amount"`
}

type Instrument string

const (
	InstrumentEquity Instrument = "equity"
	InstrumentFuture Instrument = "future"
	InstrumentOption Instrument = "option"
)

type Direction string

const (
	DirectionLong  Direction = "long"
	DirectionShort Direction = "short"
)

type Status string

const (
	StatusOpen      Status = "open"
	StatusBreakeven Status = "breakeven"
	StatusWin       Status = "win"
	StatusLoss      Status = "loss"
)

// ApplyTradeToPosition applies a trade to an existing position,
// handling scaling in, closing, or flipping the position.
//
// Logic:
//   - Scaling in: OrderKind is in same direction as current position; increases quantity and updates average price.
//   - Closing: OrderKind is opposite; decreases quantity and realizes PnL.
//   - Flip: OrderKind is opposite and quantity exceeds current; realizes full PnL and opens a new position in opposite direction.
//
// Assumptions:
//   - currentQty and orderQty are always positive.
//   - direction indicates whether the position is LONG or SHORT.
//   - OrderKind.Buy means buying (increases long / closes short).
//   - OrderKind.Sell means selling (increases short / closes long).
func applyTradeToPosition(
	currentAvgPrice decimal.Decimal,
	currentQty decimal.Decimal,
	totalCost decimal.Decimal,
	direction Direction,
	tradeQty decimal.Decimal,
	tradePrice decimal.Decimal,
	orderKind trade.Kind,
) (newAvgPrice decimal.Decimal, newQty decimal.Decimal, newDirection Direction, realizedPnL, newTotalCost decimal.Decimal) {

	// No-op for 0 order
	if tradeQty.IsZero() {
		return currentAvgPrice, currentQty, direction, decimal.Zero, decimal.Zero
	}

	isLong := direction == DirectionLong
	isBuy := orderKind == trade.TradeKindBuy

	isScalingIn := (isLong && isBuy) || (!isLong && !isBuy)

	if currentQty.IsZero() {
		// Opening new position
		newDirection = DirectionLong
		if !isBuy {
			newDirection = DirectionShort
		}

		newTotalCost = tradePrice.Mul(tradeQty)

		return tradePrice, tradeQty, newDirection, decimal.Zero, newTotalCost
	}

	if isScalingIn {
		// Scaling in → increase qty, update average price
		tradeCost := currentAvgPrice.Mul(currentQty).Add(tradePrice.Mul(tradeQty))
		newQty = currentQty.Add(tradeQty)
		newAvgPrice = tradeCost.Div(newQty)
		newDirection = direction
		newTotalCost = totalCost.Add(tradeCost)
		return newAvgPrice, newQty, newDirection, decimal.Zero, newTotalCost
	}

	// Scaling out or flipping
	closeQty := decimal.Min(currentQty, tradeQty)

	// Determine realized PnL per unit
	var pnlPerUnit decimal.Decimal
	if isLong {
		pnlPerUnit = tradePrice.Sub(currentAvgPrice) // Sell above avg = profit
	} else {
		pnlPerUnit = currentAvgPrice.Sub(tradePrice) // Buy below avg = profit
	}
	realizedPnL = pnlPerUnit.Mul(closeQty)

	// Check if it's a full close or flip
	if tradeQty.LessThanOrEqual(currentQty) {
		newQty = currentQty.Sub(tradeQty)

		// Full close
		if newQty.IsZero() {
			return decimal.Zero, decimal.Zero, direction, realizedPnL, totalCost
		}

		// Partial close
		return currentAvgPrice, newQty, direction, realizedPnL, totalCost
	}

	// Flip
	netQty := tradeQty.Sub(currentQty) // Excess becomes new position
	newDirection = DirectionShort
	if isBuy {
		newDirection = DirectionLong
	}

	newTotalCost = totalCost.Add(tradePrice.Mul(newQty))
	return tradePrice, netQty, newDirection, realizedPnL, newTotalCost
}
