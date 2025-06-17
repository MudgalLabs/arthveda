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

type GetDashboardPayload struct {
	DateRange *common.DateRangeFilter `json:"date_range"`
}

type GetDashboardReponse struct {
	generalStats
	CumulativePnL  []CumulativePnLBucket `json:"cumulative_pnl"`
	PositionsCount int                   `json:"positions_count"`
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID, payload GetDashboardPayload) (*GetDashboardReponse, service.Error, error) {
	searchPositionPayload := position.SearchPayload{
		Filters: position.SearchFilter{
			CreatedBy: &userID,
			Opened:    payload.DateRange,
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

	cumulativePnL := getCumulativePnL(positions, common.BucketPeriodMonthly, start, end)

	stats, err := s.dashboardRepository.GetGeneralStats(ctx, userID, payload, positions)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	result := &GetDashboardReponse{
		generalStats:   *stats,
		CumulativePnL:  cumulativePnL,
		PositionsCount: len(positions),
	}

	return result, service.ErrNone, nil
}

type DailyNetPnL struct {
	Date   time.Time       `json:"start"`
	Label  string          `json:"label"`
	NetPnL decimal.Decimal `json:"net_pnl"`
}

func (s *Service) GetDailyNetPnL(ctx context.Context, userID uuid.UUID) ([]*DailyNetPnL, service.Error, error) {
	return nil, service.ErrNone, nil
}
