package position

import (
	"arthveda/internal/domain/currency"
	"arthveda/internal/feature/trade"
	"fmt"
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

	Symbol             string                `json:"symbol" db:"symbol"`
	Instrument         Instrument            `json:"instrument" db:"instrument"`
	Currency           currency.CurrencyCode `json:"currency" db:"currency"`
	RiskAmount         decimal.Decimal       `json:"risk_amount" db:"risk_amount"`
	Notes              string                `json:"notes" db:"notes"`
	TotalChargesAmount decimal.Decimal       `json:"total_charges_amount" db:"total_charges_amount"`

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
	RFactor                     decimal.Decimal `json:"r_factor" db:"r_factor"`
	NetReturnPercentage         decimal.Decimal `json:"net_return_percentage" db:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL decimal.Decimal `json:"charges_as_percentage_of_net_pnl" db:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                decimal.Decimal `json:"open_quantity" db:"open_quantity"`
	OpenAveragePriceAmount      decimal.Decimal `json:"open_average_price_amount" db:"open_average_price_amount"`

	// If this Position is imported, then the following fields are used to track the source of the import.
	BrokerID *uuid.UUID `json:"broker_id" db:"broker_id"` // The ID of the Broker from which this Position is imported.

	//
	// Everything above is present in the DATABASE but everything below isn't.
	//
	Trades []*trade.Trade `json:"trades"` // All the trade(s) that are RELATED to this Position.

	// Whether this Position is a duplicate of another Position or not.
	// This flag is used when we are importing positions from Brokers.
	IsDuplicate bool `json:"is_duplicate"`
}

type Instrument string

