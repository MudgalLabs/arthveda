package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/currency"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"github.com/xuri/excelize/v2"
)

type Service struct {
	positionRepository ReadWriter
	tradeRepository    trade.ReadWriter
}

func NewService(positionRepository ReadWriter, tradeRepository trade.ReadWriter) *Service {
	return &Service{
		positionRepository,
		tradeRepository,
	}
}

type ComputePayload struct {
	RiskAmount    decimal.Decimal       `json:"risk_amount"`
	ChargesAmount decimal.Decimal       `json:"charges_amount"`
	Trades        []trade.CreatePayload `json:"trades"`
}

type computeResult struct {
	Direction                   Direction       `json:"direction"`
	Status                      Status          `json:"status"`
	OpenedAt                    time.Time       `json:"opened_at"`
	ClosedAt                    *time.Time      `json:"closed_at"` // `nil` if the Status is StatusOpen meaning the position is open.
	GrossPnLAmount              decimal.Decimal `json:"gross_pnl_amount"`
	NetPnLAmount                decimal.Decimal `json:"net_pnl_amount"`
	RFactor                     float64         `json:"r_factor"`
	NetReturnPercentage         float64         `json:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL float64         `json:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                decimal.Decimal `json:"open_quantity"`
	OpenAveragePriceAmount      decimal.Decimal `json:"open_average_price_amount"`
}

func (s *Service) Compute(ctx context.Context, payload ComputePayload) (computeResult, service.Error, error) {
	result := compute(payload)
	return result, service.ErrNone, nil
}

type CreatePayload struct {
	ComputePayload
	CreatedBy uuid.UUID

	Symbol     string            `json:"symbol"`
	Instrument Instrument        `json:"instrument"`
	Currency   currency.Currency `json:"currency"`
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

type SearchPayload = common.SearchPayload[searchFilter]
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
	File multipart.File
}

