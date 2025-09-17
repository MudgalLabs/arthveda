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
// type calendarMonthlyKey string

// func createCalendarMonthlyKey(year int, month time.Month) calendarMonthlyKey {
// 	return calendarMonthlyKey(fmt.Sprintf("%s_%d", month.String(), year))
// }

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

type calendarYearly = map[string]calendarMonthly // key is month (e.g., "September")

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

	// yearlyData := make(map[int]calendarYearly)
	// monthlyData := make(map[string]calendarMonthly)
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
				positionFoundKey := fmt.Sprintf("%02d%02d%d", day, month, year)

				_, exists := result[year]
				if !exists {
					result[year] = make(map[string]calendarMonthly)
				}

				monthlyEntry, exists := result[year][month.String()]
				if !exists {
					monthlyEntry = calendarMonthly{
						Year:           year,
						Month:          month,
						PnL:            decimal.Decimal{},
						PositionsCount: 0,
						Daily:          make(map[int]calendarDaily),
					}
				}

				dailyEntry, exists := monthlyEntry.Daily[day]
				if !exists {
					dailyEntry = calendarDaily{
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

				monthlyEntry.Daily[day] = dailyEntry
				// monthlyData[month.String()] = monthlyEntry
				result[year][month.String()] = monthlyEntry
			}
		}
	}

	// result.Yearly = monthlyData

	return &result, service.ErrNone, nil
}
