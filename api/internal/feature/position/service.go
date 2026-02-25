package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/broker_integration"

	"arthveda/internal/domain/subscription"
	"arthveda/internal/domain/symbol"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/broker"
	"arthveda/internal/feature/currency"
	"arthveda/internal/feature/journal_entry"
	"arthveda/internal/feature/tag"
	"arthveda/internal/feature/trade"
	"arthveda/internal/feature/upload"
	"arthveda/internal/feature/userbrokeraccount"
	"arthveda/internal/logger"
	"arthveda/internal/repository"
	"arthveda/internal/service"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Service struct {
	BrokerRepository            broker.ReadWriter
	positionRepository          ReadWriter
	tradeRepository             trade.ReadWriter
	userBrokerAccountRepository userbrokeraccount.Reader
	journalEntryService         *journal_entry.Service
	uploadRepository            upload.ReadWriter
	tagService                  *tag.Service
	tagRepository               tag.Reader
}

func NewService(brokerRepository broker.ReadWriter, positionRepository ReadWriter,
	tradeRepository trade.ReadWriter, userBrokerAccountRepository userbrokeraccount.Reader,
	journalEntryService *journal_entry.Service, uploadRepository upload.ReadWriter,
	tagService *tag.Service, tagRepository tag.Reader,
) *Service {
	return &Service{
		brokerRepository,
		positionRepository,
		tradeRepository,
		userBrokerAccountRepository,
		journalEntryService,
		uploadRepository,
		tagService,
		tagRepository,
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

		broker, err := s.BrokerRepository.GetByID(ctx, *payload.BrokerID)
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
	JournalContent      json.RawMessage       `json:"journal_content"`
	ActiveUploadIDs     []uuid.UUID           `json:"active_upload_ids"`
	TagIDs              []uuid.UUID           `json:"tag_ids"`
}

// FIXME: use transaction.

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

	journalEntry, err := s.journalEntryService.UpsertForPosition(ctx, userID, position.ID, payload.JournalContent)
	if err != nil {
		logger.Errorw("failed to create journal entry after creating a position, so deleting the position and trades that were created", "error", err, "position_id", position.ID)
		s.tradeRepository.DeleteByPositionID(ctx, position.ID)
		s.positionRepository.Delete(ctx, position.ID)
		return nil, service.ErrInternalServerError, err
	}

	position.JournalContent = payload.JournalContent

	err = s.syncUploads(ctx, userID, journalEntry.ID, payload.ActiveUploadIDs)
	if err != nil {
		logger.Errorw("failed to sync uploads after creating a position", "error", err, "position_id", position.ID)
		// Not returning an error here, as the position was created successfully.
	}

	svcErr, err := s.tagService.AttachTagToPosition(ctx, tag.AttachTagToPositionPayload{
		PositionID: position.ID,
		TagIDs:     payload.TagIDs,
	})

	if err != nil {
		logger.Errorw("failed to attach tags to position after creating a position", "error", err, "position_id", position.ID)
		return nil, svcErr, err
	}

	return position, service.ErrNone, nil
}

type SearchPayload = common.SearchPayload[SearchFilter]
type SearchResult struct {
	common.SearchResult[[]*Position]
}

