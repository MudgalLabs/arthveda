package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/symbol"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type ImportResult struct {
	Positions               []*Position `json:"positions"`
	InvalidPositions        []*Position `json:"invalid_positions"`
	PositionsCount          int         `json:"positions_count"`
	DuplicatePositionsCount int         `json:"duplicate_positions_count"`
	PositionsImportedCount  int         `json:"positions_imported_count"`
	InvalidPositionsCount   int         `json:"invalid_positions_count"`
	ForcedPositionsCount    int         `json:"forced_positions_count"`
	FromDate                time.Time   `json:"from_date"`
	ToDate                  time.Time   `json:"to_date"`
}

// ImportableTrade represents a standardized trade format that can be imported
// from various sources (file imports, broker APIs, etc.)
type ImportableTrade struct {
	Symbol     string           `json:"symbol"`
	Instrument types.Instrument `json:"instrument"`
	TradeKind  types.TradeKind  `json:"trade_kind"`
	Quantity   decimal.Decimal  `json:"quantity"`
	Price      decimal.Decimal  `json:"price"`

	// Unique identifier for the order in the broker's system. There can be multiple trades for the same order.
	OrderID string `json:"order_id"`

	// Time when the trade was executed. This is the time when the order was filled.
	Time time.Time `json:"time"`
}

type tradeImporterOptions struct {
	positionService *Service

	// User ID for whom the trades are being imported.
	userID uuid.UUID

	userBrokerAccountID uuid.UUID

	broker *broker.Broker

	// riskAmount is the risk amount that will be used to compute R-Factor.
	riskAmount decimal.Decimal

	// currency is the currency in which the positions are denominated.
	currency currency.CurrencyCode

	// Whether to auto calculate charges or let user provide a manual charge amount.
	chargesCalculationMethod ChargesCalculationMethod

	// If ChargesCalculationMethod is Manual, this field will be used to specify the charge amount for each trade.
	manualChargeAmount decimal.Decimal

	// instrument is the instrument type of the positions being imported.
	instrument types.Instrument

	// confirm is a boolean flag to indicate whether the positions should be created in the database.
	confirm bool

	// force is a boolean flag to indicate whether the import should overwrite existing positions.
	force bool
}

type TradeImporter struct {
	tradeImporterOptions
}

func NewTradeImporter(options tradeImporterOptions) TradeImporter {
	return TradeImporter{
		options,
	}
}

