package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type importOptions struct {
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

type importResult struct {
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

func Import(ctx context.Context, importableTrades []*types.ImportableTrade, options importOptions) (*importResult, service.Error, error) {
	l := logger.FromCtx(ctx)
	now := time.Now().UTC()

	// Map to store parsed rows by Order ID.
	// This makes it easy to access the parsed row data by Order ID later.
	parsedRowByOrderID := map[string]*types.ImportableTrade{}

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

	brokerTradeIDs, err := options.positionService.tradeRepository.GetAllBrokerTradeIDs(ctx, &options.userID, &options.broker.ID)
	if err != nil {
		l.Errorw("failed to get all broker trade IDs", "error", err, "broker_id", options.broker.ID)
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
				RiskAmount: options.riskAmount,
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
				RiskAmount: options.riskAmount,
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
				CreatedBy:           options.userID,
				CreatedAt:           now,
				Symbol:              symbol,
				Instrument:          instrument,
				Currency:            options.currency,
				RiskAmount:          options.riskAmount,
				Trades:              trades,
				BrokerID:            &options.broker.ID,
				UserBrokerAccountID: &options.userBrokerAccountID,
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
		switch options.chargesCalculationMethod {
		case ChargesCalculationMethodAuto:
			_, userErr, err := CalculateAndApplyChargesToTrades(position.Trades, options.instrument, options.broker.Name)
			if err != nil {
				if userErr {
					return nil, service.ErrBadRequest, err
				} else {
					return nil, service.ErrInternalServerError, fmt.Errorf("CalculateAndApplyChargesToTrades: %w", err)
				}
			}

		case ChargesCalculationMethodManual:
			for _, trade := range position.Trades {
				trade.ChargesAmount = options.manualChargeAmount
			}
		}

		// Add the position's total charges amount.
		// This is calculated from the trades in the position.
		position.TotalChargesAmount = calculateTotalChargesAmountFromTrades(position.Trades)

		// As we have updated the trades with charges, we need to recompute the position.
		computePayload := ComputePayload{
			RiskAmount: options.riskAmount,
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
			if options.force && options.confirm {
				l.Debugw("force importing a duplicate position, deleting existing position", "symbol", position.Symbol, "opened_at", position.OpenedAt)

				svcErr, err := options.positionService.Delete(ctx, options.userID, positionIDForTheDuplicateOrderID)
				if err != nil {
					return nil, svcErr, fmt.Errorf("failed to delete existing position: %w", err)
				}

				// Create the position in the database
				err = options.positionService.positionRepository.Create(ctx, position)
				if err != nil {
					return nil, service.ErrInternalServerError, err
				}

				// Create the trades in the database
				_, err = options.positionService.tradeRepository.CreateForPosition(ctx, position.Trades)
				if err != nil {
					// Delete the position if trades creation fails.
					options.positionService.positionRepository.Delete(ctx, position.ID)
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
		if options.confirm {
			// Create the position in the database
			err := options.positionService.positionRepository.Create(ctx, position)
			if err != nil {
				return nil, service.ErrInternalServerError, err
			}

			// Create the trades in the database
			_, err = options.positionService.tradeRepository.CreateForPosition(ctx, position.Trades)
			if err != nil {
				// Delete the position if trades creation fails.
				options.positionService.positionRepository.Delete(ctx, position.ID)
				return nil, service.ErrInternalServerError, err
			}

			positionsImported += 1
		}
	}

	l.Debugf("Duplicate positions skipped: %d", duplicatePositionsCount)

	result := &importResult{
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