func (s *Service) Search(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer, payload SearchPayload) (*SearchResult, service.Error, error) {
	err := payload.Init(allowedSortFields)
	if err != nil {
		return nil, service.ErrInvalidInput, err
	}

	twelveMonthsAgo := time.Now().AddDate(-1, 0, 0)

	// If the user is not a Pro user, we limit the time range to the last 12 months.
	if !enforcer.CanAccessAllPositions() {
		// If no time range is specified or if the time range is specified,
		// we check if it is more than 12 months ago.
		if payload.Filters.Opened != nil {
			if payload.Filters.Opened.From == nil || (payload.Filters.Opened.From != nil && payload.Filters.Opened.From.Before(twelveMonthsAgo)) {
				payload.Filters.Opened.From = &twelveMonthsAgo
			}
		}
	}

	// Normalize timestamps.
	if payload.Filters.Opened != nil {
		openedFrom := time.Time{}
		openedTo := time.Time{}

		if payload.Filters.Opened.From != nil {
			openedFrom = *payload.Filters.Opened.From
		}

		if payload.Filters.Opened.To != nil {
			openedTo = *payload.Filters.Opened.To
		}

		openedFrom, openedTo, err = common.NormalizeDateRangeFromTimezone(openedFrom, openedTo, tz)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("normalize opened date range: %w", err)
		}

		if payload.Filters.Opened.From != nil {
			payload.Filters.Opened.From = &openedFrom
		}

		if payload.Filters.Opened.To != nil {
			payload.Filters.Opened.To = &openedTo
		}
	}

	// Normalize timestamps.
	if payload.Filters.TradeTime != nil {
		tradeTimeFrom := time.Time{}
		tradeTimeTo := time.Time{}

		if payload.Filters.TradeTime.From != nil {
			tradeTimeFrom = *payload.Filters.TradeTime.From
		}

		if payload.Filters.TradeTime.To != nil {
			tradeTimeTo = *payload.Filters.TradeTime.To
		}

		tradeTimeFrom, tradeTimeTo, err = common.NormalizeDateRangeFromTimezone(tradeTimeFrom, tradeTimeTo, tz)
		if err != nil {
			return nil, service.ErrInternalServerError, fmt.Errorf("normalize trade time date range: %w", err)
		}

		if payload.Filters.TradeTime.From != nil {
			payload.Filters.TradeTime.From = &tradeTimeFrom
		}

		if payload.Filters.TradeTime.To != nil {
			payload.Filters.TradeTime.To = &tradeTimeTo
		}
	}

	positions, totalItems, err := s.positionRepository.Search(ctx, payload, payload.Filters.AttachTrades, true)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("position repository list: %w", err)
	}

	result := common.NewSearchResult(positions, payload.Pagination.GetMeta(totalItems))

	return &SearchResult{
		SearchResult: *result,
	}, service.ErrNone, nil
}

type ChargesCalculationMethod string

const (
	ChargesCalculationMethodAuto   ChargesCalculationMethod = "auto"   // Automatically calculate charges based on broker and instrument.
	ChargesCalculationMethodManual ChargesCalculationMethod = "manual" // Manually specify charges for each trade.
)

type FileImportPayload struct {
	Rows [][]string

	// Broker ID is the ID of the broker from which the positions are being imported.
	BrokerID uuid.UUID `form:"broker_id"`

	// To which UserBrokerAccount the positions are being imported to.
	UserBrokerAccountID uuid.UUID `json:"user_broker_account_id"`

	// Currency is the currency in which the positions are denominated.
	Currency currency.CurrencyCode `json:"currency"`

	// RiskAmount is the risk amount that will be used to compute R-Factor.
	RiskAmount decimal.Decimal `json:"risk_amount"`

	// Instrument is the instrument type of the positions being imported.
	// Instrument types.Instrument `json:"instrument"`

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
	rows := payload.Rows

	// Nothing to do if we have no rows in the file.
	if len(rows) == 0 {
		return &ImportResult{}, service.ErrNone, nil
	}

	broker, err := s.BrokerRepository.GetByID(ctx, payload.BrokerID)
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
			l.Errorw("failed to parse row", "error", err, "row_index", rowIdx+headerRowIdx+1, "row", row)
			return nil, service.ErrBadRequest, fmt.Errorf("File seems invalid or unsupported")
		}

		if importableTrade.ShouldIgnore {
			continue
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

	// Confirm is a boolean flag to indicate whether the positions should be created in the database.
	Confirm bool

	// Force is a boolean flag to indicate whether the import should overwrite existing positions.
	Force bool
}

type ImportResult struct {
	Positions                 []*Position `json:"positions"`
	InvalidPositions          []*Position `json:"invalid_positions"`
	UnsupportedPositions      []*Position `json:"unsupported_positions"`
	PositionsCount            int         `json:"positions_count"`
	DuplicatePositionsCount   int         `json:"duplicate_positions_count"`
	PositionsImportedCount    int         `json:"positions_imported_count"`
	InvalidPositionsCount     int         `json:"invalid_positions_count"`
	ForcedPositionsCount      int         `json:"forced_positions_count"`
	UnsupportedPositionsCount int         `json:"unsupported_positions_count"`
	FromDate                  time.Time   `json:"from_date"`
	ToDate                    time.Time   `json:"to_date"`
}