func (ti *TradeImporter) Import(ctx context.Context, importableTrades []*ImportableTrade) (*ImportResult, service.Error, error) {
	l := logger.FromCtx(ctx)
	now := time.Now().UTC()

	// Map to store parsed rows by Order ID.
	// This makes it easy to access the parsed row data by Order ID later.
	parsedRowByOrderID := map[string]*ImportableTrade{}

	type aggregatedTrade struct {
		TradeKind  types.TradeKind
		Time       time.Time
		Quantity   decimal.Decimal
		TotalPrice decimal.Decimal
		Charges    decimal.Decimal
	}

	// Map to aggregate trades by Order ID.
	// This will help in calculating the weighted average price for trades with the same Order ID.
	// When a user places a trade, the execution can happen in multiple parts leading to multiple trades with the same Order ID.
	aggregatedTrades := make(map[string]aggregatedTrade)

	for _, importableTrade := range importableTrades {
		parsedRowByOrderID[importableTrade.OrderID] = importableTrade

		// Aggregate trades by Order ID if the order was split into multiple executed exchange trades.
		if existing, found := aggregatedTrades[importableTrade.OrderID]; found {
			existing.Quantity = existing.Quantity.Add(importableTrade.Quantity)
			existing.TotalPrice = existing.TotalPrice.Add(importableTrade.Price.Mul(importableTrade.Quantity))
			existing.Time = importableTrade.Time
			aggregatedTrades[importableTrade.OrderID] = existing
		} else {
			aggregatedTrades[importableTrade.OrderID] = aggregatedTrade{
				TradeKind:  importableTrade.TradeKind,
				Time:       importableTrade.Time,
				Quantity:   importableTrade.Quantity,
				TotalPrice: importableTrade.Price.Mul(importableTrade.Quantity),
				Charges:    decimal.NewFromInt(0),
			}
		}
	}

	// Define a struct to store trades with their Order IDs
	type TradeWithOrderID struct {
		OrderID string
		Payload trade.CreatePayload
	}

	// Slice to store trades with their Order IDs
	tradesWithOrderIDs := []TradeWithOrderID{}

	// Convert aggregated trades to tradesWithOrderIDs
	for orderID, aggregatedTrade := range aggregatedTrades {
		averagePrice := aggregatedTrade.TotalPrice.Div(aggregatedTrade.Quantity)
		tradesWithOrderIDs = append(tradesWithOrderIDs, TradeWithOrderID{
			OrderID: orderID,
			Payload: trade.CreatePayload{
				Kind:          aggregatedTrade.TradeKind,
				Quantity:      aggregatedTrade.Quantity,
				Price:         averagePrice, // Use the rounded price
				Time:          aggregatedTrade.Time,
				ChargesAmount: aggregatedTrade.Charges,
			},
		})
	}

	// Sort the trades by execution time
	sort.Slice(tradesWithOrderIDs, func(i, j int) bool {
		return tradesWithOrderIDs[i].Payload.Time.Before(tradesWithOrderIDs[j].Payload.Time)
	})

	brokerTradeIDs, err := ti.positionService.tradeRepository.GetAllBrokerTradeIDs(ctx, &ti.userID, &ti.broker.ID)
	if err != nil {
		l.Errorw("failed to get all broker trade IDs", "error", err, "broker_id", ti.broker.ID)
		// Not returning an error here, as we can still process trades without existing broker trade IDs.
	}

	// Number of positions that are invalid in the import file.
	// This is used to track how many positions were invalid and skipped during the import.
	invalidPositionsByPosID := map[uuid.UUID]bool{}
	invalidPositions := []*Position{}

	// Map to track open positions by Symbol
	openPositions := make(map[string]*Position)

	// Array to store all finalized positions
	finalizedPositions := []*Position{}

	// Process the sorted trades
	for _, tradeWithOrderID := range tradesWithOrderIDs {
		orderID := tradeWithOrderID.OrderID
		tradePayload := tradeWithOrderID.Payload
		parsedRow, exists := parsedRowByOrderID[orderID]
		if !exists {
			return nil, service.ErrInternalServerError, fmt.Errorf("ParsedRow not found for Order ID %s", orderID)
		}

		symbol := parsedRow.Symbol

		newTrade, err := trade.New(tradePayload)
		if err != nil {
			l.Errorw("failed to create trade from payload", "error", err, "tradePayload", tradePayload)
			return nil, service.ErrInternalServerError, fmt.Errorf("failed to create trade from payload: %w", err)
		}

		// Check if there is an open position for the Symbol
		if openPosition, exists := openPositions[symbol]; exists {
			newTrade.PositionID = openPosition.ID
			newTrade.BrokerTradeID = &orderID
			openPosition.Trades = append(openPosition.Trades, newTrade)

			// Use the compute function to update the position state
			computePayload := ComputePayload{
				RiskAmount: ti.riskAmount,
				Trades:     ConvertTradesToCreatePayload(openPosition.Trades),
			}

			computeResult, err := Compute(computePayload)
			if err != nil {
				l.Debugw("failed to compute position that already exists and marking it as invalid", "error", err, "position_id", openPosition.ID, "symbol", openPosition.Symbol)
				invalidPositionsByPosID[openPosition.ID] = true
				continue
			}

			ApplyComputeResultToPosition(openPosition, computeResult)

			// If the position is closed (net quantity is 0), finalize it
			if computeResult.OpenQuantity.IsZero() {
				// Finalize the position
				finalizedPositions = append(finalizedPositions, openPosition)
				// Remove the finalized position from the openPositions map
				delete(openPositions, symbol)
			}
		} else {
			// If no open position exists, create a new one
			parsedRow, exists := parsedRowByOrderID[orderID]
			if !exists {
				return nil, service.ErrInternalServerError, fmt.Errorf("ParsedRow not found for Order ID %s", orderID)
			}

			instrument := parsedRow.Instrument

			// Initialize the position with the first trade
			computePayload := ComputePayload{
				RiskAmount: ti.riskAmount,
				Trades:     []trade.CreatePayload{tradePayload},
			}

			computeResult, err := Compute(computePayload)
			if err != nil {
				l.Debugw("failed to compute position after creating a new position and marking it as invalid", "error", err, "position_id", openPosition.ID, "symbol", openPosition.Symbol)
				invalidPositionsByPosID[openPosition.ID] = true
				continue
			}

			positionID, err := uuid.NewV7()
			if err != nil {
				return nil, service.ErrInternalServerError, fmt.Errorf("failed to generate UUID for position: %w", err)
			}

			newTrade.PositionID = positionID
			newTrade.BrokerTradeID = &orderID

			trades := []*trade.Trade{
				newTrade,
			}

			newPosition := &Position{
				ID:                  positionID,
				CreatedBy:           ti.userID,
				CreatedAt:           now,
				Symbol:              symbol,
				Instrument:          instrument,
				Currency:            ti.currency,
				RiskAmount:          ti.riskAmount,
				Trades:              trades,
				BrokerID:            &ti.broker.ID,
				UserBrokerAccountID: &ti.userBrokerAccountID,
			}

			ApplyComputeResultToPosition(newPosition, computeResult)
			openPositions[symbol] = newPosition
		}
	}

	// Add any remaining open positions to the finalized positions
	for _, openPosition := range openPositions {
		if invalid, exists := invalidPositionsByPosID[openPosition.ID]; exists && invalid {
			l.Debugw("skipping invalid position", "position_id", openPosition.ID, "symbol", openPosition.Symbol)
			invalidPositions = append(invalidPositions, openPosition)
			// Skip invalid positions
			continue
		}

		finalizedPositions = append(finalizedPositions, openPosition)
	}

	// Sort finalizedPositions by opened_at in descending order
	sort.Slice(finalizedPositions, func(i, j int) bool {
		return finalizedPositions[i].OpenedAt.After(finalizedPositions[j].OpenedAt)
	})

	// Sort trades within each finalized position by trade time in ascending order
	for _, position := range finalizedPositions {
		sort.Slice(position.Trades, func(i, j int) bool {
			return position.Trades[i].Time.Before(position.Trades[j].Time)
		})
	}

	duplicatePositionsCount := 0
	positionsImported := 0
	forcedPositionCount := 0

	for positionIdx, position := range finalizedPositions {
		switch ti.chargesCalculationMethod {
		case ChargesCalculationMethodAuto:
			_, userErr, err := CalculateAndApplyChargesToTrades(position.Trades, ti.instrument, ti.broker.Name)
			if err != nil {
				if userErr {
					return nil, service.ErrBadRequest, err
				} else {
					return nil, service.ErrInternalServerError, fmt.Errorf("CalculateAndApplyChargesToTrades: %w", err)
				}
			}

		case ChargesCalculationMethodManual:
			for _, trade := range position.Trades {
				trade.ChargesAmount = ti.manualChargeAmount
			}
		}

		// Add the position's total charges amount.
		// This is calculated from the trades in the position.
		position.TotalChargesAmount = calculateTotalChargesAmountFromTrades(position.Trades)

		// As we have updated the trades with charges, we need to recompute the position.
		computePayload := ComputePayload{
			RiskAmount: ti.riskAmount,
			Trades:     ConvertTradesToCreatePayload(position.Trades),
		}

		computeResult, err := Compute(computePayload)
		if err != nil {
			l.Debugw("failed to compute position after charges and marking it as invalid", "error", err, "position_id", position.ID, "symbol", position.Symbol)
			continue
		}

		ApplyComputeResultToPosition(position, computeResult)

		var isDuplicate bool
		// If we find a duplicate trade, we need to get it's position ID.
		var positionIDForTheDuplicateOrderID uuid.UUID

		for _, trade := range position.Trades {
			orderID := trade.BrokerTradeID

			if common.ExistsInSet(brokerTradeIDs, *orderID) {
				isDuplicate = true
				positionIDForTheDuplicateOrderID = brokerTradeIDs[*orderID]

				// If we find a duplicate, we can break out of the loop early.
				// Because if one trade in the position is a duplicate,
				// the whole position is considered a duplicate.
				break
			}
		}

		if isDuplicate {
			// If the force & confirm flags are true, we will have to delete the existing position and create a new position.
			if ti.force && ti.confirm {
				l.Debugw("force importing a duplicate position, deleting existing position", "symbol", position.Symbol, "opened_at", position.OpenedAt)

				svcErr, err := ti.positionService.Delete(ctx, ti.userID, positionIDForTheDuplicateOrderID)
				if err != nil {
					return nil, svcErr, fmt.Errorf("failed to delete existing position: %w", err)
				}

				// Create the position in the database
				err = ti.positionService.positionRepository.Create(ctx, position)
				if err != nil {
					return nil, service.ErrInternalServerError, err
				}

				// Create the trades in the database
				_, err = ti.positionService.tradeRepository.CreateForPosition(ctx, position.Trades)
				if err != nil {
					// Delete the position if trades creation fails.
					ti.positionService.positionRepository.Delete(ctx, position.ID)
					return nil, service.ErrInternalServerError, err
				}

				positionsImported += 1
				forcedPositionCount += 1
				continue
			}

			l.Debugw("skipping position because it is a duplicate", "symbol", position.Symbol, "opened_at", position.OpenedAt)
			duplicatePositionsCount += 1
			finalizedPositions[positionIdx].IsDuplicate = true
			// We skip the position if it has any duplicate trades.
			continue
		}

		// If confirm is true, we will create the positions in the database.
		if ti.confirm {
			// Create the position in the database
			err := ti.positionService.positionRepository.Create(ctx, position)
			if err != nil {
				return nil, service.ErrInternalServerError, err
			}

			// Create the trades in the database
			_, err = ti.positionService.tradeRepository.CreateForPosition(ctx, position.Trades)
			if err != nil {
				// Delete the position if trades creation fails.
				ti.positionService.positionRepository.Delete(ctx, position.ID)
				return nil, service.ErrInternalServerError, err
			}

			positionsImported += 1
		}
	}

	l.Debugf("Duplicate positions skipped: %d", duplicatePositionsCount)

	result := &ImportResult{
		Positions:               finalizedPositions,
		InvalidPositions:        invalidPositions,
		PositionsCount:          len(finalizedPositions), // Client can check length of positions?
		DuplicatePositionsCount: duplicatePositionsCount,
		PositionsImportedCount:  positionsImported,
		InvalidPositionsCount:   len(invalidPositionsByPosID),
		ForcedPositionsCount:    forcedPositionCount,
	}

	return result, service.ErrNone, nil
}

