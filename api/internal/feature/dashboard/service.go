package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
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

func (s *Service) Get(ctx context.Context, userID uuid.UUID, loc *time.Location, payload GetDashboardPayload) (*GetDashboardReponse, service.Error, error) {
	from := time.Time{}
	to := time.Time{}

	if payload.DateRange.From != nil {
		from = *payload.DateRange.From
	}

	if payload.DateRange.To != nil {
		to = *payload.DateRange.To
	}

	startUTC, endUTC, err := common.NormalizeDateRangeFromTimezone(from, to, loc)

	if err != nil {
		payload.DateRange.From = &startUTC
		payload.DateRange.To = &endUTC
	}

	searchPositionPayload := position.SearchPayload{
		Filters: position.SearchFilter{
			CreatedBy: &userID,
			// Opened:    payload.DateRange,
			TradeTime: payload.DateRange,
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

	// When we are calculating the dashboard, we want to include the entire day of the last trade. Otherwise we will end up skipping the last day's trades.
	// Extend end to include the entire day of the last trade
	end = end.Add(24 * time.Hour)

	// If we are provided with a date range, we should use that instead of the earliest and latest trade times.
	if !startUTC.IsZero() {
		start = startUTC
	}
	if !endUTC.IsZero() {
		end = endUTC
	}

	// Dynamically select bucket period based on date range
	var bucketPeriod common.BucketPeriod
	dateRange := end.Sub(start)
	switch {
	case dateRange.Hours() <= 24*31:
		bucketPeriod = common.BucketPeriodDaily
	case dateRange.Hours() <= 24*90:
		bucketPeriod = common.BucketPeriodWeekly
	default:
		bucketPeriod = common.BucketPeriodMonthly
	}

	positionsFiltered := filterPositionsWithRealisingTradesUpTo(positions, end, loc)

	for _, pos := range positionsFiltered {
		_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction)
		if err != nil {
			logger.Get().Warnw("failed to compute smart trades for position", "position_id", pos.ID, "error", err)
			continue
		}
	}

	generalStats := getGeneralStats(positionsFiltered)
	pnlBuckets := getPnLBuckets(positionsFiltered, bucketPeriod, start, end, loc)
	cumulativePnLBuckets := getCumulativePnLBuckets(positionsFiltered, bucketPeriod, start, end, loc)

	result := &GetDashboardReponse{
		PositionsCount:       len(positionsFiltered),
		generalStats:         generalStats,
		CumulativePnLBuckets: cumulativePnLBuckets,
		PnLBuckets:           pnlBuckets,
	}

	return result, service.ErrNone, nil
}
