package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/currency"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/trade"
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
	brokerRepository   broker.ReadWriter
	positionRepository ReadWriter
	tradeRepository    trade.ReadWriter
}

func NewService(brokerRepository broker.ReadWriter, positionRepository ReadWriter, tradeRepository trade.ReadWriter) *Service {
	return &Service{
		brokerRepository,
		positionRepository,
		tradeRepository,
	}
}

type ComputePayload struct {
	RiskAmount decimal.Decimal       `json:"risk_amount"`
	Trades     []trade.CreatePayload `json:"trades"`
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

func (s *Service) Compute(ctx context.Context, payload ComputePayload) (computeResult, service.Error, error) {
	result := Compute(payload)
	return result, service.ErrNone, nil
}

type CreatePayload struct {
	ComputePayload
	CreatedBy uuid.UUID

	Symbol     string                `json:"symbol"`
	Instrument Instrument            `json:"instrument"`
	Currency   currency.CurrencyCode `json:"currency"`
}

func (s *Service) Create(ctx context.Context, payload CreatePayload) (*Position, service.Error, error) {
	logger := logger.FromCtx(ctx)
	var err error

	position, err := new(payload)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	err = s.positionRepository.Create(ctx, position)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	trades, err := s.tradeRepository.Create(ctx, position.Trades)
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

	positions, totalItems, err := s.positionRepository.Search(ctx, payload)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("position repository list: %w", err)
	}

	result := common.NewSearchResult(positions, payload.Pagination.GetMeta(totalItems))

	return result, service.ErrNone, nil
}

type ImportPayload struct {
	// The excel file from which we will import positions.
	// These files are expected to be in .xlsx format and are provided by a broker.
	File multipart.File `form:"file"`
	// Broker ID is the ID of the broker from which the positions are being imported.
	BrokerID uuid.UUID `form:"broker_id"`
	// Currency is the currency in which the positions are denominated.
	Currency currency.CurrencyCode `json:"currency"`
	// RiskAmount is the risk amount that will be used to compute R-Factor.
	RiskAmount decimal.Decimal `json:"risk_amount"`
	// Confirm is a boolean flag to indicate whether the positions should be created in the database.
	Confirm bool
}

type ImportResult struct {
	Positions               []*Position `json:"positions"`
	PositionsCount          int         `json:"positions_count"`
	DuplicatePositionsCount int         `json:"duplicate_positions_count"`
	PositionsImportedCount  int         `json:"positions_imported_count"`
	FromDate                time.Time   `json:"from_date"`
	ToDate                  time.Time   `json:"to_date"`
}

var errImportFileInvalid = errors.New("File seems broken or unsupported")