type importFileMetadata struct {
	// The row index of the header.
	headerRowIdx int

	// The symbol column index.
	symbolColumnIdx int

	// The scrip code column index.
	// Scrip code is also known as exchange token.
	// This is only used for Upstox.
	scripCodeIdx int

	// The segment column index.
	segmentColumnIdx int

	// The trade type column index. Buy or Sell.
	tradeTypeColumnIdx int

	// The quantity column index.
	quantityColumnIdx int

	// The price column index.
	priceColumnIdx int

	// The exchange order ID column index.
	orderIDColumnIdx int

	// The execution timestamp column index.
	dateTimeColumnIdx int

	// The time column index.
	timeColumnIdx int

	// The date column index.
	dateColumnIdx int
}

type Importer interface {
	getMetadata(rows [][]string) (*importFileMetadata, error)
	parseRow(row []string, metadata *importFileMetadata) (*ImportableTrade, error)
}

type ZerodhaImporter struct{}

func (i ZerodhaImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, dateTimeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {
			if strings.Contains(colCell, "Symbol") {
				// If we found "Symbol" in the header, we can assume this is the header row.
				headerRowIdx = rowIdx
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Segment") {
				segmentColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Type") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Price") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order ID") {
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order Execution Time") {
				dateTimeColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		headerRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateTimeColumnIdx:  dateTimeColumnIdx,
	}, nil
}