func (r *ImportResult) Merge(other *ImportResult) {
	if other == nil {
		return
	}

	// Merge slices
	r.Positions = append(r.Positions, other.Positions...)
	r.InvalidPositions = append(r.InvalidPositions, other.InvalidPositions...)
	r.UnsupportedPositions = append(r.UnsupportedPositions, other.UnsupportedPositions...)

	// Merge counters
	r.PositionsCount += other.PositionsCount
	r.DuplicatePositionsCount += other.DuplicatePositionsCount
	r.PositionsImportedCount += other.PositionsImportedCount
	r.InvalidPositionsCount += other.InvalidPositionsCount
	r.ForcedPositionsCount += other.ForcedPositionsCount
	r.UnsupportedPositionsCount += other.UnsupportedPositionsCount

	// Merge date range
	if r.FromDate.IsZero() || (!other.FromDate.IsZero() && other.FromDate.Before(r.FromDate)) {
		r.FromDate = other.FromDate
	}

	if r.ToDate.IsZero() || (!other.ToDate.IsZero() && other.ToDate.After(r.ToDate)) {
		r.ToDate = other.ToDate
	}
}

// TOOD: If I'm Syncing my Zerodha account, due to `force` flag being true, a position that
// had no new trades added to it, is still showing up as "imported". BUT, we should be
// showing that nothing was imported(synced).

