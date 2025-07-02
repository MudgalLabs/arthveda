package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/service"
	"context"
	"time"

	"github.com/google/uuid"
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
	PositionsCount       int         `json:"positions_count"`
	CumulativePnLBuckets []pnlBucket `json:"cumulative_pnl_buckets"`
	PnLBuckets           []pnlBucket `json:"pnl_buckets"`
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

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload, true)
	if err != nil {
		return nil, service.ErrInternalServerError, err
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

	generalStats := getGeneralStats(positions)
	cumulativePnLBuckets := getCumulativePnLBuckets(positions, common.BucketPeriodMonthly, start, end)
	pnlBuckets := getPnLBuckets(positions, common.BucketPeriodMonthly, start, end)

	result := &GetDashboardReponse{
		generalStats:         generalStats,
		PositionsCount:       len(positions),
		CumulativePnLBuckets: cumulativePnLBuckets,
		PnLBuckets:           pnlBuckets,
	}

	return result, service.ErrNone, nil
}