func (i ZerodhaImporter) parseRow(row []string, metadata *importFileMetadata) (*ImportableTrade, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateTimeColumnIdx := metadata.dateTimeColumnIdx

	symbol := row[symbolColumnIdx]
	if symbol == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]
	timeStr := row[dateTimeColumnIdx]

	tradeKind := types.TradeKind(tradeTypeStr)
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity in row: %s", quantityStr)
	}

	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price in row: %s", priceStr)
	}

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	tradeTime, err := time.ParseInLocation("2006-01-02T15:04:05", timeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid time in row: %s", timeStr)
	}

	var instrument types.Instrument
	if segment == "EQ" {
		instrument = types.InstrumentEquity
	}

	return &ImportableTrade{
		Symbol:     symbol,
		Instrument: instrument,
		TradeKind:  tradeKind,
		Quantity:   decimal.NewFromFloat(quantity),
		Price:      price,
		OrderID:    orderID,
		Time:       tradeTime,
	}, nil
}

type GrowwImporter struct{}

func (i *GrowwImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, dateTimeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {

			if strings.Contains(colCell, "Symbol") {
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Type") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Price") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Exchange Order Id") {
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Execution date and time") {
				headerRowIdx = rowIdx
				dateTimeColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		headerRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateTimeColumnIdx:  dateTimeColumnIdx,
	}, nil
}

