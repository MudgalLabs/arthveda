package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/broker_integration"
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
	"arthveda/internal/feature/user_broker_account"
	"arthveda/internal/logger"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"github.com/xuri/excelize/v2"
)

type Service struct {
	brokerRepository            broker.ReadWriter
	positionRepository          ReadWriter
	tradeRepository             trade.ReadWriter
	userBrokerAccountRepository user_broker_account.Reader
}

func NewService(brokerRepository broker.ReadWriter, positionRepository ReadWriter, tradeRepository trade.ReadWriter,
	userBrokerAccountRepository user_broker_account.Reader,
) *Service {
	return &Service{
		brokerRepository,
		positionRepository,
		tradeRepository,
		userBrokerAccountRepository,
	}
}

type ComputePayload struct {
	Trades     []trade.CreatePayload `json:"trades"`
	RiskAmount decimal.Decimal       `json:"risk_amount"`

	// Data below is needed to calculate charges.
	Instrument        types.Instrument `json:"instrument"`
	EnableAutoCharges bool             `json:"enable_auto_charges"`
	BrokerID          *uuid.UUID       `json:"broker_id"`
}

type ComputeServiceResult struct {
	computeResult

	// This order will match the order of trades in the ComputePayload.
	TradeCharges []decimal.Decimal `json:"trade_charges"`
}

func (s *Service) Compute(ctx context.Context, payload ComputePayload) (ComputeServiceResult, service.Error, error) {
	result := ComputeServiceResult{}
	computeResult, err := Compute(payload)

	if err != nil {
		return result, service.ErrBadRequest, err
	}

	result.computeResult = computeResult

	if payload.EnableAutoCharges {
		if payload.BrokerID == nil {
			return result, service.ErrBadRequest, fmt.Errorf("Broker Account is required to calculate charges")
		}

		broker, err := s.brokerRepository.GetByID(ctx, *payload.BrokerID)
		if err != nil {
			if err == repository.ErrNotFound {
				return result, service.ErrBadRequest, fmt.Errorf("Broker provided is invalid or does not exist")
			}
			return result, service.ErrInternalServerError, fmt.Errorf("failed to get broker by ID: %w", err)
		}

		trades, err := createTradesFromCreatePayload(payload.Trades, uuid.Nil)
		if err != nil {
			return result, service.ErrInternalServerError, fmt.Errorf("create trades from create payload: %w", err)
		}

		charges, userErr, err := CalculateAndApplyChargesToTrades(trades, payload.Instrument, broker.Name)
		if err != nil {
			if userErr {
				return result, service.ErrBadRequest, err
			} else {
				return result, service.ErrInternalServerError, fmt.Errorf("CalculateAndApplyChargesToTrades: %w", err)
			}
		}

		result.computeResult.TotalChargesAmount = calculateTotalChargesAmountFromTrades(trades)
		result.TradeCharges = charges
	}

	return result, service.ErrNone, nil
}

type CreatePayload struct {
	ComputePayload

	Notes               string                `json:"notes"`
	Symbol              string                `json:"symbol"`
	Instrument          types.Instrument      `json:"instrument"`
	Currency            currency.CurrencyCode `json:"currency"`
	UserBrokerAccountID *uuid.UUID            `json:"user_broker_account_id"`
}

func (s *Service) Create(ctx context.Context, userID uuid.UUID, payload CreatePayload) (*Position, service.Error, error) {
	logger := logger.FromCtx(ctx)
	var err error

	position, userErr, err := new(userID, payload)
	if err != nil {
		if userErr {
			return nil, service.ErrBadRequest, err
		} else {
			return nil, service.ErrInternalServerError, fmt.Errorf("new: %w", err)
		}
	}

	err = s.positionRepository.Create(ctx, position)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	trades, err := s.tradeRepository.CreateForPosition(ctx, position.Trades)
	if err != nil {
		logger.Errorw("failed to create trades after creating a position, so deleting the position that was created", "error", err, "position_id", position.ID)
		s.positionRepository.Delete(ctx, position.ID)
		return nil, service.ErrInternalServerError, err
	}

	position.Trades = trades

	return position, service.ErrNone, nil
}

type SearchPayload = common.SearchPayload[SearchFilter]
type SearchResult = common.SearchResult[[]*Position]

