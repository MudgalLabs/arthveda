package calendar

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"context"
	"sort"
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
	GrossPnL       decimal.Decimal `json:"gross_pnl"`
	PnL            decimal.Decimal `json:"pnl"`
	Charges        decimal.Decimal `json:"charges"`
	PositionsCount int             `json:"positions_count"`
	PositionIDs    []uuid.UUID     `json:"position_ids"`
}

type calendarWeekly struct {
	PnL            decimal.Decimal `json:"pnl"`
	PositionsCount int             `json:"positions_count"`
	WeekNumber     int             `json:"week_number"`
}

type calendarMonthly struct {
	Year           int                    `json:"year"`
	Month          time.Month             `json:"month"`
	PnL            decimal.Decimal        `json:"pnl"`
	PositionsCount int                    `json:"positions_count"`
	Daily          map[int]calendarDaily  `json:"daily"`
	Weekly         map[int]calendarWeekly `json:"weekly"` // week number -> weekly stats
}

type calendarYearly struct {
	PnL            decimal.Decimal            `json:"pnl"`
	PositionsCount int                        `json:"positions_count"`
	Monthly        map[string]calendarMonthly `json:"monthly"` // key is month (e.g., "September")
}

type GetCalendarAllResult map[int]calendarYearly // key is year (e.g., 2025)

func (s *Service) GetAll(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetCalendarAllResult, service.Error, error) {
	l := logger.Get()
	result := GetCalendarAllResult{}
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
				Weekly:         make(map[int]calendarWeekly),
			}
		}

		// Get or create daily entry
		dailyEntry, exists := monthlyEntry.Daily[day]
		if !exists {
			dailyEntry = calendarDaily{
				GrossPnL:       decimal.Zero,
				PnL:            decimal.Zero,
				Charges:        decimal.Zero,
				PositionsCount: 0,
				PositionIDs:    []uuid.UUID{},
			}
		}

		// Add bucket PnL to daily/monthly/yearly
		dailyEntry.GrossPnL = dailyEntry.GrossPnL.Add(bucket.GrossPnL)
		dailyEntry.PnL = dailyEntry.PnL.Add(bucket.NetPnL)
		dailyEntry.Charges = dailyEntry.Charges.Add(bucket.Charges)

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

			// Calculate weekly stats (week-of-month: 1-based index, week starts on Sunday, ends on Saturday).
			weeklyStats := make(map[int]calendarWeekly)
			weekPositions := make(map[int]map[uuid.UUID]struct{})
			var daysInMonth []int
			for day := range monthlyEntry.Daily {
				daysInMonth = append(daysInMonth, day)
			}
			sort.Ints(daysInMonth)

			weekOfMonthByDay := make(map[int]int)
			weekIdx := 1
			for _, day := range daysInMonth {
				date := time.Date(monthlyEntry.Year, monthlyEntry.Month, day, 0, 0, 0, 0, tz)
				if day == 1 {
					weekIdx = 1
				}
				if date.Weekday() == time.Sunday && day != 1 {
					weekIdx++
				}
				weekOfMonthByDay[day] = weekIdx
			}

			// Aggregate stats by week-of-month.
			for _, day := range daysInMonth {
				week := weekOfMonthByDay[day]
				dailyEntry := monthlyEntry.Daily[day]
				if _, ok := weeklyStats[week]; !ok {
					weeklyStats[week] = calendarWeekly{
						PnL:            decimal.Zero,
						PositionsCount: 0,
						WeekNumber:     week,
					}
					weekPositions[week] = make(map[uuid.UUID]struct{})
				}
				weekly := weeklyStats[week]
				weekly.PnL = weekly.PnL.Add(dailyEntry.PnL)
				for posID := range positionIDsByDay[year][monthStr][day] {
					weekPositions[week][posID] = struct{}{}
				}
				weeklyStats[week] = weekly
			}

			// Set positions count for each week based on unique position IDs
			for week, weekly := range weeklyStats {
				weekly.PositionsCount = len(weekPositions[week])
				monthlyEntry.Weekly[week] = weekly
			}

			for day, dailyEntry := range monthlyEntry.Daily {
				positionIDs := make([]uuid.UUID, 0, len(positionIDsByDay[year][monthStr][day]))
				for posID := range positionIDsByDay[year][monthStr][day] {
					positionIDs = append(positionIDs, posID)
				}

				dailyEntry.PositionIDs = positionIDs
				dailyEntry.PositionsCount = len(positionIDsByDay[year][monthStr][day])
				monthlyEntry.Daily[day] = dailyEntry
			}

			yearlyEntry.Monthly[monthStr] = monthlyEntry
		}

		result[year] = yearlyEntry
	}

	return &result, service.ErrNone, nil
}

