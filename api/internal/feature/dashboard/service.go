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
	Positions            []*position.Position `json:"positions"`
	PositionsCount       int                  `json:"positions_count"`
	CumulativePnLBuckets []pnlBucket          `json:"cumulative_pnl_buckets"`
	PnLBuckets           []pnlBucket          `json:"pnl_buckets"`
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

	// If start or end is still zero, calculate from positions
	// if start.IsZero() || end.IsZero() {
	// 	for _, position := range positions {
	// 		for _, trade := range position.Trades {
	// 			if start.IsZero() && (end.IsZero() || trade.Time.Before(start)) {
	// 				start = trade.Time
	// 			}
	// 			if end.IsZero() && (start.IsZero() || trade.Time.After(end)) {
	// 				end = trade.Time
	// 			}
	// 			// If only one is zero, update only that one
	// 			if !start.IsZero() && trade.Time.Before(start) && payload.DateRange != nil && payload.DateRange.From == nil {
	// 				start = trade.Time
	// 			}
	// 			if !end.IsZero() && trade.Time.After(end) && payload.DateRange != nil && payload.DateRange.To == nil {
	// 				end = trade.Time
	// 			}
	// 		}
	// 	}
	// }

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
	case dateRange.Hours() <= 24*30:
		bucketPeriod = common.BucketPeriodDaily
	case dateRange.Hours() <= 24*90:
		bucketPeriod = common.BucketPeriodWeekly
	default:
		bucketPeriod = common.BucketPeriodMonthly
	}

	generalStats := getGeneralStats(positions)
	pnlBuckets := getPnLBuckets(positions, bucketPeriod, start, end, loc)
	cumulativePnLBuckets := getCumulativePnLBuckets(positions, bucketPeriod, start, end, loc)

	result := &GetDashboardReponse{
		generalStats:         generalStats,
		Positions:            positions,
		PositionsCount:       len(positions),
		CumulativePnLBuckets: cumulativePnLBuckets,
		PnLBuckets:           pnlBuckets,
	}

	return result, service.ErrNone, nil
}
