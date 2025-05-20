package position

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/currency"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
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