func (s *Service) Import(ctx context.Context, importableTrades []*types.ImportableTrade, payload ImportPayload) (*ImportResult, service.Error, error) {
	l := logger.FromCtx(ctx)
	now := time.Now().UTC()

	// Sanitize symbols in importable trades.
	for _, trade := range importableTrades {
		trade.Symbol = symbol.Sanitize(trade.Symbol, trade.Instrument)
	}

	// All the symbols that are found in the `importableTrades`.
	isSymbolBeingImported := make(map[string]bool)
	for _, trade := range importableTrades {
		isSymbolBeingImported[trade.Symbol] = true
	}

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

	// Number of positions that are of unsupported instruments for the broker.
	unsupportedPositionsCount := 0
	unsupportedPositions := []*Position{}

	// Map to track open positions by Symbol.
	// These open positions are the ones that are being considered for the ones being imported.
	// These positions are NOT the ones that are already in Arthveda.
	openPositions := make(map[string]*Position)

	// Fetch open position for this user broker account.
	// If we are importing trades for a user broker account, we need to check if there are any open positions for that account.
	// This is to ensure that we do not create duplicate positions for the same symbol.
	open := StatusOpen
	searchPayload := SearchPayload{
		Filters: SearchFilter{
			UserBrokerAccountID: &payload.UserBrokerAccountID,
			Status:              &open,
		},
		Pagination: common.Pagination{Limit: 100}, // Surely no one is having more than 100 open positions at a time. Right?
	}

	existingOpenPositions, _, err := s.positionRepository.Search(ctx, searchPayload, true, false)
	if err != nil {
		l.Errorw("failed to fetch open positions for user broker account", "error", err, "user_broker_account_id", payload.UserBrokerAccountID)
		// Not returning error, just log and continue
	}

	// Map to store existing open positions by Symbol.
	// These positions are open in Arthveda and will be used to match trades being imported.
	existingOpenPositionsInArthvedaBySymbol := make(map[string]*Position)

	// Map of existing open positions in Arthveda by Position ID that had some new trades added to them during the import.
	existingOpenPositionsInArthvedaWasUpdatedByPositionID := make(map[uuid.UUID]bool)

	for _, pos := range existingOpenPositions {
		// Check if the open position's symbol matches any of the symbols being imported.
		if !isSymbolBeingImported[pos.Symbol] {
			continue
		}
		existingOpenPositionsInArthvedaBySymbol[pos.Symbol] = pos
	}

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

		if existingOpenPosition, exists := existingOpenPositionsInArthvedaBySymbol[symbol]; exists {
			// We should make sure that the trades being imported are after the position was OPENED AT.
			if newTrade.Time.After(existingOpenPosition.OpenedAt) || newTrade.Time.Equal(existingOpenPosition.OpenedAt) {
				if common.ExistsInSet(brokerTradeIDs, orderID) {
					l.Debugw("skipping trade because it already exists in the open position in Arthveda", "order_id", orderID, "symbol", symbol)
					continue
				}

				// If an open position exists in Arthveda for the symbol, we will use that
				// to update the position with the new trade.
				newTrade.PositionID = existingOpenPosition.ID
				newTrade.BrokerTradeID = &orderID
				existingOpenPosition.Trades = append(existingOpenPosition.Trades, newTrade)

				computePayload := ComputePayload{
					RiskAmount: existingOpenPosition.RiskAmount,
					Trades:     ConvertTradesToCreatePayload(existingOpenPosition.Trades),
				}

				computeResult, err := Compute(computePayload)
				if err != nil {
					l.Debugw("failed to compute position that already exists in Arthveda and marking it as invalid", "error", err, "position_id", existingOpenPosition.ID, "symbol", existingOpenPosition.Symbol)
					invalidPositionsByPosID[existingOpenPosition.ID] = true
					continue
				}

				ApplyComputeResultToPosition(existingOpenPosition, computeResult)

				// Update the existing open position with the new trade.
				existingOpenPositionsInArthvedaBySymbol[symbol] = existingOpenPosition
				// Mark that this existing open position in Arthveda was updated with new trades.
				existingOpenPositionsInArthvedaWasUpdatedByPositionID[existingOpenPosition.ID] = true
				continue
			}
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

	// Add positions that were already in Arthveda but had new trades added to them during the import.
	for _, existingOpenPosition := range existingOpenPositionsInArthvedaBySymbol {
		if updated, exists := existingOpenPositionsInArthvedaWasUpdatedByPositionID[existingOpenPosition.ID]; exists && updated {
			if invalid, exists := invalidPositionsByPosID[existingOpenPosition.ID]; exists && invalid {
				l.Debugw("skipping invalid position that was updated with new trades", "position_id", existingOpenPosition.ID, "symbol", existingOpenPosition.Symbol)
				invalidPositions = append(invalidPositions, existingOpenPosition)
				// Skip invalid positions
				continue
			}

			existingOpenPosition.IsDuplicate = true // This position already existed in Arthveda and was updated with new trades.
			finalizedPositions = append(finalizedPositions, existingOpenPosition)
		} else {
			l.Debugw("skipping existing open position in Arthveda that was not updated with new trades", "position_id", existingOpenPosition.ID, "symbol", existingOpenPosition.Symbol)
		}
	}

	// Check finalized positions for unsupported instruments.
	// If the instrument is not supported by the broker, we will mark the position as unsupported.
	filteredFinalizedPositions := finalizedPositions[:0]
	for _, finalizedPos := range finalizedPositions {
		if !payload.Broker.IsInstrumentSupportedForImport(finalizedPos.Instrument) {
			l.Debugw("unsupported instrument found in finalized position", "position_id", finalizedPos.ID, "symbol", finalizedPos.Symbol, "instrument", finalizedPos.Instrument)
			unsupportedPositionsCount++
			unsupportedPositions = append(unsupportedPositions, finalizedPos)
			// Do not add to filteredFinalizedPositions
			continue
		}

		filteredFinalizedPositions = append(filteredFinalizedPositions, finalizedPos)
	}

	// Reassign filtered positions to finalizedPositions
	finalizedPositions = filteredFinalizedPositions

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

		var svcErr service.Error

		// When we import trades that belong to an existing open position in Arthveda.
		isUpdatingPositionAlreadyInArthveda := false

		isPositionAlreadyInArthvedaButHasUpdated, exists := existingOpenPositionsInArthvedaWasUpdatedByPositionID[finalizedPos.ID]
		if exists && isPositionAlreadyInArthvedaButHasUpdated {
			isUpdatingPositionAlreadyInArthveda = true
		}

		if isDuplicate && !isUpdatingPositionAlreadyInArthveda {
			existingPosition, svcErr, err := s.Get(ctx, payload.UserID, positionIDForTheDuplicateOrderID)
			if err != nil {
				return nil, svcErr, fmt.Errorf("failed to fetch existing position: %w", err)
			}

			finalizedPos.RiskAmount = payload.RiskAmount

			// We should copy some fields from the existing position to the new position.
			// This helps us keep the risk amount of the existing position.
			// Also the URL for the existing position will be the same as the new position.

			// If the existing position has a risk amount, we will use that.
			// If the payload has a risk amount, we will use that.
			if existingPosition.RiskAmount.IsPositive() && payload.RiskAmount.IsZero() {
				finalizedPos.RiskAmount = existingPosition.RiskAmount
			}

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

		// As we have updated the trades with charges, we need to recompute the position.
		computePayload := ComputePayload{
			RiskAmount: finalizedPos.RiskAmount,
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
	l.Debugf("Positions imported: %d", positionsImported)
	l.Debugf("Invalid positions: %d", len(invalidPositionsByPosID))
	l.Debugf("Unsupported positions: %d", unsupportedPositionsCount)

	allPositionsCount := len(finalizedPositions) + len(invalidPositions) + len(unsupportedPositions)

	result := &ImportResult{
		Positions:                 finalizedPositions,
		InvalidPositions:          invalidPositions,
		UnsupportedPositions:      unsupportedPositions,
		PositionsCount:            allPositionsCount,
		DuplicatePositionsCount:   duplicatePositionsCount,
		PositionsImportedCount:    positionsImported,
		InvalidPositionsCount:     len(invalidPositionsByPosID),
		ForcedPositionsCount:      forcedPositionCount,
		UnsupportedPositionsCount: unsupportedPositionsCount,
	}

	return result, service.ErrNone, nil
}

func (s *Service) Sync(ctx context.Context, importableTrades []*types.ImportableTrade, payload ImportPayload) (*ImportResult, service.Error, error) {
	l := logger.FromCtx(ctx)

	// Sanitize symbols in importable trades.
	for _, trade := range importableTrades {
		trade.Symbol = symbol.Sanitize(trade.Symbol, trade.Instrument)
	}

	// Fetch all open positions for this user broker account.
	open := StatusOpen
	searchPayload := SearchPayload{
		Filters: SearchFilter{
			UserBrokerAccountID: &payload.UserBrokerAccountID,
			Status:              &open,
		},
		Pagination: common.Pagination{Limit: 100},
	}

	existingOpenPositions, _, err := s.positionRepository.Search(ctx, searchPayload, true, false)
	if err != nil {
		l.Errorw("failed to fetch open positions for user broker account", "error", err, "user_broker_account_id", payload.UserBrokerAccountID)
		return nil, service.ErrInternalServerError, err
	}

	existingOpenPositionsByID := make(map[uuid.UUID]*Position)
	for _, pos := range existingOpenPositions {
		existingOpenPositionsByID[pos.ID] = pos
	}

	// Map open positions by symbol (from Arthveda)
	openPositions := make(map[string]*Position)
	for _, pos := range existingOpenPositions {
		openPositions[pos.Symbol] = pos
	}

	// Fetch all existing brokerTradeIDs for this user/broker
	brokerTradeIDs, err := s.tradeRepository.GetAllBrokerTradeIDs(ctx, &payload.UserID, &payload.Broker.ID)
	if err != nil {
		l.Errorw("failed to get all broker trade IDs", "error", err, "broker_id", payload.Broker.ID)
	}

	// Filter out trades whose brokerTradeID already exists
	filteredTrades := []*types.ImportableTrade{}
	for _, t := range importableTrades {
		if t.OrderID == "" {
			continue
		}
		if !common.ExistsInSet(brokerTradeIDs, t.OrderID) {
			filteredTrades = append(filteredTrades, t)
		}
	}

	// Map to store parsed rows by Order ID.
	parsedRowByOrderID := map[string]*types.ImportableTrade{}
	type aggregatedTrade struct {
		TradeKind  types.TradeKind
		Time       time.Time
		Quantity   decimal.Decimal
		TotalPrice decimal.Decimal
		Charges    decimal.Decimal
		Symbol     string
		Instrument types.Instrument
	}

	aggregatedTrades := make(map[string]aggregatedTrade)
	for _, filteredTrade := range filteredTrades {
		parsedRowByOrderID[filteredTrade.OrderID] = filteredTrade

		if existing, found := aggregatedTrades[filteredTrade.OrderID]; found {
			existing.Quantity = existing.Quantity.Add(filteredTrade.Quantity)
			existing.TotalPrice = existing.TotalPrice.Add(filteredTrade.Price.Mul(filteredTrade.Quantity))
			existing.Time = filteredTrade.Time
			aggregatedTrades[filteredTrade.OrderID] = existing
		} else {
			aggregatedTrades[filteredTrade.OrderID] = aggregatedTrade{
				TradeKind:  filteredTrade.TradeKind,
				Time:       filteredTrade.Time,
				Quantity:   filteredTrade.Quantity,
				TotalPrice: filteredTrade.Price.Mul(filteredTrade.Quantity),
				Charges:    decimal.NewFromInt(0),
				Symbol:     filteredTrade.Symbol,
				Instrument: filteredTrade.Instrument,
			}
		}
	}

	type TradeWithOrderID struct {
		OrderID    string
		Payload    trade.CreatePayload
		Symbol     string
		Instrument types.Instrument
	}

	tradesWithOrderIDs := []TradeWithOrderID{}
	for orderID, aggregatedTrade := range aggregatedTrades {
		averagePrice := aggregatedTrade.TotalPrice.Div(aggregatedTrade.Quantity)
		tradesWithOrderIDs = append(tradesWithOrderIDs, TradeWithOrderID{
			OrderID: orderID,
			Payload: trade.CreatePayload{
				Kind:          aggregatedTrade.TradeKind,
				Quantity:      aggregatedTrade.Quantity,
				Price:         averagePrice,
				Time:          aggregatedTrade.Time,
				ChargesAmount: aggregatedTrade.Charges,
			},
			Symbol:     aggregatedTrade.Symbol,
			Instrument: aggregatedTrade.Instrument,
		})
	}

	// Sort the trades by execution time
	sort.Slice(tradesWithOrderIDs, func(i, j int) bool {
		return tradesWithOrderIDs[i].Payload.Time.Before(tradesWithOrderIDs[j].Payload.Time)
	})

	finalizedPositions := []*Position{}
	invalidPositions := []*Position{}
	unsupportedPositions := []*Position{}
	openPositionsUpdatedOrCreated := make(map[uuid.UUID]bool)
	positionsImported := 0
	unsupportedPositionsCount := 0

	// For each trade, append to open position or create new one, similar to Import
	for _, t := range tradesWithOrderIDs {
		symbol := t.Symbol
		tradePayload := t.Payload

		newTrade, err := trade.New(tradePayload)
		if err != nil {
			l.Errorw("failed to create trade from payload", "error", err)
			continue
		}

		if openPos, exists := openPositions[symbol]; exists {
			// Mark this position as duplicate if it already existed in Arthveda
			// so that frontend can show appropriate UI.
			_, isExistingPos := existingOpenPositionsByID[openPos.ID]
			if isExistingPos {
				openPos.IsDuplicate = true
			}

			openPositionsUpdatedOrCreated[openPos.ID] = true
			newTrade.PositionID = openPos.ID
			newTrade.BrokerTradeID = &t.OrderID
			openPos.Trades = append(openPos.Trades, newTrade)

			// Compute and update position
			computePayload := ComputePayload{
				RiskAmount: openPos.RiskAmount,
				Trades:     ConvertTradesToCreatePayload(openPos.Trades),
			}

			computeResult, err := Compute(computePayload)
			if err != nil {
				l.Debugw("failed to compute position, marking as invalid", "error", err, "position_id", openPos.ID, "symbol", openPos.Symbol)
				invalidPositions = append(invalidPositions, openPos)
				delete(openPositions, symbol)
				continue
			}

			ApplyComputeResultToPosition(openPos, computeResult)

			// If position is closed, finalize and remove from open positions
			if computeResult.OpenQuantity.IsZero() {
				finalizedPositions = append(finalizedPositions, openPos)
				delete(openPositions, symbol)
			}
		} else {
			// Create new position
			createPayload := CreatePayload{
				ComputePayload: ComputePayload{
					Trades:     []trade.CreatePayload{tradePayload},
					RiskAmount: payload.RiskAmount,
				},
				Symbol:              t.Symbol,
				Instrument:          t.Instrument,
				Currency:            payload.Currency,
				UserBrokerAccountID: &payload.UserBrokerAccountID,
			}

			newPos, userErr, err := new(payload.UserID, createPayload)
			if err != nil {
				l.Errorw("failed to create new position", "error", err)
				if userErr {
					invalidPositions = append(invalidPositions, newPos)
				}
				continue
			}

			openPositionsUpdatedOrCreated[newPos.ID] = true

			newPos.BrokerID = &payload.Broker.ID
			if len(newPos.Trades) > 0 {
				newPos.Trades[0].BrokerTradeID = &t.OrderID
			}

			openPositions[symbol] = newPos
		}
	}

	// Add any remaining open positions to finalized positions.
	for _, openPos := range openPositions {
		if _, updatedOrCreated := openPositionsUpdatedOrCreated[openPos.ID]; updatedOrCreated {
			// Only finalize positions that were updated or created during this sync.
			finalizedPositions = append(finalizedPositions, openPos)
		}
	}

	for _, finalizedPos := range finalizedPositions {
		computePayload := ComputePayload{
			RiskAmount: finalizedPos.RiskAmount,
			Trades:     ConvertTradesToCreatePayload(finalizedPos.Trades),
		}

		computeResult, err := Compute(computePayload)
		if err != nil {
			l.Debugw("failed to compute position, marking as invalid", "error", err, "position_id", finalizedPos.ID, "symbol", finalizedPos.Symbol)
			invalidPositions = append(invalidPositions, finalizedPos)
			continue
		}

		ApplyComputeResultToPosition(finalizedPos, computeResult)

		switch payload.ChargesCalculationMethod {
		case ChargesCalculationMethodAuto:
			_, userErr, err := CalculateAndApplyChargesToTrades(finalizedPos.Trades, finalizedPos.Instrument, payload.Broker.Name)
			if err != nil {
				if userErr {
					invalidPositions = append(invalidPositions, finalizedPos)
					continue
				} else {
					l.Errorw("failed to auto-calculate charges", "error", err)
					invalidPositions = append(invalidPositions, finalizedPos)
					continue
				}
			}
		case ChargesCalculationMethodManual:
			for _, trade := range finalizedPos.Trades {
				trade.ChargesAmount = payload.ManualChargeAmount
			}
		}

		finalizedPos.TotalChargesAmount = calculateTotalChargesAmountFromTrades(finalizedPos.Trades)

		// Recompute after charges
		computePayload = ComputePayload{
			RiskAmount: finalizedPos.RiskAmount,
			Trades:     ConvertTradesToCreatePayload(finalizedPos.Trades),
		}

		computeResult, err = Compute(computePayload)
		if err != nil {
			l.Debugw("failed to compute position after charges, marking as invalid", "error", err, "position_id", finalizedPos.ID, "symbol", finalizedPos.Symbol)
			invalidPositions = append(invalidPositions, finalizedPos)
			continue
		}

		ApplyComputeResultToPosition(finalizedPos, computeResult)

		if !payload.Broker.IsInstrumentSupportedForImport(finalizedPos.Instrument) {
			unsupportedPositions = append(unsupportedPositions, finalizedPos)
			unsupportedPositionsCount++
			continue
		}

		_, isExistingPos := existingOpenPositionsByID[finalizedPos.ID]

		if isExistingPos {
			// Marking as duplicate so that frontend can show appropriate UI.
			finalizedPos.IsDuplicate = true

			svcErr, err := s.Delete(ctx, payload.UserID, finalizedPos.ID)
			if err != nil {
				return nil, svcErr, fmt.Errorf("failed to delete existing position: %w", err)
			}

			err = s.positionRepository.Create(ctx, finalizedPos)
			if err != nil {
				return nil, service.ErrInternalServerError, err
			}

			_, err = s.tradeRepository.CreateForPosition(ctx, finalizedPos.Trades)
			if err != nil {
				// Delete the position if trades creation fails.
				s.positionRepository.Delete(ctx, finalizedPos.ID)
				return nil, service.ErrInternalServerError, err
			}
		} else {
			err := s.positionRepository.Create(ctx, finalizedPos)
			if err != nil {
				l.Errorw("failed to create position", "error", err, "position_id", finalizedPos.ID)
				return nil, service.ErrInternalServerError, err
			}

			_, err = s.tradeRepository.CreateForPosition(ctx, finalizedPos.Trades)
			if err != nil {
				l.Errorw("failed to create trades for new position", "error", err, "position_id", finalizedPos.ID)
				s.positionRepository.Delete(ctx, finalizedPos.ID)
				return nil, service.ErrInternalServerError, err
			}
		}

		positionsImported++
	}

	sort.Slice(finalizedPositions, func(i, j int) bool {
		return finalizedPositions[i].OpenedAt.After(finalizedPositions[j].OpenedAt)
	})

	for _, position := range finalizedPositions {
		sort.Slice(position.Trades, func(i, j int) bool {
			return position.Trades[i].Time.Before(position.Trades[j].Time)
		})
	}

	result := &ImportResult{
		Positions:                 finalizedPositions,
		InvalidPositions:          invalidPositions,
		UnsupportedPositions:      unsupportedPositions,
		PositionsCount:            len(finalizedPositions) + len(invalidPositions) + len(unsupportedPositions),
		DuplicatePositionsCount:   0,
		PositionsImportedCount:    positionsImported,
		InvalidPositionsCount:     len(invalidPositions),
		ForcedPositionsCount:      0,
		UnsupportedPositionsCount: unsupportedPositionsCount,
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

	journalContent, err := s.journalEntryService.GetJournalContentForPosition(ctx, userID, position.ID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get journal entry for position ID %s: %w", position.ID, err)
	}

	if journalContent != nil {
		position.JournalContent = *journalContent
	}

	tags, err := s.tagRepository.GetTagsByPositionID(ctx, position.ID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to get tags for position ID %s: %w", position.ID, err)
	}

	position.Tags = tags

	return position, service.ErrNone, nil
}

type UpdatePayload struct {
	// We can just use the same payload as CreatePayload for updates.
	CreatePayload
	BrokerID *uuid.UUID `json:"broker_id"`
}

// FIXME: use transaction.

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

	// Update or create the journal entry for the position.
	journalEntry, err := s.journalEntryService.UpsertForPosition(ctx, userID, positionID, payload.JournalContent)
	if err != nil {
		l.Errorw("failed to upsert journal entry for position", "error", err, "position_id", originalPosition.ID)
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to upsert journal entry for position: %w", err)
	}

	err = s.syncUploads(ctx, userID, journalEntry.ID, payload.ActiveUploadIDs)
	if err != nil {
		l.Errorw("failed to sync uploads after creating a position", "error", err, "position_id", positionID)
		// Not returning an error here, just logging it.
	}

	// Save the updated position in the repository.
	err = s.positionRepository.Update(ctx, &updatedPosition)
	if err != nil {
		l.Errorw("failed to update position in repository", "error", err, "position_id", originalPosition.ID)
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to update position in repository: %w", err)
	}

	svcErr, err := s.tagService.AttachTagToPosition(ctx, tag.AttachTagToPositionPayload{
		PositionID: positionID,
		TagIDs:     payload.TagIDs,
	})

	if err != nil {
		l.Errorw("failed to attach tags to position after creating a position", "error", err, "position_id", positionID)
		return nil, svcErr, err
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

func (s *Service) syncUploads(ctx context.Context, userID, journalEntryID uuid.UUID, activeUploadIDs []uuid.UUID) error {
	err := s.uploadRepository.SyncJournalEntryUploads(ctx, userID, journalEntryID, activeUploadIDs)
	if err != nil {
		return fmt.Errorf("failed to sync uploads for journal entry: %w", err)
	}

	return nil
}