type GetCalendarDayResult struct {
	Date     time.Time       `json:"date"`
	GrossPnL decimal.Decimal `json:"gross_pnl"`
	NetPnL   decimal.Decimal `json:"net_pnl"`
	Charges  decimal.Decimal `json:"charges"`

	Positions []*position.Position `json:"positions"`
}

func (s *Service) GetDay(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer, date time.Time) (*GetCalendarDayResult, service.Error, error) {
	l := logger.Get()

	dateInTZ := date.In(tz)
	result := GetCalendarDayResult{
		Date:     dateInTZ,
		GrossPnL: decimal.Zero,
		NetPnL:   decimal.Zero,
		Charges:  decimal.Zero,

		Positions: []*position.Position{},
	}

	from, to, err := common.NormalizeDateRangeFromTimezone(date, date, tz)
	if err != nil {
		l.Errorw("failed to normalize date range from timezone", "user_id", userID, "date", dateInTZ, "error", err)
		return nil, service.ErrInternalServerError, err
	}

	tradeTimeRange := &common.DateRangeFilter{
		From: &from,
		To:   &to,
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
		l.Errorw("failed to search positions for calendar day", "user_id", userID, "date", dateInTZ, "error", err)
		return nil, service.ErrInternalServerError, err
	}

	positionsWithRealizedTrades := position.FilterPositionsWithRealisingTradesUpTo(positions, to, tz)
	filteredPositions := []*position.Position{}

	for _, pos := range positionsWithRealizedTrades {
		_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction)
		if err != nil {
			l.Errorw("failed to compute smart trades for position", "position_id", pos.ID, "error", err)
			continue
		}

		realisedStatsByTradeID := position.GetRealisedStatsUptoATradeByTradeID([]*position.Position{pos})

		filteredTrades := []*trade.Trade{}
		var grossPnL, charges, roi decimal.Decimal

		prevCharges := decimal.Zero

		for _, trade := range pos.Trades {
			stat := realisedStatsByTradeID[trade.ID]

			if len(trade.MatchedLots) > 0 {
				if common.IsSameDay(trade.Time, date, tz) {
					grossPnL = grossPnL.Add(trade.RealisedGrossPnL)
					roi = roi.Add(trade.ROI)

					incrementalCharges := stat.ChargesAmount.Sub(prevCharges)
					prevCharges = stat.ChargesAmount

					charges = charges.Add(incrementalCharges)

					trade.ChargesAmount = incrementalCharges
					filteredTrades = append(filteredTrades, trade)
				} else if trade.Time.In(tz).Before(date.In(tz)) {
					prevCharges = stat.ChargesAmount
				}
			}
		}

		if len(filteredTrades) > 0 {
			pos.Trades = filteredTrades
			filteredPositions = append(filteredPositions, pos)

			result.GrossPnL = result.GrossPnL.Add(grossPnL)
			result.Charges = result.Charges.Add(charges)
			result.NetPnL = result.NetPnL.Add(grossPnL.Sub(charges))
		}
	}

	sort.SliceStable(filteredPositions, func(i, j int) bool {
		return filteredPositions[i].Symbol < filteredPositions[j].Symbol
	})

	result.Positions = filteredPositions

	return &result, service.ErrNone, nil
}