func (i *GrowwImporter) parseRow(row []string, metadata *importFileMetadata) (*ImportableTrade, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateTimeColumnIdx := metadata.dateTimeColumnIdx

	symbol := row[symbolColumnIdx]
	if symbol == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	// Parse trade details from the row
	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]
	timeStr := row[dateTimeColumnIdx]

	tradeKind := types.TradeKind(strings.ToLower(tradeTypeStr))
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity at row : %s", quantityStr)
	}

	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price at row : %s", priceStr)
	}
	// Groww provides the price as total price for the trade,
	// meaning for the given quantity, the price is the total amount paid.
	price = price.Div(decimal.NewFromFloat(quantity))

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	tradeTime, err := time.ParseInLocation("02-01-2006 03:04 PM", timeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid time at row : %s", timeStr)
	}

	instrument := types.InstrumentEquity

	return &ImportableTrade{
		Symbol:     symbol,
		Instrument: instrument,
		TradeKind:  tradeKind,
		Quantity:   decimal.NewFromFloat(quantity),
		Price:      price,
		OrderID:    orderID,
		Time:       tradeTime,
	}, nil
}

type UpstoxImporter struct{}

func (i *UpstoxImporter) getMetadata(rows [][]string) (*importFileMetadata, error) {
	var headerRowIdx int
	var symbolColumnIdx, scripCodeColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIDColumnIdx, timeColumnIdx, dateColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {

			if strings.Contains(colCell, "Company") {
				// If we found "Symbol" in the header, we can assume this is the header row.
				headerRowIdx = rowIdx
				symbolColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Scrip Code") {
				scripCodeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Segment") {
				segmentColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Side") {
				tradeTypeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Quantity") {
				quantityColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Price") {
				priceColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Num") {
				orderIDColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Trade Time") {
				timeColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Date") {
				dateColumnIdx = columnIdx
			}

			// If we have found the header row, and we are past it, we can stop.
			if headerRowIdx > 0 && rowIdx > headerRowIdx {
				break
			}
		}
	}

	return &importFileMetadata{
		headerRowIdx:       headerRowIdx,
		symbolColumnIdx:    symbolColumnIdx,
		scripCodeIdx:       scripCodeColumnIdx,
		segmentColumnIdx:   segmentColumnIdx,
		tradeTypeColumnIdx: tradeTypeColumnIdx,
		quantityColumnIdx:  quantityColumnIdx,
		priceColumnIdx:     priceColumnIdx,
		orderIDColumnIdx:   orderIDColumnIdx,
		dateColumnIdx:      dateColumnIdx,
		timeColumnIdx:      timeColumnIdx,
	}, nil
}