func (s *Service) Search(ctx context.Context, payload SearchPayload) (*SearchResult, service.Error, error) {
	err := payload.Init(allowedSortFields)
	if err != nil {
		return nil, service.ErrInvalidInput, err
	}

	positions, totalItems, err := s.positionRepository.Search(ctx, payload, false)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("position repository list: %w", err)
	}

	result := common.NewSearchResult(positions, payload.Pagination.GetMeta(totalItems))

	return result, service.ErrNone, nil
}

type ChargesCalculationMethod string

const (
	ChargesCalculationMethodAuto   ChargesCalculationMethod = "auto"   // Automatically calculate charges based on broker and instrument.
	ChargesCalculationMethodManual ChargesCalculationMethod = "manual" // Manually specify charges for each trade.
)

type FileImportPayload struct {
	// Broker ID is the ID of the broker from which the positions are being imported.
	BrokerID uuid.UUID `form:"broker_id"`

	// To which UserBrokerAccount the positions are being imported to.
	UserBrokerAccountID uuid.UUID `json:"user_broker_account_id"`

	// The excel file from which we will import positions.
	// These files are expected to be in .xlsx format and are provided by a broker.
	File multipart.File `form:"file"`

	// Currency is the currency in which the positions are denominated.
	Currency currency.CurrencyCode `json:"currency"`

	// RiskAmount is the risk amount that will be used to compute R-Factor.
	RiskAmount decimal.Decimal `json:"risk_amount"`

	// Instrument is the instrument type of the positions being imported.
	Instrument types.Instrument `json:"instrument"`

	// Whether to auto calculate charges or let user provide a manual charge amount.
	ChargesCalculationMethod ChargesCalculationMethod `json:"charges_calculation_method"`

	// If ChargesCalculationMethod is Manual, this field will be used to specify the charge amount for each trade.
	ManualChargeAmount decimal.Decimal `json:"manual_charge_amount"`

	// Confirm is a boolean flag to indicate whether the positions should be created in the database.
	Confirm bool

	// Force is a boolean flag to indicate whether the import should overwrite existing positions.
	Force bool `json:"force"`
}

var errImportFileInvalid = errors.New("File seems invalid or unsupported")

func (s *Service) FileImport(ctx context.Context, userID uuid.UUID, payload FileImportPayload) (*ImportResult, service.Error, error) {
	l := logger.FromCtx(ctx)

	// Save it temporarily (excelize works with file paths or io.Reader)
	tempFile, err := os.CreateTemp("", "upload-*.xlsx")
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to create temp file: %w", err)
	}

	defer os.Remove(tempFile.Name()) // clean up

	io.Copy(tempFile, payload.File) // copy the uploaded file to the temp file
	tempFile.Close()

	// Open Excel file
	excelFile, err := excelize.OpenFile(tempFile.Name())
	if err != nil {
		return nil, service.ErrBadRequest, fmt.Errorf("Unable to read excel file")
	}

	defer excelFile.Close()

	broker, err := s.brokerRepository.GetByID(ctx, payload.BrokerID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, fmt.Errorf("Broker provided is invalid or does not exist")
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get broker by ID: %w", err)
	}

	uba, err := s.userBrokerAccountRepository.GetByID(ctx, payload.UserBrokerAccountID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrBadRequest, fmt.Errorf("Broker Account provided is invalid or does not exist")
		}

		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get user's broker account by ID: %w", err)
	}

	if uba.BrokerID != broker.ID {
		return nil, service.ErrBadRequest, fmt.Errorf("Broker Account provided does not belong to the Broker provided")
	}

	fileAdapter, err := broker_integration.GetFileAdapter(broker)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get broker importer: %w", err)
	}

	// Get first sheet name
	sheet := excelFile.GetSheetName(0)

	// Get all rows
	rows, err := excelFile.GetRows(sheet)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to read rows from excel file: %w", err)
	}

	if len(rows) == 0 {
		return nil, service.ErrBadRequest, fmt.Errorf("Excel file is empty")
	}

	metadata, err := fileAdapter.GetMetadata(rows)
	if err != nil {
		l.Infow("Failed to get metadata from importer", "error", err, "broker", broker)
		return nil, service.ErrBadRequest, errImportFileInvalid
	}

	headerRowIdx := metadata.HeaderRowIdx
	importableTrades := []*types.ImportableTrade{}

	// Replace the map with a slice and populate it
	for rowIdx, row := range rows[headerRowIdx+1:] {
		l.Debugf("Processing row %d: %v\n", rowIdx+headerRowIdx+1, row)

		if len(row) == 0 {
			l.Debugf("Found an empty row. We will stop processing further rows assuming we have reached the end.")
			break
		}

		importableTrade, err := fileAdapter.ParseRow(row, metadata)
		if err != nil {
			return nil, service.ErrBadRequest, fmt.Errorf("failed to parse row %d: %w", rowIdx+headerRowIdx+1, err)
		}

		importableTrades = append(importableTrades, importableTrade)
	}

	options := ImportPayload{
		UserID:                   userID,
		UserBrokerAccountID:      payload.UserBrokerAccountID,
		Broker:                   broker,
		RiskAmount:               payload.RiskAmount,
		Currency:                 payload.Currency,
		ChargesCalculationMethod: payload.ChargesCalculationMethod,
		ManualChargeAmount:       payload.ManualChargeAmount,
		Instrument:               payload.Instrument,
		Confirm:                  payload.Confirm,
		Force:                    payload.Force,
	}
	return s.Import(ctx, importableTrades, options)
}