func (s *Service) Import(ctx context.Context, payload ImportPayload) (map[string]any, service.Error, error) {
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
	f, err := excelize.OpenFile(tempFile.Name())
	if err != nil {
		return nil, service.ErrBadRequest, fmt.Errorf("Unable to read excel file")
	}

	defer f.Close()

	// Get first sheet name
	sheet := f.GetSheetName(0)

	// Get all rows
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to read rows from excel file: %w", err)
	}

	if len(rows) == 0 {
		return nil, service.ErrBadRequest, fmt.Errorf("Excel file is empty")
	}

	fmt.Println("Number of rows in the sheet:", len(rows))

	var tradebookStr string
	var headerRowIdx int
	var symbolColumnIdx, segmentColumnIdx, tradeTypeColumnIdx, quantityColumnIdx, priceColumnIdx, orderIdColumnIdx, timeColumnIdx int

	for rowIdx, row := range rows {
		for columnIdx, colCell := range row {
			if strings.Contains(colCell, "Tradebook") {
				tradebookStr = colCell
			}

			if strings.Contains(colCell, "Symbol") {
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
				orderIdColumnIdx = columnIdx
			}

			if strings.Contains(colCell, "Order Execution Time") {
				headerRowIdx = rowIdx
				timeColumnIdx = columnIdx
			}

			// Check if we have found all the required columns.
			if headerRowIdx > 0 {
				break
			}
		}
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

	// Replace the map with a slice and populate it
	for rowIdx, row := range rows[headerRowIdx+1:] {
		l.Debugf("Processing row %d: %v\n", rowIdx+headerRowIdx+1, row)

		symbol := row[symbolColumnIdx]
		if symbol == "" {
			return nil, service.ErrBadRequest, fmt.Errorf("Symbol is empty in row %d", rowIdx+headerRowIdx+1)
		}

		segment := row[segmentColumnIdx]
		if segment == "" {
			return nil, service.ErrBadRequest, fmt.Errorf("Segment is empty in row %d", rowIdx+headerRowIdx+1)
		}

		orderID := row[orderIdColumnIdx]
		if orderID == "" {
			return nil, service.ErrBadRequest, fmt.Errorf("Order ID is empty in row %d", rowIdx+headerRowIdx+1)
		}

		// Parse trade details from the row
		tradeTypeStr := row[tradeTypeColumnIdx]
		quantityStr := row[quantityColumnIdx]
		priceStr := row[priceColumnIdx]
		timeStr := row[timeColumnIdx]

		tradeKind := trade.Kind(tradeTypeStr)
		quantity, err := strconv.ParseFloat(quantityStr, 64)
		if err != nil {
			return nil, service.ErrBadRequest, fmt.Errorf("Invalid quantity at row %d: %v", rowIdx+headerRowIdx+1, err)
		}

		price, err := decimal.NewFromString(priceStr)
		if err != nil {
			return nil, service.ErrBadRequest, fmt.Errorf("Invalid price at row %d: %v", rowIdx+headerRowIdx+1, err)
		}

		tradeTime, err := time.Parse("2006-01-02T15:04:05", timeStr)
		if err != nil {
			return nil, service.ErrBadRequest, fmt.Errorf("Invalid time at row %d: %v", rowIdx+headerRowIdx+1, err)
		}

		// Add the trade to the slice
		tradesWithOrderIDs = append(tradesWithOrderIDs, TradeWithOrderID{
			OrderID: orderID,
			Payload: trade.CreatePayload{
				Kind:     tradeKind,
				Quantity: decimal.NewFromFloat(quantity),
				Price:    price,
				Time:     tradeTime,
			},
		})

		orderIDToSymbolMap[orderID] = symbol

		var instrument Instrument
		if segment == "EQ" {
			instrument = InstrumentEquity
		}

		orderIDToInstrumentMap[orderID] = instrument
	}

	// Sort the trades by execution time
	sort.Slice(tradesWithOrderIDs, func(i, j int) bool {
		return tradesWithOrderIDs[i].Payload.Time.Before(tradesWithOrderIDs[j].Payload.Time)
	})

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
			// Append the trade to the open position
			openPosition.Trades = append(openPosition.Trades, newTrade)

			// Use the compute function to update the position state
			computePayload := ComputePayload{
				RiskAmount:    decimal.Zero,
				ChargesAmount: decimal.Zero,
				Trades:        convertTradesToCreatePayload(openPosition.Trades),
			}
			computeResult := compute(computePayload)

			// Update the position with the compute result
			openPosition.Direction = computeResult.Direction
			openPosition.Status = computeResult.Status
			openPosition.OpenedAt = computeResult.OpenedAt
			openPosition.ClosedAt = computeResult.ClosedAt
			openPosition.GrossPnLAmount = computeResult.GrossPnLAmount
			openPosition.NetPnLAmount = computeResult.NetPnLAmount
			openPosition.RFactor = computeResult.RFactor
			openPosition.NetReturnPercentage = computeResult.NetReturnPercentage
			openPosition.ChargesAsPercentageOfNetPnL = computeResult.ChargesAsPercentageOfNetPnL

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
				RiskAmount:    decimal.Zero,
				ChargesAmount: decimal.Zero,
				Trades:        []trade.CreatePayload{tradePayload},
			}
			computeResult := compute(computePayload)

			trades := []*trade.Trade{
				newTrade,
			}

			openPositions[symbol] = &Position{
				Symbol:                      symbol,
				Instrument:                  instrument,
				Currency:                    currency.CurrencyINR,
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

	if tradebookStr == "" {
		return nil, service.ErrBadRequest, fmt.Errorf("Tradebook information not found in the Excel file")
	}

	// Define regex to extract two dates in YYYY-MM-DD format
	re := regexp.MustCompile(`from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})`)
	matches := re.FindStringSubmatch(tradebookStr)

	if len(matches) != 3 {
		fmt.Println("Failed to extract dates")
		return nil, service.ErrBadRequest, fmt.Errorf("Unable to extract date range from tradebook string")
	}

	fromStr := matches[1]
	toStr := matches[2]

	// Parse the strings into time.Time
	layout := "2006-01-02"
	fromDate, err := time.Parse(layout, fromStr)
	if err != nil {
		fmt.Println("Invalid from date:", err)
		return nil, service.ErrBadRequest, fmt.Errorf("Invalid from date format")
	}

	toDate, err := time.Parse(layout, toStr)
	if err != nil {
		fmt.Println("Invalid to date:", err)
		return nil, service.ErrBadRequest, fmt.Errorf("Invalid to date format")
	}

	result := map[string]any{
		"fromDate":           fromDate,
		"toDate":             toDate,
		"finalizedPositions": finalizedPositions,
	}

	return result, service.ErrNone, nil
}
