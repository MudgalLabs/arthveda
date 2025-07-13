package position

import (
	"arthveda/internal/common"
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

type ImportPayload struct {
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

func (s *Service) Import(ctx context.Context, userID uuid.UUID, payload ImportPayload) (*ImportResult, service.Error, error) {
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

	importer, err := getImporer(broker)
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

	metadata, err := importer.getMetadata(rows)
	if err != nil {
		l.Infow("Failed to get metadata from importer", "error", err, "broker", broker)
		return nil, service.ErrBadRequest, errImportFileInvalid
	}

	headerRowIdx := metadata.headerRowIdx

	importableTrades := []*ImportableTrade{}

	// Replace the map with a slice and populate it
	for rowIdx, row := range rows[headerRowIdx+1:] {
		l.Debugf("Processing row %d: %v\n", rowIdx+headerRowIdx+1, row)

		if len(row) == 0 {
			l.Debugf("Found an empty row. We will stop processing further rows assuming we have reached the end.")
			break
		}

		parseRowResult, err := importer.parseRow(row, metadata)
		if err != nil {
			return nil, service.ErrBadRequest, fmt.Errorf("failed to parse row %d: %w", rowIdx+headerRowIdx+1, err)
		}

		importableTrades = append(importableTrades, parseRowResult)
	}

	options := tradeImporterOptions{
		positionService:          s,
		userID:                   userID,
		userBrokerAccountID:      payload.UserBrokerAccountID,
		broker:                   broker,
		riskAmount:               payload.RiskAmount,
		currency:                 payload.Currency,
		chargesCalculationMethod: payload.ChargesCalculationMethod,
		manualChargeAmount:       payload.ManualChargeAmount,
		instrument:               payload.Instrument,
		confirm:                  payload.Confirm,
		force:                    payload.Force,
	}
	tradeImporter := NewTradeImporter(options)
	return tradeImporter.Import(ctx, importableTrades)
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