func (i *UpstoxImporter) parseRow(row []string, metadata *importFileMetadata) (*ImportableTrade, error) {
	symbolColumnIdx := metadata.symbolColumnIdx
	scripCodeColumnIdx := metadata.scripCodeIdx
	segmentColumnIdx := metadata.segmentColumnIdx
	tradeTypeColumnIdx := metadata.tradeTypeColumnIdx
	quantityColumnIdx := metadata.quantityColumnIdx
	priceColumnIdx := metadata.priceColumnIdx
	orderIDColumnIdx := metadata.orderIDColumnIdx
	dateColumnIdx := metadata.dateColumnIdx
	timeColumnIdx := metadata.timeColumnIdx

	symbolStr := row[symbolColumnIdx]
	if symbolStr == "" {
		return nil, fmt.Errorf("Symbol is empty in row")
	}

	// In Upstox, the symbol is actually the company name, so we need to use teh "exchange_token" to get the actual symbol.
	scripCode := row[scripCodeColumnIdx]

	if scripCode != "" {
		// If we have a scrip code, we will use it to get the actual symbol.
		symbol, exists := symbol.GetSymbolFromCode(scripCode)

		// If we do have a symbol, we will use it.
		if exists {
			symbolStr = symbol
		}
	}

	// We can use the scrip code to get the actual symbol from the exchange.

	segment := row[segmentColumnIdx]
	if segment == "" {
		return nil, fmt.Errorf("Segment is empty in row")
	}

	orderID := row[orderIDColumnIdx]
	if orderID == "" {
		return nil, fmt.Errorf("Order ID is empty in row")
	}

	// Parse trade details from the row
	tradeTypeStr := row[tradeTypeColumnIdx]
	quantityStr := row[quantityColumnIdx]
	priceStr := row[priceColumnIdx]

	tradeKind := types.TradeKind(strings.ToLower(tradeTypeStr))
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		return nil, fmt.Errorf("Invalid quantity at row : %s", quantityStr)
	}

	// Check if the price string starts with the rupee symbol and strip it
	if after, ok := strings.CutPrefix(priceStr, "₹"); ok {
		priceStr = after
		priceStr = strings.TrimSpace(priceStr)
	}

	// Remove ₹ and commas
	priceStr = strings.ReplaceAll(priceStr, "₹", "")
	priceStr = strings.ReplaceAll(priceStr, ",", "")

	price, err := decimal.NewFromString(priceStr)
	if err != nil {
		return nil, fmt.Errorf("Invalid price at row : %s", priceStr)
	}

	tz, _ := common.GetTimeZoneForExchange(common.ExchangeNSE)
	ist, err := time.LoadLocation(string(tz))
	if err != nil {
		return nil, fmt.Errorf("Failed to load timezone for trade: %s", tz)
	}

	dateStr := row[dateColumnIdx]
	timeStr := row[timeColumnIdx]

	// Combine date and time strings
	dateTimeStr := dateStr + " " + timeStr
	tradeTime, err := time.ParseInLocation("02-01-2006 15:04:05", dateTimeStr, ist)
	if err != nil {
		return nil, fmt.Errorf("Invalid datetime at row : %s", dateTimeStr)
	}

	instrument := types.InstrumentEquity

	// We will create our own order ID based on the first 3 characters of the order ID and the date.
	// We need date because using just the first 3 characters of the order ID can lead to collisions.
	// Adding date ensure that there are no collisions, unless my assumption about the first 3 characters is wrong.
	// Upstox does not provide a unique order ID for each trade, but they have a pattern to identify
	// which trades belong to the same order.
	// The first 3 characters of the order ID are the same for all trades that belong to the same order.
	// So we will create a custom order ID by combining the first 3 characters of the order ID with the trade's date.
	// Create a custom order ID by combining the first 3 characters of the order ID with the date.
	// NOTE: Well, I found a collision when using only prefix + date, so I added the symbol as well.
	orderIDPrefix := orderID[:3]
	dateStr = tradeTime.Format("20060102")
	orderID = orderIDPrefix + dateStr + symbolStr

	return &ImportableTrade{
		Symbol:     symbolStr,
		Instrument: instrument,
		TradeKind:  tradeKind,
		Quantity:   decimal.NewFromFloat(quantity),
		Price:      price,
		OrderID:    orderID,
		Time:       tradeTime,
	}, nil
}

// getImporter returns an importer for the given broker.
func getImporer(b *broker.Broker) (Importer, error) {
	switch b.Name {
	case broker.BrokerNameZerodha:
		return &ZerodhaImporter{}, nil
	case broker.BrokerNameGroww:
		return &GrowwImporter{}, nil
	case broker.BrokerNameUpstox:
		return &UpstoxImporter{}, nil
	default:
		return nil, fmt.Errorf("unsupported broker: %s", b.Name)
	}
}
