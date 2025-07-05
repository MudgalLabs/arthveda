package position

import (
	"arthveda/internal/domain/currency"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"errors"
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

var ErrInvalidTradeData = errors.New("Invalid trade data provided")

func Compute(payload ComputePayload) (computeResult, error) {
	l := logger.Get()

	result := computeResult{
		OpenedAt:  time.Now().UTC(),
		Status:    StatusOpen,
		Direction: DirectionLong,
	}

	if len(payload.Trades) == 0 {
		return result, nil
	}

	// If there is only one trade, we know the trade is the opening trade.

	// TODO: Calculate and store the realised PnL on every trade in the position.
	// This will make the analytics easier and faster and we can show the realised
	// PnL on every trade in the position when viewing the position.

	// FIXME: Change thix functions API to accept a "position.Position"?
	var trades []*trade.Trade

	for _, t := range payload.Trades {
		newTrade, err := trade.New(t)
		if err != nil {
			l.Errorw("trade.New", "error", err, "trade", t)
			return result, ErrInvalidTradeData
		}

		trades = append(trades, newTrade)
	}

	direction, err := computeDirection(trades)
	if err != nil {
		l.Errorw("computeDirection", "error", err, "trades", trades)
		return result, ErrInvalidTradeData
	}

	computeTradesResult, err := ComputeSmartTrades(trades, direction)
	if err != nil {
		l.Errorw("ComputeSmartTrades", "error", err, "trades", trades)
		return result, ErrInvalidTradeData
	}

	grossPnL := decimal.Zero
	capitalUsed := decimal.Zero
	netOpenQty := decimal.Zero
	var closedAt *time.Time = nil

	for _, t := range trades {
		grossPnL = grossPnL.Add(t.RealisedPnL)
		for _, lot := range computeTradesResult.matchedLots {
			capitalUsed = capitalUsed.Add(lot.Qty.Mul(lot.PriceIn))
		}

		// Tally netQty based on trade kind and direction
		signedQty := t.Quantity
		if (direction == DirectionLong && t.Kind == trade.TradeKindSell) || (direction == DirectionShort && t.Kind == trade.TradeKindBuy) {
			signedQty = signedQty.Neg()
		}
		netOpenQty = netOpenQty.Add(signedQty)

		// If we ever hit 0 net qty after performing a trade, we know that the position is closed.
		if netOpenQty.IsZero() {
			closedAt = &t.Time
		}
	}

	totalCharges := calculateTotalChargesAmountFromTrades(trades)

	var status Status

	netReturnPercentage := decimal.Zero
	if !capitalUsed.IsZero() {
		netReturnPercentage = grossPnL.Div(capitalUsed).Mul(decimal.NewFromInt(100))
	}

	result.GrossPnLAmount = grossPnL
	result.NetPnLAmount = grossPnL
	result.NetReturnPercentage = netReturnPercentage

	var netPnL, rFactor, chargesAsPercentageOfNetPnL decimal.Decimal

	// Position is closed.
	if netOpenQty.IsZero() {
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
		netPnL = grossPnL
	}

	if grossPnL.IsPositive() {
		chargesAsPercentageOfNetPnL = totalCharges.Div(grossPnL).Mul(decimal.NewFromFloat(100))
	}

	result.Direction = direction
	result.Status = status
	result.OpenedAt = payload.Trades[0].Time
	result.ClosedAt = closedAt
	result.GrossPnLAmount = grossPnL
	result.NetPnLAmount = netPnL
	result.RFactor = rFactor
	result.TotalChargesAmount = totalCharges
	result.NetReturnPercentage = netReturnPercentage
	result.ChargesAsPercentageOfNetPnL = chargesAsPercentageOfNetPnL

	if netOpenQty.IsPositive() {
		result.OpenQuantity = netOpenQty
		result.OpenAveragePriceAmount = computeTradesResult.openAvgPrice
	}

	return result, nil
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
	ChargesAmount decimal.Decimal
	IsScaleOut    bool // Whether this trade is a scale-out trade or not.
}

// GetRealisedStatsUptoATradeByTradeID calculates the charges up to each trade in the positions,
// along with whether the trade is a scale-out trade or not. Very helpful for analytics and reporting.
// If you have single position, you can pass a slice with one element.
func GetRealisedStatsUptoATradeByTradeID(positions []*Position) map[uuid.UUID]RealisedStatsUptoATrade {
	realisedStats := make(map[uuid.UUID]RealisedStatsUptoATrade)

	for _, pos := range positions {
		charges := decimal.Zero

		for _, t := range pos.Trades {
			charges = charges.Add(t.ChargesAmount)

			stats := RealisedStatsUptoATrade{
				ChargesAmount: charges,
				IsScaleOut:    isScaleOut(t, pos),
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

func isScaleOut(
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

type fifoLot struct {
	Qty   decimal.Decimal
	Price decimal.Decimal
}

type ComputeSmartTradesResult struct {
	openAvgPrice decimal.Decimal
	matchedLots  []trade.MatchedLot
}

func ComputeSmartTrades(trades []*trade.Trade, direction Direction) (ComputeSmartTradesResult, error) {
	result := ComputeSmartTradesResult{}

	if len(trades) == 0 {
		return result, nil
	}

	var fifo []fifoLot
	netOpenQty := decimal.Zero

	for i, t := range trades {
		qtyLeft := t.Quantity

		if qtyLeft.LessThanOrEqual(decimal.Zero) {
			return result, fmt.Errorf("invalid quantity at trade %d: must be positive", i)
		}

		isScaleIn := (direction == DirectionLong && t.Kind == trade.TradeKindBuy) || (direction == DirectionShort && t.Kind == trade.TradeKindSell)

		if isScaleIn {
			// Add to FIFO
			fifo = append(fifo, fifoLot{Qty: qtyLeft, Price: t.Price})
			netOpenQty = netOpenQty.Add(qtyLeft.Mul(directionSignDecimal(direction)))
		} else {
			// Scale-out
			requiredQty := qtyLeft
			availableQty := netOpenQty.Abs()
			if availableQty.LessThan(requiredQty) {
				return result, fmt.Errorf("invalid scale-out at trade %d: trying to %s %s units, but only %s available",
					i, t.Kind, requiredQty.String(), availableQty.String())
			}

			matched := []trade.MatchedLot{}
			realisedPnL := decimal.Zero
			costBasis := decimal.Zero

			for qtyLeft.GreaterThan(decimal.Zero) && len(fifo) > 0 {
				lot := &fifo[0]
				matchQty := decimal.Min(qtyLeft, lot.Qty)

				var pnl decimal.Decimal
				if direction == DirectionLong {
					pnl = matchQty.Mul(t.Price.Sub(lot.Price))
				} else {
					pnl = matchQty.Mul(lot.Price.Sub(t.Price))
				}

				matched = append(matched, trade.MatchedLot{
					Qty:      matchQty,
					PriceIn:  lot.Price,
					PriceOut: t.Price,
					PnL:      pnl,
				})

				realisedPnL = realisedPnL.Add(pnl)
				costBasis = costBasis.Add(matchQty.Mul(lot.Price))

				lot.Qty = lot.Qty.Sub(matchQty)
				qtyLeft = qtyLeft.Sub(matchQty)

				if lot.Qty.IsZero() {
					fifo = fifo[1:]
				}
			}

			result.matchedLots = matched
			t.RealisedPnL = realisedPnL
			if !costBasis.IsZero() {
				t.ROI = realisedPnL.Div(costBasis).Mul(decimal.NewFromInt(100))
			}

			netOpenQty = netOpenQty.Sub(t.Quantity.Mul(directionSignDecimal(direction)))
		}
	}

	if netOpenQty.IsPositive() {
		// If we have any open quantity left, it means we have unclosed positions.
		// We can compute the average price of the open positions.
		openAvgPrice := computeAvgPrice(fifo)
		result.openAvgPrice = openAvgPrice
	}

	return result, nil
}

func directionSignDecimal(direction Direction) decimal.Decimal {
	if direction == DirectionLong {
		return decimal.NewFromInt(1)
	}
	return decimal.NewFromInt(-1)
}

func computeDirection(trades []*trade.Trade) (Direction, error) {
	var direction Direction

	switch trades[0].Kind {
	case trade.TradeKindBuy:
		direction = DirectionLong
	case trade.TradeKindSell:
		direction = DirectionShort
	default:
		return direction, fmt.Errorf("invalid trade kind in first trade: %s", trades[0].Kind)
	}

	return direction, nil
}

func computeAvgPrice(fifo []fifoLot) decimal.Decimal {
	totalCost := decimal.Zero
	totalQty := decimal.Zero

	for _, lot := range fifo {
		totalCost = totalCost.Add(lot.Qty.Mul(lot.Price))
		totalQty = totalQty.Add(lot.Qty)
	}

	if totalQty.IsZero() {
		return decimal.Zero
	}

	return totalCost.Div(totalQty)
}
