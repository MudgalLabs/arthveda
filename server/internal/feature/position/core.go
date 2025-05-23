package position

import (
	"arthveda/internal/domain/currency"
	"arthveda/internal/feature/trade"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Position struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	CreatedBy uuid.UUID  `json:"created_by" db:"created_by"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt *time.Time `json:"updated_at" db:"updated_at"`

	//
	// Data provided by the user
	//

	Symbol        string            `json:"symbol" db:"symbol"`
	Instrument    Instrument        `json:"instrument" db:"instrument"`
	Currency      currency.Currency `json:"currency" db:"currency"`
	RiskAmount    decimal.Decimal   `json:"risk_amount" db:"risk_amount"`
	ChargesAmount decimal.Decimal   `json:"charges_amount" db:"charges_amount"`

	//
	// Data computed by Arthveda based on data provided by user mentioned above & related trade(s).
	// So if the data provideed by the user changes, the data below must be recomputed and saved.
	//

	Direction                   Direction       `json:"direction" db:"direction"`
	Status                      Status          `json:"status" db:"status"`
	OpenedAt                    time.Time       `json:"opened_at" db:"opened_at"`
	ClosedAt                    *time.Time      `json:"closed_at" db:"closed_at"`
	GrossPnLAmount              decimal.Decimal `json:"gross_pnl_amount" db:"gross_pnl_amount"`
	NetPnLAmount                decimal.Decimal `json:"net_pnl_amount" db:"net_pnl_amount"`
	RFactor                     float64         `json:"r_factor" db:"r_factor"`
	NetReturnPercentage         float64         `json:"net_return_percentage" db:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL float64         `json:"charges_as_percentage_of_net_pnl" db:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                decimal.Decimal `json:"open_quantity" db:"open_quantity"`
	OpenAveragePriceAmount      decimal.Decimal `json:"open_average_price_amount" db:"open_average_price_amount"`

	//
	// Everything above is present in the DATABASE but everything below isn't.
	//
	Trades []*trade.Trade `json:"trades"` // All the trade(s) that are RELATED to this Position.
}

func new(payload CreatePayload) (*Position, error) {
	now := time.Now().UTC()

	positionID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	computeResult := compute(payload.ComputePayload)

	trades := []*trade.Trade{}

	for _, tradePayload := range payload.Trades {
		// Attach the Position's ID.
		tradePayload.PositionID = positionID

		trade, err := trade.New(tradePayload)
		if err != nil {
			return nil, err
		}

		trades = append(trades, trade)
	}

	position := &Position{
		ID:                          positionID,
		CreatedBy:                   payload.CreatedBy,
		CreatedAt:                   now,
		Symbol:                      payload.Symbol,
		Instrument:                  payload.Instrument,
		Currency:                    payload.Currency,
		RiskAmount:                  payload.RiskAmount,
		ChargesAmount:               payload.ChargesAmount,
		Direction:                   computeResult.Direction,
		Status:                      computeResult.Status,
		OpenedAt:                    computeResult.OpenedAt,
		ClosedAt:                    computeResult.ClosedAt,
		GrossPnLAmount:              computeResult.GrossPnLAmount,
		NetPnLAmount:                computeResult.NetPnLAmount,
		RFactor:                     computeResult.RFactor,
		NetReturnPercentage:         computeResult.NetReturnPercentage,
		ChargesAsPercentageOfNetPnL: computeResult.ChargesAsPercentageOfNetPnL,
		OpenQuantity:                computeResult.OpenQuantity,
		OpenAveragePriceAmount:      computeResult.OpenAveragePriceAmount,
		Trades:                      trades,
	}

	return position, nil
}

func compute(payload ComputePayload) computeResult {
	result := computeResult{
		OpenedAt:  time.Now().UTC(),
		Status:    StatusOpen,
		Direction: DirectionLong,
	}

	if len(payload.Trades) == 0 {
		return result
	}

	var closedAt *time.Time = nil
	var status Status
	var direction Direction
	var avgPrice decimal.Decimal
	grossPnL := decimal.NewFromFloat(0)
	totalCost := decimal.NewFromFloat(0)
	netQty := decimal.NewFromFloat(0)

	for i := range payload.Trades {
		trade := payload.Trades[i]
		tradeQty := trade.Quantity
		tradePrice := trade.Price

		var pnl decimal.Decimal

		avgPrice, netQty, direction, pnl, totalCost = applyTradeToPosition(avgPrice, netQty, totalCost, direction, tradeQty, tradePrice, trade.Kind)

		grossPnL = grossPnL.Add(pnl)

		if netQty.IsZero() {
			closedAt = &trade.Time
		}
	}

	var netPnL, rFactor, netReturnPercentage, chargesAsPercentageOfNetPnL decimal.Decimal

	// Position is closed.
	if netQty.IsZero() {
		netPnL = grossPnL.Sub(payload.ChargesAmount)

		if payload.RiskAmount.IsPositive() {
			rFactor = netPnL.Div(payload.RiskAmount)
		}

		if netPnL.IsZero() {
			status = StatusBreakeven
		} else if netPnL.IsPositive() {
			status = StatusWin
		} else if netPnL.IsNegative() {
			status = StatusLoss
		}
	} else {
		// Position is open.
		status = StatusOpen

		// The position is still open but we have some realised gross pnl.
		if grossPnL.IsPositive() {
			netPnL = grossPnL
		}
	}

	if grossPnL.IsPositive() {
		chargesAsPercentageOfNetPnL = payload.ChargesAmount.Div(grossPnL).Mul(decimal.NewFromFloat(100))
	}

	if totalCost.IsPositive() {
		netReturnPercentage = netPnL.Div(totalCost).Mul(decimal.NewFromFloat(100))
	}

	result.Direction = direction
	result.Status = status
	result.OpenedAt = payload.Trades[0].Time
	result.ClosedAt = closedAt
	result.GrossPnLAmount = grossPnL
	result.NetPnLAmount = netPnL
	result.RFactor, _ = rFactor.Float64()
	result.NetReturnPercentage, _ = netReturnPercentage.Float64()
	result.ChargesAsPercentageOfNetPnL, _ = chargesAsPercentageOfNetPnL.Float64()

	if netQty.IsPositive() {
		result.OpenQuantity = netQty
		result.OpenAveragePriceAmount = avgPrice
	}

	return result
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
	StatusWin       Status = "win"
	StatusLoss      Status = "loss"
	StatusBreakeven Status = "breakeven"
	StatusOpen      Status = "open"
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