const (
	InstrumentEquity Instrument = "equity"
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

func new(userID uuid.UUID, payload CreatePayload) (position *Position, userErr bool, err error) {
	now := time.Now().UTC()

	positionID, err := uuid.NewV7()
	if err != nil {
		return nil, false, err
	}

	computeResult, err := Compute(payload.ComputePayload)
	if err != nil {
		return nil, true, err
	}

	trades, err := createTradesFromCreatePayload(payload.Trades, positionID)
	if err != nil {
		return nil, false, fmt.Errorf("createTradesFromCreatePayload: %w", err)
	}

	position = &Position{
		ID:                          positionID,
		CreatedBy:                   userID,
		CreatedAt:                   now,
		Symbol:                      payload.Symbol,
		Instrument:                  payload.Instrument,
		Currency:                    payload.Currency,
		RiskAmount:                  payload.RiskAmount,
		Notes:                       payload.Notes,
		TotalChargesAmount:          computeResult.TotalChargesAmount,
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

	return position, false, nil
}

func createTradesFromCreatePayload(trades []trade.CreatePayload, positionID uuid.UUID) ([]*trade.Trade, error) {
	newTrades := []*trade.Trade{}

	for _, tradePayload := range trades {
		// Attach the Position's ID.
		tradePayload.PositionID = positionID

		trade, err := trade.New(tradePayload)
		if err != nil {
			return nil, err
		}

		newTrades = append(newTrades, trade)
	}

	return newTrades, nil
}

func (originalPosition *Position) update(payload UpdatePayload) (position Position, userErr bool, err error) {
	now := time.Now().UTC()
	updatedPosition := Position{
		ID:        originalPosition.ID,
		CreatedBy: originalPosition.CreatedBy,
		CreatedAt: originalPosition.CreatedAt,
		UpdatedAt: &now,
	}

	computeResult, err := Compute(payload.ComputePayload)
	if err != nil {
		return updatedPosition, true, err
	}

	trades := []*trade.Trade{}

	for _, tradePayload := range payload.Trades {
		// Attach the Position's ID.
		tradePayload.PositionID = originalPosition.ID

		trade, err := trade.New(tradePayload)
		if err != nil {
			return updatedPosition, false, fmt.Errorf("create trade: %w", err)
		}

		trades = append(trades, trade)
	}

	updatedPosition.Symbol = payload.Symbol
	updatedPosition.Instrument = payload.Instrument
	updatedPosition.Currency = payload.Currency
	updatedPosition.RiskAmount = payload.RiskAmount
	updatedPosition.TotalChargesAmount = computeResult.TotalChargesAmount
	updatedPosition.Notes = payload.Notes
	updatedPosition.Direction = computeResult.Direction
	updatedPosition.Status = computeResult.Status
	updatedPosition.OpenedAt = computeResult.OpenedAt
	updatedPosition.ClosedAt = computeResult.ClosedAt
	updatedPosition.GrossPnLAmount = computeResult.GrossPnLAmount
	updatedPosition.NetPnLAmount = computeResult.NetPnLAmount
	updatedPosition.RFactor = computeResult.RFactor
	updatedPosition.NetReturnPercentage = computeResult.NetReturnPercentage
	updatedPosition.ChargesAsPercentageOfNetPnL = computeResult.ChargesAsPercentageOfNetPnL
	updatedPosition.OpenQuantity = computeResult.OpenQuantity
	updatedPosition.OpenAveragePriceAmount = computeResult.OpenAveragePriceAmount
	updatedPosition.BrokerID = payload.BrokerID

	updatedPosition.Trades = trades

	return updatedPosition, false, nil
}

type computeResult struct {
	Direction                   Direction       `json:"direction"`
	Status                      Status          `json:"status"`
	OpenedAt                    time.Time       `json:"opened_at"`
	ClosedAt                    *time.Time      `json:"closed_at"` // `nil` if the Status is StatusOpen meaning the position is open.
	GrossPnLAmount              decimal.Decimal `json:"gross_pnl_amount"`
	NetPnLAmount                decimal.Decimal `json:"net_pnl_amount"`
	TotalChargesAmount          decimal.Decimal `json:"total_charges_amount"`
	RFactor                     decimal.Decimal `json:"r_factor"`
	NetReturnPercentage         decimal.Decimal `json:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL decimal.Decimal `json:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                decimal.Decimal `json:"open_quantity"`
	OpenAveragePriceAmount      decimal.Decimal `json:"open_average_price_amount"`
}

func Compute(payload ComputePayload) (computeResult, error) {
	result := computeResult{
		OpenedAt:  time.Now().UTC(),
		Status:    StatusOpen,
		Direction: DirectionLong,
	}

	if len(payload.Trades) == 0 {
		return result, nil
	}

	var closedAt *time.Time = nil
	var status Status
	var direction Direction
	avgPrice := decimal.NewFromFloat(0)
	grossPnL := decimal.NewFromFloat(0)
	totalCost := decimal.NewFromFloat(0)
	totalCharges := decimal.NewFromFloat(0)
	netQty := decimal.NewFromFloat(0)

	if payload.Trades[0].Kind == trade.TradeKindBuy {
		direction = DirectionLong
	} else {
		direction = DirectionShort
	}

	// If there is only one trade, we know the trade is the opening trade.

	// TODO: Calculate and store the realised PnL on every trade in the position.
	// This will make the analytics easier and faster and we can show the realised
	// PnL on every trade in the position when viewing the position.

	for _, t := range payload.Trades {
		var pnl decimal.Decimal
		var newDirection Direction

		avgPrice, netQty, newDirection, pnl, totalCost, totalCharges = ApplyTradeToPosition(avgPrice, netQty, totalCost, totalCharges, direction, t.Quantity, t.Price, t.ChargesAmount, t.Kind)

		// Trade direction changed, meaning we flipped.
		// We don't wanna allow users to sell (if long) or buy (if short) more quantity than they have open.
		// So we will return an error.
		if newDirection != direction {
			if direction == DirectionLong {
				return result, fmt.Errorf("You cannot sell more quantity than you have open")
			} else {
				return result, fmt.Errorf("You cannot buy more quantity than you have open")
			}
		}

		grossPnL = grossPnL.Add(pnl)

		if netQty.IsZero() {
			closedAt = &t.Time
		}
	}

	var netPnL, rFactor, netReturnPercentage, chargesAsPercentageOfNetPnL decimal.Decimal

	// Position is closed.
	if netQty.IsZero() {
		netPnL = grossPnL.Sub(totalCharges)

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
		if !grossPnL.IsZero() {
			netPnL = grossPnL
		}
	}

	if grossPnL.IsPositive() {
		chargesAsPercentageOfNetPnL = totalCharges.Div(grossPnL).Mul(decimal.NewFromFloat(100))
	}

	if totalCost.IsPositive() {
		netReturnPercentage = netPnL.Div(totalCost).Mul(decimal.NewFromFloat(100))
	}

	result.Direction = direction
	result.Status = status
	result.OpenedAt = payload.Trades[0].Time
	result.ClosedAt = closedAt
	result.GrossPnLAmount = grossPnL.Round(2) // Round to match NUMERIC(14,2)
	result.NetPnLAmount = netPnL.Round(2)     // Round to match NUMERIC(14,2)
	result.RFactor = rFactor.Round(2)
	result.TotalChargesAmount = totalCharges.Round(2) // Round to match NUMERIC(14,2)
	result.NetReturnPercentage = netReturnPercentage.Round(2)
	result.ChargesAsPercentageOfNetPnL = chargesAsPercentageOfNetPnL.Round(2)

	if netQty.IsPositive() {
		result.OpenQuantity = netQty
		result.OpenAveragePriceAmount = avgPrice.Round(2) // Round to match NUMERIC(14,2)
	}

	return result, nil
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
func ApplyTradeToPosition(
	currentAvgPrice decimal.Decimal,
	currentQty decimal.Decimal,
	totalCost decimal.Decimal,
	totalCharges decimal.Decimal,
	direction Direction,
	tradeQty decimal.Decimal,
	tradePrice decimal.Decimal,
	tradeChargesAmount decimal.Decimal,
	tradeKind trade.Kind,
) (newAvgPrice decimal.Decimal, newQty decimal.Decimal, newDirection Direction, realizedPnL, newTotalCost, newTotalCharges decimal.Decimal) {

	// No-op for 0 order
	if tradeQty.IsZero() {
		return currentAvgPrice, currentQty, direction, decimal.Zero, decimal.Zero, decimal.Zero
	}

	isLong := direction == DirectionLong
	isBuy := tradeKind == trade.TradeKindBuy

	isScalingIn := (isLong && isBuy) || (!isLong && !isBuy)

	// Add this trade's charges to running total
	newTotalCharges = totalCharges.Add(tradeChargesAmount)

	if currentQty.IsZero() {
		// Opening new position
		newDirection = DirectionLong
		if !isBuy {
			newDirection = DirectionShort
		}

		newTotalCost = tradePrice.Mul(tradeQty)

		return tradePrice, tradeQty, newDirection, decimal.Zero, newTotalCost, newTotalCharges
	}

	if isScalingIn {
		// Scaling in → increase qty, update average price
		tradeCost := currentAvgPrice.Mul(currentQty).Add(tradePrice.Mul(tradeQty))
		newQty = currentQty.Add(tradeQty)
		newAvgPrice = tradeCost.Div(newQty)
		newDirection = direction
		newTotalCost = totalCost.Add(tradeCost)
		return newAvgPrice, newQty, newDirection, decimal.Zero, newTotalCost, newTotalCharges
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
	// Round realized PnL to match database precision (NUMERIC(14,2))
	realizedPnL = realizedPnL.Round(2)

	// Check if it's a full close or flip
	if tradeQty.LessThanOrEqual(currentQty) {
		newQty = currentQty.Sub(tradeQty)

		// Full close
		if newQty.IsZero() {
			return decimal.Zero, decimal.Zero, direction, realizedPnL, totalCost, newTotalCharges
		}

		// Partial close
		return currentAvgPrice, newQty, direction, realizedPnL, totalCost, newTotalCharges
	}

	// Flip
	netQty := tradeQty.Sub(currentQty) // Excess becomes new position
	if isLong {
		newDirection = DirectionShort
	} else {
		newDirection = DirectionLong
	}

	newTotalCost = totalCost.Add(tradePrice.Mul(newQty))
	return tradePrice, netQty, newDirection, realizedPnL, newTotalCost, newTotalCharges
}

func ConvertTradesToCreatePayload(trades []*trade.Trade) []trade.CreatePayload {
	createPayloads := make([]trade.CreatePayload, len(trades))
	for i, t := range trades {
		createPayloads[i] = trade.CreatePayload{
			Kind:          t.Kind,
			Time:          t.Time,
			Quantity:      t.Quantity,
			Price:         t.Price,
			ChargesAmount: t.ChargesAmount,
			PositionID:    t.PositionID,
			BrokerTradeID: t.BrokerTradeID,
		}
	}
	return createPayloads
}

type RealisedStatsUptoATrade struct {
	GrossPnLAmount decimal.Decimal
	NetPnLAmount   decimal.Decimal
	ChargesAmount  decimal.Decimal
	IsRealising    bool // Indicates if this trade is realising PnL or not.
}

// GetRealisedStatsUptoATradeByTradeID calculates the stats up to each trade in the positions.
// So you will get GrossPnLAmount, NetPnLAmount and ChargesAmount for each trade calculated
// by how it affects the position up to that trade. Very helpful for analytics and reporting.
// If you have single position, you can pass a slice with one element.
func GetRealisedStatsUptoATradeByTradeID(positions []*Position) map[uuid.UUID]RealisedStatsUptoATrade {
	// Keep track of realised PnL for each trade.
	realisedStats := make(map[uuid.UUID]RealisedStatsUptoATrade)

	for _, pos := range positions {
		avgPrice := decimal.NewFromFloat(0)
		totalCost := decimal.NewFromFloat(0)
		totalCharges := decimal.NewFromFloat(0)
		netQty := decimal.NewFromFloat(0)
		direction := pos.Direction

		// Calculate realized PnL for each trade
		for _, t := range pos.Trades {
			var grossPnL decimal.Decimal

			avgPrice, netQty, _, grossPnL, totalCost, totalCharges = ApplyTradeToPosition(avgPrice, netQty, totalCost, totalCharges, direction, t.Quantity, t.Price, t.ChargesAmount, t.Kind)

			stats := RealisedStatsUptoATrade{
				GrossPnLAmount: grossPnL,
				ChargesAmount:  totalCharges,
				NetPnLAmount:   grossPnL.Sub(totalCharges),
				IsRealising:    IsTradeRealisingPnL(t, pos),
			}

			realisedStats[t.ID] = stats
		}
	}

	return realisedStats
}

func ApplyComputeResultToPosition(
	position *Position,
	computeResult computeResult,
) {
	position.Direction = computeResult.Direction
	position.Status = computeResult.Status
	position.OpenedAt = computeResult.OpenedAt
	position.ClosedAt = computeResult.ClosedAt
	position.GrossPnLAmount = computeResult.GrossPnLAmount
	position.NetPnLAmount = computeResult.NetPnLAmount
	position.TotalChargesAmount = computeResult.TotalChargesAmount
	position.RFactor = computeResult.RFactor
	position.NetReturnPercentage = computeResult.NetReturnPercentage
	position.ChargesAsPercentageOfNetPnL = computeResult.ChargesAsPercentageOfNetPnL
	position.OpenQuantity = computeResult.OpenQuantity
	position.OpenAveragePriceAmount = computeResult.OpenAveragePriceAmount
}

func IsTradeRealisingPnL(
	t *trade.Trade,
	position *Position,
) bool {
	if position == nil || t == nil {
		return false
	}

	// If the trade is opposite direction of the position, it means the trade is realising PnL.
	if (position.Direction == DirectionLong && t.Kind == trade.TradeKindSell) ||
		(position.Direction == DirectionShort && t.Kind == trade.TradeKindBuy) {
		return true
	}

	return false
}