func (s *Service) Import(ctx context.Context, userID uuid.UUID, payload ImportPayload) (*ImportResult, service.Error, error) {
	l := logger.FromCtx(ctx)
	now := time.Now().UTC()

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
			return nil, service.ErrNotFound, fmt.Errorf("Broker not found with ID: %s", payload.BrokerID)
		}
	}

	importer, err := getBrokerImporter(broker)
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

	// Map to store the symbol for each Order ID.
	orderIDToSymbolMap := make(map[string]string)
	// Map to store the instrument for each Order ID.
	orderIDToInstrumentMap := make(map[string]Instrument)

	// Map to track open positions by Symbol
	openPositions := make(map[string]*Position)
	// Array to store all finalized positions
	finalizedPositions := []*Position{}

	// Define a struct to store trades with their Order IDs
	type TradeWithOrderID struct {
		OrderID string
		Payload trade.CreatePayload
	}

	// Slice to store trades with their Order IDs
	tradesWithOrderIDs := []TradeWithOrderID{}

	// Map to aggregate trades by Order ID.
	// This will help in calculating the weighted average price for trades with the same Order ID.
	// When a user places a trade, the execution can happen in multiple parts leading to multiple trades with the same Order ID.
	aggregatedTrades := make(map[string]struct {
		TradeKind  trade.Kind
		Time       time.Time
		Quantity   decimal.Decimal
		TotalPrice decimal.Decimal
		Charges    decimal.Decimal
	})

	metadata, err := importer.getMetadata(rows)
	if err != nil {
		l.Infow("Failed to get metadata from importer", "error", err, "broker", broker)
		return nil, service.ErrBadRequest, errImportFileInvalid
	}

	headerRowIdx := metadata.headerRowIdx

	// Replace the map with a slice and populate it
	for rowIdx, row := range rows[headerRowIdx+1:] {
		l.Debugf("Processing row %d: %v\n", rowIdx+headerRowIdx+1, row)

		parseRowResult, err := importer.parseRow(row, metadata)
		if err != nil {
			return nil, service.ErrBadRequest, fmt.Errorf("failed to parse row %d: %w", rowIdx+headerRowIdx+1, err)
		}

		// Aggregate trades by orderID
		if existing, found := aggregatedTrades[parseRowResult.orderId]; found {
			existing.Quantity = existing.Quantity.Add(parseRowResult.quantity)
			existing.TotalPrice = existing.TotalPrice.Add(parseRowResult.price.Mul(parseRowResult.quantity))
			existing.Time = parseRowResult.time
			aggregatedTrades[parseRowResult.orderId] = existing
		} else {
			aggregatedTrades[parseRowResult.orderId] = struct {
				TradeKind  trade.Kind
				Time       time.Time
				Quantity   decimal.Decimal
				TotalPrice decimal.Decimal
				Charges    decimal.Decimal
			}{
				TradeKind:  parseRowResult.tradeKind,
				Time:       parseRowResult.time,
				Quantity:   parseRowResult.quantity,
				TotalPrice: parseRowResult.price.Mul(parseRowResult.quantity),
				Charges:    decimal.NewFromInt(20), // Assuming a fixed charge of 20 for simplicity, this can be adjusted based on the broker's fee structure.
			}
		}

		orderIDToSymbolMap[parseRowResult.orderId] = parseRowResult.symbol
		orderIDToInstrumentMap[parseRowResult.orderId] = parseRowResult.instrument
	}

	// Convert aggregated trades to tradesWithOrderIDs
	for orderID, aggregatedTrade := range aggregatedTrades {
		averagePrice := aggregatedTrade.TotalPrice.Div(aggregatedTrade.Quantity)
		// Round the average price to match database precision
		averagePrice = averagePrice.Round(2)

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

	brokerTradeIDs, err := s.tradeRepository.GetAllBrokerTradeIDs(ctx, &userID, &broker.ID)
	if err != nil {
		l.Errorw("failed to get all broker trade IDs", "error", err, "broker_id", broker.ID)
		// Not returning an error here, as we can still process trades without existing broker trade IDs.
	}

	// Process the sorted trades
	for _, tradeWithOrderID := range tradesWithOrderIDs {
		orderID := tradeWithOrderID.OrderID
		tradePayload := tradeWithOrderID.Payload
		symbol, exists := orderIDToSymbolMap[orderID]
		if !exists {
			return nil, service.ErrInternalServerError, fmt.Errorf("Order ID %s not found in symbol map", orderID)
		}

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

			computeResult := Compute(computePayload)

			// Update the position with the compute result
			openPosition.Direction = computeResult.Direction
			openPosition.Status = computeResult.Status
			openPosition.OpenedAt = computeResult.OpenedAt
			openPosition.ClosedAt = computeResult.ClosedAt
			openPosition.GrossPnLAmount = computeResult.GrossPnLAmount
			openPosition.NetPnLAmount = computeResult.NetPnLAmount
			openPosition.RiskAmount = payload.RiskAmount
			openPosition.RFactor = computeResult.RFactor
			openPosition.NetReturnPercentage = computeResult.NetReturnPercentage
			openPosition.ChargesAsPercentageOfNetPnL = computeResult.ChargesAsPercentageOfNetPnL
			openPosition.TotalChargesAmount = computeResult.TotalChargesAmount

			// If the position is closed (net quantity is 0), finalize it
			if computeResult.OpenQuantity.IsZero() {
				// Finalize the position
				finalizedPositions = append(finalizedPositions, openPosition)
				// Remove the finalized position from the openPositions map
				delete(openPositions, symbol)
			}
		} else {
			// If no open position exists, create a new one
			instrument, exists := orderIDToInstrumentMap[orderID]
			if !exists {
				return nil, service.ErrInternalServerError, fmt.Errorf("Order ID %s not found in instrument map", orderID)
			}

			// Initialize the position with the first trade
			computePayload := ComputePayload{
				RiskAmount: payload.RiskAmount,
				Trades:     []trade.CreatePayload{tradePayload},
			}
			computeResult := Compute(computePayload)

			positionID, err := uuid.NewV7()
			if err != nil {
				return nil, service.ErrInternalServerError, fmt.Errorf("failed to generate UUID for position: %w", err)
			}

			newTrade.PositionID = positionID
			newTrade.BrokerTradeID = &orderID

			trades := []*trade.Trade{
				newTrade,
			}

			openPositions[symbol] = &Position{
				ID:                          positionID,
				CreatedBy:                   userID,
				CreatedAt:                   now,
				Symbol:                      symbol,
				Instrument:                  instrument,
				Currency:                    payload.Currency,
				Trades:                      trades,
				Direction:                   computeResult.Direction,
				Status:                      computeResult.Status,
				OpenedAt:                    computeResult.OpenedAt,
				ClosedAt:                    computeResult.ClosedAt,
				GrossPnLAmount:              computeResult.GrossPnLAmount,
				NetPnLAmount:                computeResult.NetPnLAmount,
				RFactor:                     computeResult.RFactor,
				NetReturnPercentage:         computeResult.NetReturnPercentage,
				ChargesAsPercentageOfNetPnL: computeResult.ChargesAsPercentageOfNetPnL,
				BrokerID:                    &broker.ID,
			}
		}
	}

	// Add any remaining open positions to the finalized positions
	for _, openPosition := range openPositions {
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

	for positionIdx, position := range finalizedPositions {
		var isDuplicate bool

		for _, trade := range position.Trades {
			orderID := trade.BrokerTradeID

			if common.ExistsInSet(brokerTradeIDs, *orderID) {
				isDuplicate = true

				// If we find a duplicate, we can break out of the loop early.
				// Because if one trade in the position is a duplicate,
				// the whole position is considered a duplicate.
				break
			}
		}

		if isDuplicate {
			l.Infow("skipping position because it is a duplicate", "symbol", position.Symbol, "opened_at", position.OpenedAt)
			duplicatePositionsCount += 1
			finalizedPositions[positionIdx].IsDuplicate = true
			// We skip the position if it has any duplicate trades.
			continue
		}

		// If confirm is true, we will create the positions in the database.
		if payload.Confirm {
			// Create the position in the database
			err := s.positionRepository.Create(ctx, position)
			if err != nil {
				return nil, service.ErrInternalServerError, err
			}

			// Create the trades in the database
			_, err = s.tradeRepository.Create(ctx, position.Trades)
			if err != nil {
				s.positionRepository.Delete(ctx, position.ID)
				return nil, service.ErrInternalServerError, err
			}

			positionsImported += 1
		}
	}

	l.Infof("Duplicate positions skipped: %d", duplicatePositionsCount)

	result := &ImportResult{
		Positions:               finalizedPositions,
		PositionsCount:          len(finalizedPositions), // Client can check length of positions?
		DuplicatePositionsCount: duplicatePositionsCount,
		PositionsImportedCount:  positionsImported,
		FromDate:                metadata.from,
		ToDate:                  metadata.to,
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
