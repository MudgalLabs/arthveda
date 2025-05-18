package position

import (
	"arthveda/internal/features/trade"
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

func (s *Service) Compute(ctx context.Context, payload ComputePayload) (computeResult, service.ErrKind, error) {
	result := computeResult{
		OpenedAt:  time.Now().UTC(),
		Status:    StatusOpen,
		Direction: DirectionLong,
	}

	if len(payload.Trades) == 0 {
		return result, service.ErrNone, nil
	}

	var closedAt *time.Time = nil
	var status Status
	var direction Direction
	var avgPrice decimal.Decimal
	grossPnL := decimal.NewFromFloat(0)
	totalCost := decimal.NewFromFloat(0)
	netQty := decimal.NewFromFloat(0)

	for i := range payload.Trades {
		trade := payload.Trades[i]
		tradeQty := trade.Quantity
		tradePrice := trade.Price

		var pnl decimal.Decimal

		avgPrice, netQty, direction, pnl, totalCost = applyTradeToPosition(avgPrice, netQty, totalCost, direction, tradeQty, tradePrice, trade.Kind)

		grossPnL = grossPnL.Add(pnl)

		if netQty.IsZero() {
			closedAt = &trade.Time
		}
	}

	var netPnL, rFactor, netReturnPercentage, chargesAsPercentageOfNetPnL decimal.Decimal

	// Position is closed.
	if netQty.IsZero() {
		netPnL = grossPnL.Sub(payload.ChargesAmount)

		if payload.RiskAmount.IsPositive() {
			rFactor = netPnL.Div(payload.RiskAmount).Round(2)
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

		// The position is still open but we have some realised gross pnl.
		if grossPnL.IsPositive() {
			netPnL = grossPnL
		}
	}

	if grossPnL.IsPositive() {
		chargesAsPercentageOfNetPnL = payload.ChargesAmount.Div(grossPnL).Mul(decimal.NewFromFloat(100)).Round(2)
	}

	if totalCost.IsPositive() {
		netReturnPercentage = netPnL.Div(totalCost).Mul(decimal.NewFromFloat(100)).Round(2)
	}

	result.Direction = direction
	result.Status = status
	result.OpenedAt = payload.Trades[0].Time
	result.ClosedAt = closedAt
	result.GrossPnLAmount = grossPnL.Round(2)
	result.NetPnLAmount = netPnL.Round(2)
	result.RFactor, _ = rFactor.Float64()
	result.NetReturnPercentage, _ = netReturnPercentage.Float64()
	result.ChargesAsPercentageOfNetPnL, _ = chargesAsPercentageOfNetPnL.Float64()

	if netQty.IsPositive() {
		result.OpenQuantity = netQty.Round(4)
		result.OpenAveragePriceAmount = avgPrice.Round(2)
	}

	return result, service.ErrNone, nil
}

type AddPayload struct {
	ComputePayload
	Symbol       string     `json:"symbol"`
	Instrument   Instrument `json:"instrument"`
	CurrencyCode string     `json:"currency_code"`
}

func (s *Service) Create(ctx context.Context, userID uuid.UUID, payload AddPayload) (*Position, service.ErrKind, error) {
	logger := logger.FromCtx(ctx)
	var err error

	computeResult, errKind, err := s.Compute(ctx, payload.ComputePayload)
	if err != nil {
		return nil, errKind, err
	}

	position, err := newPosition()
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	position.UserID = userID
	position.Symbol = payload.Symbol
	position.Instrument = payload.Instrument
	position.CurrencyCode = payload.CurrencyCode
	position.RiskAmount = payload.RiskAmount
	position.ChargesAmount = payload.ChargesAmount
	position.Direction = computeResult.Direction
	position.Status = computeResult.Status
	position.OpenedAt = computeResult.OpenedAt
	position.ClosedAt = computeResult.ClosedAt
	position.GrossPnLAmount = computeResult.GrossPnLAmount
	position.NetPnLAmount = computeResult.NetPnLAmount
	position.RFactor = computeResult.RFactor
	position.NetReturnPercentage = computeResult.NetReturnPercentage
	position.ChargesAsPercentageOfNetPnL = computeResult.ChargesAsPercentageOfNetPnL
	position.OpenQuantity = computeResult.OpenQuantity
	position.OpenAveragePriceAmount = computeResult.OpenAveragePriceAmount

	err = s.positionRepository.Create(ctx, position)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	trades, err := s.tradeRepository.Create(ctx, position.ID, payload.Trades)
	if err != nil {
		logger.Errorw("failed to create trades after creating a position, so deleting the position that was created", "error", err, "position_id", position.ID)
		s.positionRepository.Delete(ctx, position.ID)
		return nil, service.ErrInternalServerError, err
	}

	position.Trades = trades

	return position, service.ErrNone, nil
}

// Returns a list of Positions for the current user.
// User can filter this list.
// NOTE: We do
func (s *Service) List(ctx context.Context, userID uuid.UUID) ([]*Position, service.ErrKind, error) {
	f := filter{
		UserID: &userID,
	}

	positions, err := s.positionRepository.List(ctx, f)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("position service get: %w", err)
	}

	return positions, service.ErrNone, nil
}
