package calendar

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/position"
	"arthveda/internal/logger"
	"context"
	"fmt"
	"slices"
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

// calendarMonthlyKey is used to create a unique key for each month in the format "September_2025"
type calendarMonthlyKey string

func createCalendarMonthlyKey(year int, month time.Month) calendarMonthlyKey {
	return calendarMonthlyKey(fmt.Sprintf("%s_%d", month.String(), year))
}

type calendarDailyData struct {
	PnL            decimal.Decimal `json:"pnl"`
	PositionsCount int             `json:"positions_count"`
}

type calendarMonthlyData struct {
	Year           int                       `json:"year"`
	Month          time.Month                `json:"month"`
	PnL            decimal.Decimal           `json:"pnl"`
	PositionsCount int                       `json:"positions_count"`
	DailyData      map[int]calendarDailyData `json:"daily"`
}

type GetCalendarResult struct {
	MonthlyData map[calendarMonthlyKey]calendarMonthlyData `json:"monthly"`
}

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

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload, true)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	_, rangeEnd := position.GetRangeBasedOnTrades(positions)

	positionsFiltered := position.FilterPositionsWithRealisingTradesUpTo(positions, rangeEnd, tz)

	for _, pos := range positionsFiltered {
		_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction)
		if err != nil {
			l.Errorw("failed to compute smart trades for position", "position_id", pos.ID, "error", err)
			continue
		}
	}

	realisedStatsByTradeID := position.GetRealisedStatsUptoATradeByTradeID(positions)

	monthlyData := make(map[calendarMonthlyKey]calendarMonthlyData)
	positionsFoundOnDate := make(map[string][]uuid.UUID) // date string (DDMMYYYY) to list of position IDs

	for _, position := range positions {
		for _, trade := range position.Trades {
			stats, exists := realisedStatsByTradeID[trade.ID]
			if !exists {
				l.Warnw("realised stats not found for trade", "trade_id", trade.ID)
				continue
			}

			if stats.IsScaleOut {
				year, month, day := trade.Time.Date()
				monthKey := createCalendarMonthlyKey(year, month)
				positionFoundKey := fmt.Sprintf("%02d%02d%d", day, month, year)

				monthlyEntry, exists := monthlyData[monthKey]
				if !exists {
					monthlyEntry = calendarMonthlyData{
						Year:           year,
						Month:          month,
						PnL:            decimal.Decimal{},
						PositionsCount: 0,
						DailyData:      make(map[int]calendarDailyData),
					}
				}

				dailyEntry, exists := monthlyEntry.DailyData[day]
				if !exists {
					dailyEntry = calendarDailyData{
						PnL:            decimal.Decimal{},
						PositionsCount: 0,
					}
				}

				netPnL := trade.RealisedGrossPnL.Sub(stats.ChargesAmount)

				dailyEntry.PnL = dailyEntry.PnL.Add(netPnL)

				positionsFound, positionAlreadyCounted := positionsFoundOnDate[positionFoundKey]
				if !positionAlreadyCounted {
					positionsFoundOnDate[positionFoundKey] = []uuid.UUID{}
				}

				if !slices.Contains(positionsFound, position.ID) {
					positionsFoundOnDate[positionFoundKey] = append(positionsFoundOnDate[positionFoundKey], position.ID)
					dailyEntry.PositionsCount += 1
					monthlyEntry.PositionsCount += 1
				}

				monthlyEntry.PnL = monthlyEntry.PnL.Add(netPnL)

				monthlyEntry.DailyData[day] = dailyEntry
				monthlyData[monthKey] = monthlyEntry
			}
		}
	}

	result.MonthlyData = monthlyData

	return &result, service.ErrNone, nil
}