type ImportPayload struct {
	// User ID for whom the trades are being imported.
	UserID uuid.UUID

	UserBrokerAccountID uuid.UUID

	Broker *broker.Broker

	// RiskAmount is the risk amount that will be used to compute R-Factor.
	RiskAmount decimal.Decimal

	// Currency is the Currency in which the positions are denominated.
	Currency currency.CurrencyCode

	// Whether to auto calculate charges or let user provide a manual charge amount.
	ChargesCalculationMethod ChargesCalculationMethod

	// If ChargesCalculationMethod is Manual, this field will be used to specify the charge amount for each trade.
	ManualChargeAmount decimal.Decimal

	// Instrument is the Instrument type of the positions being imported.
	Instrument types.Instrument

	// Confirm is a boolean flag to indicate whether the positions should be created in the database.
	Confirm bool

	// Force is a boolean flag to indicate whether the import should overwrite existing positions.
	Force bool
}

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

func (s *Service) Import(ctx context.Context, importableTrades []*types.ImportableTrade, payload ImportPayload) (*ImportResult, service.Error, error) {
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

	brokerTradeIDs, err := s.tradeRepository.GetAllBrokerTradeIDs(ctx, &payload.UserID, &payload.Broker.ID)
	if err != nil {
		l.Errorw("failed to get all broker trade IDs", "error", err, "broker_id", payload.Broker.ID)
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
				RiskAmount: payload.RiskAmount,
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
				RiskAmount: payload.RiskAmount,
				Trades:     []trade.CreatePayload{tradePayload},
			}

			positionID, err := uuid.NewV7()
			if err != nil {
				return nil, service.ErrInternalServerError, fmt.Errorf("failed to generate UUID for position: %w", err)
			}

			computeResult, err := Compute(computePayload)
			if err != nil {
				l.Debugw("failed to compute position after creating a new position and marking it as invalid", "error", err, "position_id", positionID, "symbol", parsedRow.Symbol)
				invalidPositionsByPosID[positionID] = true
				continue
			}

			newTrade.PositionID = positionID
			newTrade.BrokerTradeID = &orderID

			trades := []*trade.Trade{
				newTrade,
			}

			newPosition := &Position{
				ID:                  positionID,
				CreatedBy:           payload.UserID,
				CreatedAt:           now,
				Symbol:              symbol,
				Instrument:          instrument,
				Currency:            payload.Currency,
				RiskAmount:          payload.RiskAmount,
				Trades:              trades,
				BrokerID:            &payload.Broker.ID,
				UserBrokerAccountID: &payload.UserBrokerAccountID,
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

	for positionIdx, finalizedPos := range finalizedPositions {
		var isDuplicate bool
		// If we find a duplicate trade, we need to get it's position ID.
		var positionIDForTheDuplicateOrderID uuid.UUID

		for _, trade := range finalizedPos.Trades {
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

		var existingPosition *Position
		var svcErr service.Error

		if isDuplicate {
			existingPosition, svcErr, err = s.Get(ctx, payload.UserID, positionIDForTheDuplicateOrderID)
			if err != nil {
				return nil, svcErr, fmt.Errorf("failed to fetch existing position: %w", err)
			}

			// We should copy some fields from the existing position to the new position.
			// This helps us keep the risk amount of the existing position.
			// Also the URL for the existing position will be the same as the new position.
			finalizedPos.RiskAmount = existingPosition.RiskAmount

			// So that the existing URL to view the position remains the same.
			finalizedPos.ID = existingPosition.ID
			finalizedPos.Notes = existingPosition.Notes
			finalizedPos.IsDuplicate = true

			// Update the positionID for the trades in the position.
			for _, trade := range finalizedPos.Trades {
				trade.PositionID = existingPosition.ID
			}
		}

		switch payload.ChargesCalculationMethod {
		case ChargesCalculationMethodAuto:
			_, userErr, err := CalculateAndApplyChargesToTrades(finalizedPos.Trades, finalizedPos.Instrument, payload.Broker.Name)
			if err != nil {
				if userErr {
					return nil, service.ErrBadRequest, err
				} else {
					return nil, service.ErrInternalServerError, fmt.Errorf("CalculateAndApplyChargesToTrades: %w", err)
				}
			}

		case ChargesCalculationMethodManual:
			for _, trade := range finalizedPos.Trades {
				trade.ChargesAmount = payload.ManualChargeAmount
			}
		}

		// Add the position's total charges amount.
		// This is calculated from the trades in the position.
		finalizedPos.TotalChargesAmount = calculateTotalChargesAmountFromTrades(finalizedPos.Trades)

		riskAmount := payload.RiskAmount
		if isDuplicate && existingPosition.RiskAmount.IsPositive() {
			// If we are updating an existing position, we should use the risk amount from the existing position.
			riskAmount = existingPosition.RiskAmount
		}

		// As we have updated the trades with charges, we need to recompute the position.
		computePayload := ComputePayload{
			RiskAmount: riskAmount,
			Trades:     ConvertTradesToCreatePayload(finalizedPos.Trades),
		}

		computeResult, err := Compute(computePayload)
		if err != nil {
			l.Debugw("failed to compute position after charges and marking it as invalid", "error", err, "position_id", finalizedPos.ID, "symbol", finalizedPos.Symbol)
			continue
		}

		ApplyComputeResultToPosition(finalizedPos, computeResult)

		if isDuplicate {
			// If the force & confirm flags are true, we will have to delete the existing position and create a new position.
			if payload.Force && payload.Confirm {
				l.Debugw("force importing a duplicate position, deleting existing position", "symbol", finalizedPos.Symbol, "opened_at", finalizedPos.OpenedAt)

				svcErr, err = s.Delete(ctx, payload.UserID, positionIDForTheDuplicateOrderID)
				if err != nil {
					return nil, svcErr, fmt.Errorf("failed to delete existing position: %w", err)
				}

				// Create the position in the database
				err = s.positionRepository.Create(ctx, finalizedPos)
				if err != nil {
					return nil, service.ErrInternalServerError, err
				}

				// Create the trades in the database
				_, err = s.tradeRepository.CreateForPosition(ctx, finalizedPos.Trades)
				if err != nil {
					// Delete the position if trades creation fails.
					s.positionRepository.Delete(ctx, finalizedPos.ID)
					return nil, service.ErrInternalServerError, err
				}

				positionsImported += 1
				forcedPositionCount += 1
				continue
			}

			l.Debugw("skipping position because it is a duplicate", "symbol", finalizedPos.Symbol, "opened_at", finalizedPos.OpenedAt)
			duplicatePositionsCount += 1
			finalizedPositions[positionIdx].IsDuplicate = true

			// We skip the position if it has any duplicate trades.
			continue
		}

		// If confirm is true, we will create the positions in the database.
		if payload.Confirm {
			// Create the position in the database
			err := s.positionRepository.Create(ctx, finalizedPos)
			if err != nil {
				return nil, service.ErrInternalServerError, err
			}

			// Create the trades in the database
			_, err = s.tradeRepository.CreateForPosition(ctx, finalizedPos.Trades)
			if err != nil {
				// Delete the position if trades creation fails.
				s.positionRepository.Delete(ctx, finalizedPos.ID)
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

func (s *Service) Get(ctx context.Context, userID, positionID uuid.UUID) (*Position, service.Error, error) {
	l := logger.FromCtx(ctx)

	position, err := s.positionRepository.GetByID(ctx, userID, positionID)
	if err != nil || position == nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, fmt.Errorf("Position not found with ID: %s", positionID)
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get position by ID: %w", err)
	}

	trades, err := s.tradeRepository.FindByPositionID(ctx, position.ID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get trades for position ID %s: %w", position.ID, err)
	}

	if len(trades) == 0 {
		l.Errorw("No trades found for position. This shouldn't ever happen. There needs to be at least 1 trade for every position. This is not a valid position.", "position_id", position.ID)
	}

	position.Trades = trades

	return position, service.ErrNone, nil
}

type UpdatePayload struct {
	// We can just use the same payload as CreatePayload for updates.
	CreatePayload
	BrokerID *uuid.UUID `json:"broker_id"`
}

// FIXME: We should figure out a way to use DB transactions.

func (s *Service) Update(ctx context.Context, userID, positionID uuid.UUID, payload UpdatePayload) (*Position, service.Error, error) {
	l := logger.FromCtx(ctx)

	originalPosition, err := s.positionRepository.GetByID(ctx, userID, positionID)
	if err != nil || originalPosition == nil {
		if err == repository.ErrNotFound {
			return nil, service.ErrNotFound, fmt.Errorf("Position not found with ID: %s", positionID)
		}
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get position by ID: %w", err)
	}

	if originalPosition.CreatedBy != userID {
		return nil, service.ErrUnauthorized, fmt.Errorf("user is not allowed to update position %s", positionID)
	}

	// Update the position fields, including trades.
	updatedPosition, userErr, err := originalPosition.update(payload)
	if err != nil {
		if userErr {
			return nil, service.ErrBadRequest, err
		} else {
			return nil, service.ErrInternalServerError, fmt.Errorf("failed to update position: %w", err)
		}
	}

	// Delete existing trades for the position.
	// This is necessary because we are replacing all trades with the new ones. Simple and effective.
	err = s.tradeRepository.DeleteByPositionID(ctx, positionID)
	if err != nil {
		l.Errorw("failed to delete trades for position", "error", err, "position_id", originalPosition.ID)
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to delete trades for position: %w", err)
	}

	// Create new trades for the position.
	trades, err := s.tradeRepository.CreateForPosition(ctx, updatedPosition.Trades)
	if err != nil {
		l.Errorw("failed to create trades for position", "error", err, "position_id", originalPosition.ID)
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to create new trades for position: %w", err)
	}

	// Attach the newly created trades to the updated position.
	updatedPosition.Trades = trades

	// Save the updated position in the repository.
	err = s.positionRepository.Update(ctx, &updatedPosition)
	if err != nil {
		l.Errorw("failed to update position in repository", "error", err, "position_id", originalPosition.ID)
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to update position in repository: %w", err)
	}

	return &updatedPosition, service.ErrNone, nil
}

// FIXME: We should figure out a way to use DB transactions.

func (s *Service) Delete(ctx context.Context, userID, positionID uuid.UUID) (service.Error, error) {
	position, err := s.positionRepository.GetByID(ctx, userID, positionID)
	if err != nil || position == nil {
		if err == repository.ErrNotFound {
			return service.ErrNotFound, fmt.Errorf("Position not found with ID: %s", positionID)
		}
		return service.ErrInternalServerError, fmt.Errorf("failed to get position by ID: %w", err)
	}

	if position.CreatedBy != userID {
		return service.ErrUnauthorized, fmt.Errorf("user is not allowed to delete position %s", positionID)
	}

	// Delete trades associated with the position.
	err = s.tradeRepository.DeleteByPositionID(ctx, positionID)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("failed to delete trades for position: %w", err)
	}

	// Delete the position itself.
	err = s.positionRepository.Delete(ctx, position.ID)
	if err != nil {
		return service.ErrInternalServerError, fmt.Errorf("failed to delete position: %w", err)
	}

	return service.ErrNone, nil
}
