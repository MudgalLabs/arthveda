package trade

import (
	"fmt"

	"github.com/shopspring/decimal"
)

type InstrumentKind string

const (
	InstrumentKindEquity  InstrumentKind = "equity"
	InstrumentKindFuture  InstrumentKind = "future"
	InstrumentKindOptions InstrumentKind = "option"
)

type OrderKind string

const (
	OrderKindBuy  OrderKind = "buy"
	OrderKindSell OrderKind = "sell"
)

type DirectionKind string

const (
	DirectionKindLong  DirectionKind = "long"
	DirectionKindShort DirectionKind = "short"
)

type OutcomeKind string

const (
	OutcomeKindOpen      OutcomeKind = "open"
	OutcomeKindBreakeven OutcomeKind = "breakeven"
	OutcomeKindWin       OutcomeKind = "win"
	OutcomeKindLoss      OutcomeKind = "loss"
)

// calculateNewAveragePrice calculates the new average price for a position.
func calculateNewAveragePrice(
	currentAvgPrice decimal.Decimal,
	currentQty decimal.Decimal,
	direction DirectionKind,
	newQty decimal.Decimal,
	newPrice decimal.Decimal,
) (decimal.Decimal, error) {
	if newQty.IsZero() {
		return currentAvgPrice, nil
	}

	// Validate direction and quantity sign

	if direction == DirectionKindLong && newQty.IsNegative() {
		return decimal.Zero, fmt.Errorf("new quantity %s contradicts long position", newQty.String())
	}

	if direction == DirectionKindShort && newQty.IsPositive() {
		return decimal.Zero, fmt.Errorf("new quantity %s contradicts short position", newQty.String())
	}

	totalQty := currentQty.Add(newQty)
	if totalQty.IsZero() {
		// Position fully closed
		return decimal.Zero, nil
	}

	currentValue := currentQty.Mul(currentAvgPrice)
	newValue := newQty.Mul(newPrice)
	combinedValue := currentValue.Add(newValue)

	// Use Abs to ensure positive average price
	newAvgPrice := combinedValue.Div(totalQty).Abs()

	return newAvgPrice, nil
}

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
	direction DirectionKind,
	tradeQty decimal.Decimal,
	tradePrice decimal.Decimal,
	orderKind OrderKind,
) (newAvgPrice decimal.Decimal, newQty decimal.Decimal, newDirection DirectionKind, realizedPnL, newTotalCost decimal.Decimal, err error) {

	// No-op for 0 order
	if tradeQty.IsZero() {
		return currentAvgPrice, currentQty, direction, decimal.Zero, decimal.Zero, nil
	}

	isLong := direction == DirectionKindLong
	isBuy := orderKind == OrderKindBuy

	isScalingIn := (isLong && isBuy) || (!isLong && !isBuy)

	if currentQty.IsZero() {
		// Opening new position
		newDirection = DirectionKindLong
		if !isBuy {
			newDirection = DirectionKindShort
		}

		newTotalCost = tradePrice.Mul(tradeQty)

		return tradePrice, tradeQty, newDirection, decimal.Zero, newTotalCost, nil
	}

	if isScalingIn {
		// Scaling in → increase qty, update average price
		tradeCost := currentAvgPrice.Mul(currentQty).Add(tradePrice.Mul(tradeQty))
		newQty = currentQty.Add(tradeQty)
		newAvgPrice = tradeCost.Div(newQty)
		newDirection = direction
		newTotalCost = totalCost.Add(tradeCost)
		return newAvgPrice, newQty, newDirection, decimal.Zero, newTotalCost, nil
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
		// Partial or full close
		newQty = currentQty.Sub(tradeQty)
		if newQty.IsZero() {
			return decimal.Zero, decimal.Zero, "", realizedPnL, totalCost, nil
		}
		return currentAvgPrice, newQty, direction, realizedPnL, totalCost, nil
	}

	// Flip
	netQty := tradeQty.Sub(currentQty) // Excess becomes new position
	newDirection = DirectionKindShort
	if isBuy {
		newDirection = DirectionKindLong
	}

	newTotalCost = totalCost.Add(tradePrice.Mul(newQty))
	return tradePrice, netQty, newDirection, realizedPnL, newTotalCost, nil
}
