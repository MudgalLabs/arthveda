package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/symbol"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/currency"
	"arthveda/internal/feature/tag"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// TODO: `notes` column in the `position` table is deprecated. Use `journal_content` instead.
// We will remove the `notes` column in a future migration.

type Position struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	CreatedBy uuid.UUID  `json:"created_by" db:"created_by"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt *time.Time `json:"updated_at" db:"updated_at"`

	//
	// Data provided by the user
	//

	Symbol     string           `json:"symbol" db:"symbol"`
	Instrument types.Instrument `json:"instrument" db:"instrument"`
	// DEPRECATED
	// `Currency` is deprecated. Please use `CurrencyCode` instead.
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
	GrossRFactor                decimal.Decimal `json:"gross_r_factor" db:"gross_r_factor"`
	NetReturnPercentage         decimal.Decimal `json:"net_return_percentage" db:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL decimal.Decimal `json:"charges_as_percentage_of_net_pnl" db:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                decimal.Decimal `json:"open_quantity" db:"open_quantity"`
	OpenAveragePriceAmount      decimal.Decimal `json:"open_average_price_amount" db:"open_average_price_amount"`

	// If this Position is imported, then the following fields are used to track the source of the import.
	// Deprecated: Use UserBrokerAccountID instead.
	BrokerID *uuid.UUID `json:"broker_id" db:"broker_id"` // The ID of the Broker from which this Position is imported.

	UserBrokerAccountID *uuid.UUID `json:"user_broker_account_id" db:"user_broker_account_id"` // The ID of the UserBrokerAccount to which this Position belongs.

	CurrencyCode           currency.CurrencyCode `json:"currency_code" db:"currency_code"`
	FxRate                 decimal.Decimal       `json:"fx_rate" db:"fx_rate"`
	FxSource               fxSource              `json:"fx_source" db:"fx_source"`
	GrossPnLAmountAway     *decimal.Decimal      `json:"gross_pnl_amount_away" db:"gross_pnl_amount_away"`
	NetPnLAmountAway       *decimal.Decimal      `json:"net_pnl_amount_away" db:"net_pnl_amount_away"`
	TotalChargesAmountAway *decimal.Decimal      `json:"total_charges_amount_away" db:"total_charges_amount_away"`

	//
	// Everything above is present in the position table but everything below isn't.
	// The fields below are populated separately as needed.
	//

	// The Journal Content associated with this Position.
	JournalContent json.RawMessage `json:"journal_content"`

	// The Tags attached to this Position.
	Tags []*tag.Tag `json:"tags"`

	// Simplified UserBrokerAccount with only required fields
	UserBrokerAccount *UserBrokerAccountSearchValue `json:"user_broker_account"` // The UserBrokerAccount to which this Position belongs.

	// All the trade(s) that are RELATED to this Position.
	Trades []*trade.Trade `json:"trades"`

	// Whether this Position is a duplicate of another Position or not.
	// This flag is used when we are importing positions from Brokers.
	IsDuplicate bool `json:"is_duplicate"`
}

// UserBrokerAccountSearchValue contains only the essential fields needed for Position display
type UserBrokerAccountSearchValue struct {
	ID       uuid.UUID `json:"id"`
	BrokerID uuid.UUID `json:"broker_id"`
	Name     string    `json:"name"`
}

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

type fxSource string

const (
	fxSourceSystem fxSource = "system"
	fxSourceManual fxSource = "manual"
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
		ID:                  positionID,
		CreatedBy:           userID,
		CreatedAt:           now,
		Symbol:              symbol.Sanitize(payload.Symbol, payload.Instrument),
		Instrument:          payload.Instrument,
		Currency:            payload.Currency,
		RiskAmount:          payload.RiskAmount,
		UserBrokerAccountID: payload.UserBrokerAccountID,
		Trades:              trades,
	}

	ApplyComputeResultToPosition(position, computeResult)

	if payload.FxRate != nil {
		position.FxSource = fxSourceManual
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
	updatedPosition.BrokerID = payload.BrokerID
	updatedPosition.UserBrokerAccountID = payload.UserBrokerAccountID

	// TODO: Use ApplyComputeResultToPosition here.
	updatedPosition.TotalChargesAmount = computeResult.TotalChargesAmount
	updatedPosition.Direction = computeResult.Direction
	updatedPosition.Status = computeResult.Status
	updatedPosition.OpenedAt = computeResult.OpenedAt
	updatedPosition.ClosedAt = computeResult.ClosedAt
	updatedPosition.GrossPnLAmount = computeResult.GrossPnLAmount
	updatedPosition.NetPnLAmount = computeResult.NetPnLAmount
	updatedPosition.RFactor = computeResult.RFactor
	updatedPosition.GrossRFactor = computeResult.GrossRFactor
	updatedPosition.NetReturnPercentage = computeResult.NetReturnPercentage
	updatedPosition.ChargesAsPercentageOfNetPnL = computeResult.ChargesAsPercentageOfNetPnL
	updatedPosition.OpenQuantity = computeResult.OpenQuantity
	updatedPosition.OpenAveragePriceAmount = computeResult.OpenAveragePriceAmount
	updatedPosition.CurrencyCode = payload.CurrencyCode
	updatedPosition.GrossPnLAmountAway = &computeResult.GrossPnLAmountAway
	updatedPosition.TotalChargesAmountAway = &computeResult.TotalChargesAmountAway
	updatedPosition.NetPnLAmountAway = &computeResult.NetPnLAmountAway

	updatedPosition.Trades = trades

	if payload.FxRate != nil {
		updatedPosition.FxRate = *payload.FxRate
		updatedPosition.FxSource = fxSourceManual
	}

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
	GrossRFactor                decimal.Decimal `json:"gross_r_factor"`
	NetReturnPercentage         decimal.Decimal `json:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL decimal.Decimal `json:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                decimal.Decimal `json:"open_quantity"`
	OpenAveragePriceAmount      decimal.Decimal `json:"open_average_price_amount"`
	GrossPnLAmountAway          decimal.Decimal `json:"gross_pnl_amount_away"`
	NetPnLAmountAway            decimal.Decimal `json:"net_pnl_amount_away"`
	TotalChargesAmountAway      decimal.Decimal `json:"total_charges_amount_away"`
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

	computeTradesResult, err := ComputeSmartTrades(trades, direction, payload.RiskAmount)
	if err != nil {
		l.Debugw("ComputeSmartTrades", "error", err, "trades", trades)
		return result, ErrInvalidTradeData
	}

	var closedAt *time.Time = nil
	grossPnL := decimal.Zero
	netOpenQty := decimal.Zero
	capitalUsed := decimal.Zero

	for _, t := range trades {
		grossPnL = grossPnL.Add(t.RealisedGrossPnL)

		for _, lot := range t.MatchedLots {
			capitalUsed = capitalUsed.Add(lot.Qty.Mul(lot.PriceIn))
		}

		// Tally netQty based on trade kind and direction
		signedQty := t.Quantity
		if (direction == DirectionLong && t.Kind == types.TradeKindSell) || (direction == DirectionShort && t.Kind == types.TradeKindBuy) {
			signedQty = signedQty.Neg()
		}
		netOpenQty = netOpenQty.Add(signedQty)

		// If we ever hit 0 net qty after performing a trade, we know that the position is closed.
		if netOpenQty.IsZero() {
			closedAt = &t.Time
		}
	}

	var netPnL, rFactor, grossRFactor, chargesAsPercentageOfNetPnL decimal.Decimal

	totalCharges := calculateTotalChargesAmountFromTrades(trades)
	netPnL = grossPnL.Sub(totalCharges)

	result.GrossPnLAmount = grossPnL
	result.NetPnLAmount = netPnL

	netReturnPercentage := decimal.Zero
	if !capitalUsed.IsZero() {
		netReturnPercentage = netPnL.Div(capitalUsed).Mul(decimal.NewFromInt(100))
	}

	result.NetReturnPercentage = netReturnPercentage

	var status Status

	// Position is closed.
	if netOpenQty.IsZero() {

		if payload.RiskAmount.IsPositive() {
			rFactor = netPnL.Div(payload.RiskAmount)
			grossRFactor = grossPnL.Div(payload.RiskAmount)
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

	if payload.FxRate != nil && payload.FxRate.IsPositive() {
		result.GrossPnLAmount = grossPnL.Mul(*payload.FxRate)
		result.TotalChargesAmount = totalCharges.Mul(*payload.FxRate)
		result.NetPnLAmount = netPnL.Mul(*payload.FxRate)

		result.GrossPnLAmountAway = grossPnL
		result.TotalChargesAmountAway = totalCharges
		result.NetPnLAmountAway = netPnL
	} else {
		result.GrossPnLAmount = grossPnL
		result.NetPnLAmount = netPnL
		result.TotalChargesAmount = totalCharges
	}

	result.Direction = direction
	result.Status = status
	result.OpenedAt = payload.Trades[0].Time
	result.ClosedAt = closedAt
	result.RFactor = rFactor
	result.GrossRFactor = grossRFactor
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
				IsScaleOut:    isScaleOut(t, pos.Direction),
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
	position.GrossRFactor = computeResult.GrossRFactor
	position.NetReturnPercentage = computeResult.NetReturnPercentage
	position.ChargesAsPercentageOfNetPnL = computeResult.ChargesAsPercentageOfNetPnL
	position.OpenQuantity = computeResult.OpenQuantity
	position.OpenAveragePriceAmount = computeResult.OpenAveragePriceAmount
}

func isScaleOut(
	t *trade.Trade,
	positionDirection Direction,
) bool {
	// If the trade is opposite direction of the position, it means the trade is realising PnL.
	if (positionDirection == DirectionLong && t.Kind == types.TradeKindSell) ||
		(positionDirection == DirectionShort && t.Kind == types.TradeKindBuy) {
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
}

func ComputeSmartTrades(trades []*trade.Trade, direction Direction, riskAmount decimal.Decimal) (ComputeSmartTradesResult, error) {
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

		isScaleIn := (direction == DirectionLong && t.Kind == types.TradeKindBuy) || (direction == DirectionShort && t.Kind == types.TradeKindSell)

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
			realisedGrossPnL := decimal.Zero
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

				realisedGrossPnL = realisedGrossPnL.Add(pnl)
				costBasis = costBasis.Add(matchQty.Mul(lot.Price))

				lot.Qty = lot.Qty.Sub(matchQty)
				qtyLeft = qtyLeft.Sub(matchQty)

				if lot.Qty.IsZero() {
					fifo = fifo[1:]
				}

				t.MatchedLots = matched
			}

			t.RealisedGrossPnL = realisedGrossPnL
			t.RealisedNetPnL = realisedGrossPnL.Sub(t.ChargesAmount)

			if !costBasis.IsZero() {
				t.GrossROI = realisedGrossPnL.Div(costBasis).Mul(decimal.NewFromInt(100))
				// NOTE: t.NetROI calculation to be handled from the caller.
			}

			if riskAmount.IsPositive() {
				t.GrossRFactor = t.RealisedGrossPnL.Div(riskAmount)
				// NOTE: We aren't updating the t.RFactor because we don't know the charges
				// accumulated upto this point. This must be handled from the caller of this function.
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
	case types.TradeKindBuy:
		direction = DirectionLong
	case types.TradeKindSell:
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

func GetRangeBasedOnTrades(positions []*Position) (time.Time, time.Time) {
	// Find the earliest and latest trade times
	var rangeStart, rangeEnd time.Time

	for _, position := range positions {
		for _, trade := range position.Trades {
			if rangeStart.IsZero() || trade.Time.Before(rangeStart) {
				rangeStart = trade.Time
			}

			if rangeEnd.IsZero() || trade.Time.After(rangeEnd) {
				rangeEnd = trade.Time
			}
		}
	}

	// When we are calculating the dashboard, we want to include the entire day of the last trade.
	// Otherwise we will end up skipping the last day's trades.
	// Extend end to include the entire day of the last trade
	rangeEnd = rangeEnd.Add(24 * time.Hour)

	return rangeStart, rangeEnd
}

func FilterPositionsWithRealisingTradesUpTo(positions []*Position, end time.Time, loc *time.Location) []*Position {
	// These are the trades that we will use to compute the stats.
	// We will only consider trades that are before or equal to the end date.
	// We will also create a copy of the positions so that we don't modify the original positions
	// and their trades. This is important because we will be calling "Compute" on the positions
	// to calculate the realised PnL and other stats, and we don't want to modify the original positions.

	// We need to compute the Position stats based on the trades that fall within the date range.
	// So we will go through all positions and their trades,
	// and call "Compute" up until we don't reach a trade that's time is after the end date.
	// If we reach a trade that is after the end date, we will stop processing the position.
	positionsWithTradesUptoEnd := []*Position{}

	if len(positions) == 0 || positions == nil {
		return positionsWithTradesUptoEnd
	}

	originalPosByID := map[uuid.UUID]*Position{}
	for _, p := range positions {
		originalPosByID[p.ID] = p
		positionCopy := *p
		trades := []*trade.Trade{}

		atLeastOneTradeWasScalingOut := false

		// Apply trades to the position to calculate realised PnL.
		// This will also update the position's GrossPnLAmount, NetPnLAmount
		// and TotalChargesAmount fields.
		for _, t := range p.Trades {
			if t.Time.In(loc).Before(end) || t.Time.In(loc).Equal(end) {
				trades = append(trades, t)

				// If position is long and we have a sell trade,
				// or if position is short and we have a buy trade,
				// we know that this is a scaling out trade.
				// This flag helps us to include positions for calculating stats
				// that have tried to realise PnL by scaling out. Otherwise, we might have
				// wrong stats for positions that were just scaling in during the time range.
				if (positionCopy.Direction == DirectionLong && t.Kind == types.TradeKindSell) ||
					(positionCopy.Direction == DirectionShort && t.Kind == types.TradeKindBuy) {
					atLeastOneTradeWasScalingOut = true
				}
			}
		}

		positionCopy.Trades = trades

		if atLeastOneTradeWasScalingOut {
			positionsWithTradesUptoEnd = append(positionsWithTradesUptoEnd, &positionCopy)
		}
	}

	// Let's call "Compute" on positionsWithTradesUptoEnd
	// to calculate the realised PnL and other stats.

	for i, p := range positionsWithTradesUptoEnd {
		payload := ComputePayload{
			Trades:     ConvertTradesToCreatePayload(p.Trades),
			RiskAmount: p.RiskAmount,
			FxRate:     &p.FxRate,
		}

		computeResult, err := Compute(payload)
		if err != nil {
			// If we fail silently and continue.
			logger.Get().Errorw("failed to compute position", "error", err, "symbol", p.Symbol, "opened_at", p.OpenedAt)
			continue
		}

		ApplyComputeResultToPosition(p, computeResult)
		positionsWithTradesUptoEnd[i] = p
	}

	return positionsWithTradesUptoEnd
}

type PnlBucket struct {
	Label        string                  `json:"label"`
	Start        time.Time               `json:"start"`
	End          time.Time               `json:"end"`
	GrossPnL     decimal.Decimal         `json:"gross_pnl"`
	Charges      decimal.Decimal         `json:"charges"`
	NetPnL       decimal.Decimal         `json:"net_pnl"`
	GrossRFactor decimal.Decimal         `json:"gross_r_factor"`
	Positions    map[uuid.UUID]*Position `json:"-"` // Positions that contributed to this bucket's PnL.
}

func GetPnLBuckets(positions []*Position, period common.BucketPeriod, start, end time.Time, loc *time.Location) []PnlBucket {
	if len(positions) == 0 {
		return []PnlBucket{}
	}

	positionByID := make(map[uuid.UUID]*Position)
	realisedStatsByTradeID := GetRealisedStatsUptoATradeByTradeID(positions)

	// Generate buckets
	buckets := common.GenerateBuckets(period, start, end, loc)
	results := make([]PnlBucket, len(buckets))
	for i, b := range buckets {
		results[i] = PnlBucket{
			Start:     b.Start,
			End:       b.End,
			Label:     b.Label(loc),
			NetPnL:    decimal.Zero,
			GrossPnL:  decimal.Zero,
			Charges:   decimal.Zero,
			Positions: make(map[uuid.UUID]*Position),
		}
	}

	// Collect all trades and sort them by time
	var allTrades []*trade.Trade

	for _, pos := range positions {
		positionByID[pos.ID] = pos
		allTrades = append(allTrades, pos.Trades...)
	}

	sort.Slice(allTrades, func(i, j int) bool {
		return allTrades[i].Time.Before(allTrades[j].Time)
	})

	chargesByPositionID := make(map[uuid.UUID]decimal.Decimal)

	for _, t := range allTrades {
		// The position to which this trade belongs to.
		pos := positionByID[t.PositionID]

		// Find the active bucket for this trade
		var activeBucket *PnlBucket
		for i := range results {
			if !t.Time.Before(results[i].Start) && t.Time.Before(results[i].End) {
				activeBucket = &results[i]
				break
			}
		}

		if activeBucket == nil {
			continue // Skip trades outside the bucket range
		}

		stats := realisedStatsByTradeID[t.ID]

		chargesAmount, exists := chargesByPositionID[t.PositionID]
		if !exists {
			chargesByPositionID[t.PositionID] = decimal.Zero
			chargesAmount = decimal.Zero
		}

		grossPnL := t.RealisedGrossPnL.Mul(pos.FxRate)
		charges := stats.ChargesAmount.Sub(chargesAmount).Mul(pos.FxRate)
		netPnL := grossPnL.Sub(charges)
		grossRFactor := t.GrossRFactor

		if stats.IsScaleOut {
			activeBucket.GrossPnL = activeBucket.GrossPnL.Add(grossPnL)
			activeBucket.Charges = activeBucket.Charges.Add(charges)
			activeBucket.NetPnL = activeBucket.NetPnL.Add(netPnL)
			activeBucket.GrossRFactor = activeBucket.GrossRFactor.Add(grossRFactor)

			chargesByPositionID[t.PositionID] = stats.ChargesAmount

			pos := positionByID[t.PositionID]
			activeBucket.Positions[pos.ID] = pos
		}
	}

	return results
}

// GetCumulativePnLBuckets calculates cumulative realized PnL using pnL buckets.
func GetCumulativePnLBuckets(positions []*Position, period common.BucketPeriod, start, end time.Time, loc *time.Location) []PnlBucket {
	pnlBuckets := GetPnLBuckets(positions, period, start, end, loc)

	// Convert bucket PnL and charges to cumulative values with rounding
	for i := range pnlBuckets {
		if i > 0 {
			pnlBuckets[i].NetPnL = pnlBuckets[i].NetPnL.Add(pnlBuckets[i-1].NetPnL)
			pnlBuckets[i].GrossPnL = pnlBuckets[i].GrossPnL.Add(pnlBuckets[i-1].GrossPnL)
			pnlBuckets[i].Charges = pnlBuckets[i].Charges.Add(pnlBuckets[i-1].Charges)
		}
	}

	return pnlBuckets
}
