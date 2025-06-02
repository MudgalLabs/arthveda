package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/service"
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Service struct {
	dashboardRepository ReadWriter
	positionRepository  position.ReadWriter
	tradeRepository     trade.ReadWriter
}

func NewService(dashboardRepository ReadWriter, positionRepository position.ReadWriter, tradeRepository trade.ReadWriter) *Service {
	return &Service{
		dashboardRepository,
		positionRepository,
		tradeRepository,
	}
}

type getDashboardReponse struct {
	GrossPnL          decimal.Decimal       `json:"gross_pnl"`
	NetPnL            decimal.Decimal       `json:"net_pnl"`
	WinRatePercentage float64               `json:"win_rate_percentage"`
	CumulativePnL     []CumulativePnLBucket `json:"cumulative_pnl"`
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID) (*getDashboardReponse, service.Error, error) {
	generalStats, err := s.dashboardRepository.GetGeneralStats(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	searchPositionPayload := position.SearchPayload{
		Filters: position.SearchFilter{
			CreatedBy: &userID,
		},
		Sort: common.Sorting{
			Field: "opened_at",
			Order: common.SortOrderASC,
		},
	}

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	for _, position := range positions {
		trades, err := s.tradeRepository.FindByPositionID(ctx, position.ID)
		if err != nil {
			return nil, service.ErrInternalServerError, err
		}
		position.Trades = trades
	}

	// Find the earliest and latest trade times
	var start, end time.Time
	for _, position := range positions {
		for _, trade := range position.Trades {
			if start.IsZero() || trade.Time.Before(start) {
				start = trade.Time
			}
			if end.IsZero() || trade.Time.After(end) {
				end = trade.Time
			}
		}
	}

	// Extend the end time to include the full bucket
	end = end.AddDate(0, 0, 1)

	cumulativePnL := generateCumulativePnLBuckets(positions, common.BucketPeriodMonthly, start, end)

	result := &getDashboardReponse{
		GrossPnL:          generalStats.GrossPnL,
		NetPnL:            generalStats.NetPnL,
		WinRatePercentage: generalStats.WinRatePercentage,
		CumulativePnL:     cumulativePnL,
	}

	return result, service.ErrNone, nil
}
