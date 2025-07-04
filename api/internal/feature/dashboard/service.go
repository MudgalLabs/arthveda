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

	originalPosByID := map[uuid.UUID]*position.Position{}

	// These are the trades that we will use to compute the stats.
	// We will only consider trades that are before or equal to the end date.
	// We will also create a copy of the positions so that we don't modify the original positions
	// and their trades. This is important because we will be calling "Compute" on the positions
	// to calculate the realised PnL and other stats, and we don't want to modify the original positions.
	positionsWithTradesUptoEnd := []*position.Position{}

	// We need to compute the Position stats based on the trades that fall within the date range.
	// So we will go through all positions and their trades,
	// and call "Compute" up until we don't reach a trade that's time is after the end date.
	// If we reach a trade that is after the end date, we will stop processing the position.

	for _, p := range positions {
		originalPosByID[p.ID] = p
		positionCopy := *p
		trades := []*trade.Trade{}

		atLeastOneTradeWasScalingOut := false

		// Apply trades to the position to calculate realised PnL.
		// This will also update the position's GrossPnLAmount, NetPnLAmount
		// and TotalChargesAmount fields.
		for _, t := range p.Trades {
			if t.Time.In(loc).Before(end) || t.Time.In(loc).Equal(end) {
				trades = append(trades, t)

				// If position is long and we have a sell trade,
				// or if position is short and we have a buy trade,
				// we know that this is a scaling out trade.
				// This flag helps us to include positions for calculating stats
				// that have tried to realise PnL by scaling out. Otherwise, we might have
				// wrong stats for positions that were just scaling in during the time range.
				if (positionCopy.Direction == position.DirectionLong && t.Kind == trade.TradeKindSell) ||
					(positionCopy.Direction == position.DirectionShort && t.Kind == trade.TradeKindBuy) {
					atLeastOneTradeWasScalingOut = true
				}
			}
		}

		positionCopy.Trades = trades

		if atLeastOneTradeWasScalingOut {
			positionsWithTradesUptoEnd = append(positionsWithTradesUptoEnd, &positionCopy)
		}
	}

	// Let's call "Compute" on positionsWithTradesUptoEnd
	// to calculate the realised PnL and other stats.

	for i, p := range positionsWithTradesUptoEnd {
		payload := position.ComputePayload{
			Trades:     position.ConvertTradesToCreatePayload(p.Trades),
			RiskAmount: p.RiskAmount,
		}

		computeResult, err := position.Compute(payload)
		if err != nil {
			// If we fail silently and continue.
			logger.Get().Errorw("Failed to compute position", "error", err, "symbol", p.Symbol, "opened_at", p.OpenedAt)
			continue
		}

		position.ApplyComputeResultToPosition(p, computeResult)
		positionsWithTradesUptoEnd[i] = p
	}

	generalStats := getGeneralStats(positions, end, loc)
	pnlBuckets := getPnLBuckets(positionsWithTradesUptoEnd, bucketPeriod, start, end, loc)
	cumulativePnLBuckets := getCumulativePnLBuckets(positionsWithTradesUptoEnd, bucketPeriod, start, end, loc)

	result := &GetDashboardReponse{
		generalStats:         generalStats,
		Positions:            positions,
		PositionsCount:       len(positions),
		CumulativePnLBuckets: cumulativePnLBuckets,
		PnLBuckets:           pnlBuckets,
	}

	return result, service.ErrNone, nil
}
