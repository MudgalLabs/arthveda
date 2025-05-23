package dashboard

import (
	"arthveda/internal/feature/position"
	"arthveda/internal/service"
	"context"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Service struct {
	dashboardRepository ReadWriter
	positionRepository  position.ReadWriter
}

func NewService(dashboardRepository ReadWriter, positionRepository position.ReadWriter) *Service {
	return &Service{
		dashboardRepository,
		positionRepository,
	}
}

type getDashboardReponse struct {
	GrossPnL          decimal.Decimal `json:"gross_pnl"`
	NetPnL            decimal.Decimal `json:"net_pnl"`
	WinRatePercentage float64         `json:"win_rate_percentage"`
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID) (*getDashboardReponse, service.Error, error) {
	result, err := s.dashboardRepository.Get(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}
	return result, service.ErrNone, nil
}
