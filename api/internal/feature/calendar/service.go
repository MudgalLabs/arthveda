package calendar

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
	"arthveda/internal/logger"
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/mudgallabs/tantra/service"
	"github.com/shopspring/decimal"
)

type Service struct {
	positionRepository position.ReadWriter
}

func NewService(positionRepository position.ReadWriter) *Service {
	return &Service{
		positionRepository,
	}
}

type calendarDaily struct {
	PnL            decimal.Decimal `json:"pnl"`
	PositionsCount int             `json:"positions_count"`
}

type calendarMonthly struct {
	Year           int                   `json:"year"`
	Month          time.Month            `json:"month"`
	PnL            decimal.Decimal       `json:"pnl"`
	PositionsCount int                   `json:"positions_count"`
	Daily          map[int]calendarDaily `json:"daily"`
}

// type calendarYearly = map[string]calendarMonthly // key is month (e.g., "September")
type calendarYearly struct {
	PnL            decimal.Decimal            `json:"pnl"`
	PositionsCount int                        `json:"positions_count"`
	Monthly        map[string]calendarMonthly `json:"monthly"` // key is month (e.g., "September")
}

type GetCalendarResult map[int]calendarYearly // key is year (e.g., 2025)

func (s *Service) Get(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetCalendarResult, service.Error, error) {
	l := logger.Get()
	result := GetCalendarResult{}
	yearAgo := time.Now().In(tz).AddDate(-1, 0, 0)
	tradeTimeRange := &common.DateRangeFilter{}

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

	rangeStart, rangeEnd := position.GetRangeBasedOnTrades(positions)
	positionsFiltered := position.FilterPositionsWithRealisingTradesUpTo(positions, rangeEnd, tz)

	for _, pos := range positionsFiltered {
		_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction)
		if err != nil {
			l.Errorw("failed to compute smart trades for position", "position_id", pos.ID, "error", err)
			continue
		}
	}

	// Maps to track unique position IDs for each day, month, and year.
	positionIDsByYear := make(map[int]map[uuid.UUID]struct{})
	positionIDsByMonth := make(map[int]map[string]map[uuid.UUID]struct{})
	positionIDsByDay := make(map[int]map[string]map[int]map[uuid.UUID]struct{})

	// Use position.GetPnLBuckets to get daily buckets for the calendar.
	buckets := position.GetPnLBuckets(positionsFiltered, common.BucketPeriodDaily, rangeStart, rangeEnd, tz)

	// Build the calendar result from buckets
	for _, bucket := range buckets {
		year, month, day := bucket.Start.In(tz).Date()
		monthStr := month.String()

		// Initialize maps if not present
		if _, ok := positionIDsByYear[year]; !ok {
			positionIDsByYear[year] = make(map[uuid.UUID]struct{})
		}
		if _, ok := positionIDsByMonth[year]; !ok {
			positionIDsByMonth[year] = make(map[string]map[uuid.UUID]struct{})
		}
		if _, ok := positionIDsByMonth[year][monthStr]; !ok {
			positionIDsByMonth[year][monthStr] = make(map[uuid.UUID]struct{})
		}
		if _, ok := positionIDsByDay[year]; !ok {
			positionIDsByDay[year] = make(map[string]map[int]map[uuid.UUID]struct{})
		}
		if _, ok := positionIDsByDay[year][monthStr]; !ok {
			positionIDsByDay[year][monthStr] = make(map[int]map[uuid.UUID]struct{})
		}
		if _, ok := positionIDsByDay[year][monthStr][day]; !ok {
			positionIDsByDay[year][monthStr][day] = make(map[uuid.UUID]struct{})
		}

		// Track unique position IDs for this bucket
		for _, pos := range bucket.Positions {
			positionIDsByYear[year][pos.ID] = struct{}{}
			positionIDsByMonth[year][monthStr][pos.ID] = struct{}{}
			positionIDsByDay[year][monthStr][day][pos.ID] = struct{}{}
		}

		// Get or create yearly entry
		yearlyEntry, exists := result[year]
		if !exists {
			yearlyEntry = calendarYearly{
				PnL:            decimal.Zero,
				PositionsCount: 0,
				Monthly:        make(map[string]calendarMonthly),
			}
		}

		// Get or create monthly entry
		monthlyEntry, exists := yearlyEntry.Monthly[monthStr]
		if !exists {
			monthlyEntry = calendarMonthly{
				Year:           year,
				Month:          month,
				PnL:            decimal.Zero,
				PositionsCount: 0,
				Daily:          make(map[int]calendarDaily),
			}
		}

		// Get or create daily entry
		dailyEntry, exists := monthlyEntry.Daily[day]
		if !exists {
			dailyEntry = calendarDaily{
				PnL:            decimal.Zero,
				PositionsCount: 0,
			}
		}

		// Add bucket PnL to daily/monthly/yearly
		dailyEntry.PnL = dailyEntry.PnL.Add(bucket.NetPnL)
		monthlyEntry.PnL = monthlyEntry.PnL.Add(bucket.NetPnL)
		yearlyEntry.PnL = yearlyEntry.PnL.Add(bucket.NetPnL)

		monthlyEntry.Daily[day] = dailyEntry
		yearlyEntry.Monthly[monthStr] = monthlyEntry
		result[year] = yearlyEntry
	}

	// After all buckets processed, set PositionsCount using the unique position ID maps
	for year, yearlyEntry := range result {
		yearlyEntry.PositionsCount = len(positionIDsByYear[year])

		for monthStr, monthlyEntry := range yearlyEntry.Monthly {
			monthlyEntry.PositionsCount = len(positionIDsByMonth[year][monthStr])

			for day, dailyEntry := range monthlyEntry.Daily {
				dailyEntry.PositionsCount = len(positionIDsByDay[year][monthStr][day])
				monthlyEntry.Daily[day] = dailyEntry
			}

			yearlyEntry.Monthly[monthStr] = monthlyEntry
		}

		result[year] = yearlyEntry
	}

	return &result, service.ErrNone, nil
}
