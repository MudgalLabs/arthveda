// Package dashboard provides the service for managing and retrieving dashboard data.
package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"context"
	"fmt"
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

type GetDashboardResult struct {
	generalStats
	PositionsCount       int                  `json:"positions_count"`
	CumulativePnLBuckets []position.PnlBucket `json:"cumulative_pnl_buckets"`
	PnLBuckets           []position.PnlBucket `json:"pnl_buckets"`
	NoOfPositionsHidden  int                  `json:"no_of_positions_hidden"`
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer, payload GetDashboardPayload) (*GetDashboardResult, service.Error, error) {
	l := logger.Get()
	now := time.Now().UTC()
	yearAgo := time.Now().In(tz).AddDate(-1, 0, 0)
	from := time.Time{}
	to := time.Time{}

	if payload.DateRange.From != nil && !payload.DateRange.From.IsZero() {
		from = *payload.DateRange.From
	}

	if payload.DateRange.To != nil && !payload.DateRange.To.IsZero() {
		to = *payload.DateRange.To
	}

	startUTC, endUTC, err := common.NormalizeDateRangeFromTimezone(from, to, tz)

	if err == nil {
		payload.DateRange.From = &startUTC
		payload.DateRange.To = &endUTC
	}

	tradeTimeRange := &common.DateRangeFilter{
		// Defualt to current time.
		To: &now,
	}

	if !startUTC.IsZero() {
		tradeTimeRange.From = &startUTC
	}
	if !endUTC.IsZero() {
		tradeTimeRange.To = &endUTC
	}

	// If the user is not a Pro user, we limit the time range to the last 12 months.
	if !enforcer.CanAccessAllPositions() {
		tradeTimeRange.From = &yearAgo
	}

	searchPositionPayload := position.SearchPayload{
		Filters: position.SearchFilter{
			CreatedBy: &userID,
			TradeTime: tradeTimeRange,
		},
		Sort: common.Sorting{
			Field: "opened_at",
			Order: common.SortOrderASC,
		},
	}

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload, true, false)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	// Find the earliest and latest trade times.
	rangeStart, rangeEnd := position.GetRangeBasedOnTrades(positions)

	// If we are provided with a date range, we should use that instead of the earliest and latest trade times.
	if !startUTC.IsZero() {
		rangeStart = startUTC
	}
	if !endUTC.IsZero() {
		rangeEnd = endUTC
	}

	positionsExistOlderThanTwelveMonths, err := s.positionRepository.NoOfPositionsOlderThanTwelveMonths(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("UserHasPositionsOlderThanTwelveMonths: %w", err)
	}

	var noOfPositionsHidden int
	if rangeStart.Before(yearAgo) && !enforcer.CanAccessAllPositions() {
		rangeStart = yearAgo // Otherwise empty buckets will be returned for months before twelve months ago.
		noOfPositionsHidden = positionsExistOlderThanTwelveMonths
	}

	// Dynamically select bucket period based on date range
	var bucketPeriod common.BucketPeriod
	dateRange := rangeEnd.Sub(rangeStart)
	switch {
	case dateRange.Hours() <= 24*31:
		bucketPeriod = common.BucketPeriodDaily
	case dateRange.Hours() <= 24*90:
		bucketPeriod = common.BucketPeriodWeekly
	default:
		bucketPeriod = common.BucketPeriodMonthly
	}

	positionsFiltered := position.FilterPositionsWithRealisingTradesUpTo(positions, rangeEnd, tz)

	for _, pos := range positionsFiltered {
		_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction)
		if err != nil {
			l.Errorw("failed to compute smart trades for position", "position_id", pos.ID, "error", err)
			continue
		}
	}

	generalStats := getGeneralStats(positionsFiltered)
	pnlBuckets := position.GetPnLBuckets(positionsFiltered, bucketPeriod, rangeStart, rangeEnd, tz)
	cumulativePnLBuckets := position.GetCumulativePnLBuckets(positionsFiltered, bucketPeriod, rangeStart, rangeEnd, tz)

	result := &GetDashboardResult{
		PositionsCount:       len(positionsFiltered),
		generalStats:         generalStats,
		CumulativePnLBuckets: cumulativePnLBuckets,
		PnLBuckets:           pnlBuckets,
		NoOfPositionsHidden:  noOfPositionsHidden,
	}

	return result, service.ErrNone, nil
}
