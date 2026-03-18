package analytics

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/subscription"
	"arthveda/internal/feature/calendar"
	"arthveda/internal/feature/dashboard"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/tag"
	"arthveda/internal/logger"
	"fmt"

	"context"
	"time"

	"sort"

	"github.com/google/uuid"
	"github.com/mudgallabs/tantra/service"
	"github.com/shopspring/decimal"
)

type Service struct {
	positionRepository position.ReadWriter
	tagRepository      tag.ReadWriter
	calendarService    *calendar.Service
}

func NewService(
	positionRepository position.ReadWriter, tagRepository tag.ReadWriter,
	calendarService *calendar.Service,
) *Service {
	return &Service{
		positionRepository: positionRepository,
		tagRepository:      tagRepository,
		calendarService:    calendarService,
	}
}

type tagsSummaryItem struct {
	dashboard.GeneralStats

	TagGroup       string          `json:"tag_group"`
	TagName        string          `json:"tag_name"`
	PositionsCount int             `json:"positions_count"`
	RFactor        decimal.Decimal `json:"r_factor"`
}

type tagsSummaryGroup struct {
	TagGroup string            `json:"tag_group"`
	Tags     []tagsSummaryItem `json:"tags"`
}

type cumulativePnLByTag struct {
	TagGroup string               `json:"tag_group"`
	TagName  string               `json:"tag_name"`
	Buckets  []position.PnlBucket `json:"buckets"`
}

type cumulativePnLByTagGroup struct {
	TagGroup string               `json:"tag_group"`
	Tags     []cumulativePnLByTag `json:"tags"`
}

type GetTabsResult struct {
	Summary                 []tagsSummaryItem         `json:"summary"`
	SummaryGroup            []tagsSummaryGroup        `json:"summary_group"`
	CumulativePnLByTagGroup []cumulativePnLByTagGroup `json:"cumulative_pnl_by_tag_group"`
}

func (s *Service) GetTags(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetTabsResult, service.Error, error) {
	l := logger.Get()
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

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload, true, true)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to search positions: %w", err)
	}

	tagGroupsWithTags, err := s.tagRepository.ListTagGroupsWithTags(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to list tag groups with tags: %w", err)
	}

	// Build tagID -> (groupName, tagName) map
	type tagMeta struct {
		GroupName string
		TagName   string
	}

	tagIDToMeta := make(map[string]tagMeta)
	for _, tg := range tagGroupsWithTags {
		for _, t := range tg.Tags {
			tagIDToMeta[t.ID.String()] = tagMeta{
				GroupName: tg.TagGroup.Name,
				TagName:   t.Name,
			}
		}
	}

	// Prepare: tagID -> positions
	tagIDToPositions := make(map[string][]*position.Position)
	for _, pos := range positions {
		for _, tagObj := range pos.Tags {
			tagID := tagObj.ID.String()
			tagIDToPositions[tagID] = append(tagIDToPositions[tagID], pos)
		}
	}

	// Debug print the tagIDToPositions map
	for tagID, posList := range tagIDToPositions {
		l.Debugln("TagID: %s, Positions Count: %d\n", tagIDToMeta[tagID].TagName, len(posList))
	}

	// For each tag, compute cumulative PnL buckets
	cumulativePnLByTagGroupData := []cumulativePnLByTagGroup{}

	for _, tg := range tagGroupsWithTags {
		group := cumulativePnLByTagGroup{
			TagGroup: tg.TagGroup.Name,
			Tags:     []cumulativePnLByTag{},
		}

		for _, t := range tg.Tags {
			tagID := t.ID.String()
			tagPositions := tagIDToPositions[tagID]

			if len(tagPositions) == 0 {
				l.Debugln("Tag '%s' has no positions\n", t.Name)
				continue
			}

			rangeStart, rangeEnd := position.GetRangeBasedOnTrades(tagPositions)

			// Fallback: If rangeStart or rangeEnd is zero, use global positions' range
			if rangeStart.IsZero() || rangeEnd.IsZero() || !rangeEnd.After(rangeStart) {
				l.Debugln("Tag '%s': Invalid range, skipping or fallback\n", t.Name)
				continue
			}

			bucketPeriod := common.GetBucketPeriodForRange(rangeStart, rangeEnd)

			positionsFiltered := position.FilterPositionsWithRealisingTradesUpTo(positions, rangeEnd, tz)

			for _, pos := range positionsFiltered {
				_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction, pos.RiskAmount)
				if err != nil {
					l.Errorw("failed to compute smart trades for position", "position_id", pos.ID, "error", err)
					continue
				}
			}

			cumulative := position.GetCumulativePnLBuckets(tagPositions, bucketPeriod, rangeStart, rangeEnd, tz)

			group.Tags = append(group.Tags, cumulativePnLByTag{
				TagGroup: tg.TagGroup.Name,
				TagName:  t.Name,
				Buckets:  cumulative,
			})
		}

		if len(group.Tags) > 0 {
			cumulativePnLByTagGroupData = append(cumulativePnLByTagGroupData, group)
		}
	}

	summary := []tagsSummaryItem{}

	for _, tg := range tagGroupsWithTags {
		for _, t := range tg.Tags {
			tagID := t.ID.String()
			tagPositions := tagIDToPositions[tagID]

			if len(tagPositions) == 0 {
				// summary = append(summary, tagsSummaryItem{
				// 	TagGroup: tg.TagGroup.Name,
				// 	TagName:  t.Name,
				// })

				continue
			}

			gen := dashboard.GetGeneralStats(tagPositions)

			rfactor := decimal.Zero
			for _, pos := range tagPositions {
				rfactor = rfactor.Add(pos.RFactor)
			}

			summary = append(summary, tagsSummaryItem{
				GeneralStats:   gen,
				TagGroup:       tg.TagGroup.Name,
				TagName:        t.Name,
				PositionsCount: len(tagPositions),
				RFactor:        rfactor,
			})
		}
	}

	// Sort summary by group_name, net_pnl desc.
	sort.Slice(summary, func(i, j int) bool {
		if summary[i].TagGroup == summary[j].TagGroup {
			return summary[i].NetPnL.GreaterThan(summary[j].NetPnL)
		}
		return summary[i].TagGroup < summary[j].TagGroup
	})

	// Group summary by TagGroup for bar chart
	groupMap := make(map[string][]tagsSummaryItem)
	for _, item := range summary {
		groupMap[item.TagGroup] = append(groupMap[item.TagGroup], item)
	}

	summaryGroup := []tagsSummaryGroup{}
	for group, items := range groupMap {
		// Sort tags within group by NetPnL desc
		sort.Slice(items, func(i, j int) bool {
			return items[i].NetPnL.GreaterThan(items[j].NetPnL)
		})
		summaryGroup = append(summaryGroup, tagsSummaryGroup{
			TagGroup: group,
			Tags:     items,
		})
	}

	// Sort groups by name
	sort.Slice(summaryGroup, func(i, j int) bool {
		return summaryGroup[i].TagGroup < summaryGroup[j].TagGroup
	})

	return &GetTabsResult{
		Summary:                 summary,
		SummaryGroup:            summaryGroup,
		CumulativePnLByTagGroup: cumulativePnLByTagGroupData,
	}, service.ErrNone, nil
}

type dayOfTheWeekItem struct {
	Day            common.Day      `json:"day"`
	PositionsCount int             `json:"positions_count"`
	GrossPnL       decimal.Decimal `json:"gross_pnl"`
	Charges        decimal.Decimal `json:"charges"`
	NetPnL         decimal.Decimal `json:"net_pnl"`
	GrossRFactor   decimal.Decimal `json:"gross_r_factor"`
}

type hourOfTheDayItem struct {
	Hour           common.Hour     `json:"hour"`
	PositionsCount int             `json:"positions_count"`
	GrossPnL       decimal.Decimal `json:"gross_pnl"`
	Charges        decimal.Decimal `json:"charges"`
	NetPnL         decimal.Decimal `json:"net_pnl"`
	GrossRFactor   decimal.Decimal `json:"gross_r_factor"`
}

type holdingPeriodItem struct {
	Period         common.HoldingPeriod `json:"period"`
	PositionsCount int                  `json:"positions_count"`
	GrossPnL       decimal.Decimal      `json:"gross_pnl"`
	Charges        decimal.Decimal      `json:"charges"`
	NetPnL         decimal.Decimal      `json:"net_pnl"`
	GrossRFactor   decimal.Decimal      `json:"gross_r_factor"`
}

type GetTimeResult struct {
	DayOfTheWeek  []dayOfTheWeekItem  `json:"day_of_the_week"`
	HourOfTheDay  []hourOfTheDayItem  `json:"hour_of_the_day"`
	HoldingPeriod []holdingPeriodItem `json:"holding_period"`
}

func (s *Service) GetTime(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetTimeResult, service.Error, error) {
	calendarResult, svcErr, err := s.calendarService.GetAll(ctx, userID, tz, enforcer)
	if err != nil {
		return nil, svcErr, err
	}

	dayStats := make(map[common.Day]*dayOfTheWeekItem)

	for _, yearly := range *calendarResult {
		for _, monthly := range yearly.Monthly {
			for _, daily := range monthly.Daily {
				date := daily.Date.In(tz)

				var day common.Day

				switch date.Weekday() {
				case time.Monday:
					day = common.DayMon
				case time.Tuesday:
					day = common.DayTue
				case time.Wednesday:
					day = common.DayWed
				case time.Thursday:
					day = common.DayThu
				case time.Friday:
					day = common.DayFri
				case time.Saturday:
					day = common.DaySat
				case time.Sunday:
					day = common.DaySun
				}

				if _, ok := dayStats[day]; !ok {
					dayStats[day] = &dayOfTheWeekItem{
						Day:            day,
						PositionsCount: 0,
						GrossPnL:       decimal.Zero,
						Charges:        decimal.Zero,
						NetPnL:         decimal.Zero,
						GrossRFactor:   decimal.Zero,
					}
				}

				entry := dayStats[day]

				entry.PositionsCount += daily.PositionsCount
				entry.GrossPnL = entry.GrossPnL.Add(daily.GrossPnL)
				entry.Charges = entry.Charges.Add(daily.Charges)
				entry.NetPnL = entry.NetPnL.Add(daily.NetPnL)
				entry.GrossRFactor = entry.GrossRFactor.Add(daily.GrossRFactor)
			}
		}
	}

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

	_, rangeEnd := position.GetRangeBasedOnTrades(positions)
	positionsFiltered := position.FilterPositionsWithRealisingTradesUpTo(positions, rangeEnd, tz)

	hourStats := make(map[common.Hour]*hourOfTheDayItem)
	hourPositions := make(map[common.Hour]map[uuid.UUID]struct{})
	holdingStats := make(map[common.HoldingPeriod]*holdingPeriodItem)

	for _, pos := range positionsFiltered {
		_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction, pos.RiskAmount)
		if err != nil {
			continue
		}

		for _, t := range pos.Trades {
			if len(t.MatchedLots) == 0 {
				continue
			}

			h := t.Time.In(tz).Hour()
			hour := common.Hour(fmt.Sprintf("%02d_%02d", h, h+1))

			if _, ok := hourStats[hour]; !ok {
				hourStats[hour] = &hourOfTheDayItem{
					Hour:         hour,
					GrossPnL:     decimal.Zero,
					Charges:      decimal.Zero,
					NetPnL:       decimal.Zero,
					GrossRFactor: decimal.Zero,
				}
				hourPositions[hour] = make(map[uuid.UUID]struct{})
			}

			entry := hourStats[hour]

			entry.GrossPnL = entry.GrossPnL.Add(t.RealisedGrossPnL)
			entry.Charges = entry.Charges.Add(t.ChargesAmount)
			entry.NetPnL = entry.NetPnL.Add(t.RealisedNetPnL)
			entry.GrossRFactor = entry.GrossRFactor.Add(t.GrossRFactor)

			// Track unique position for this hour
			hourPositions[hour][pos.ID] = struct{}{}
		}

		// Skip if the curren position is still open.
		if pos.ClosedAt == nil || pos.Status == position.StatusOpen {
			continue
		}

		duration := pos.ClosedAt.Sub(pos.OpenedAt)

		if duration < 0 {
			continue
		}

		bucket := common.GetHoldingPeriodBucket(duration)

		if _, ok := holdingStats[bucket]; !ok {
			holdingStats[bucket] = &holdingPeriodItem{
				Period:         bucket,
				PositionsCount: 0,
				GrossPnL:       decimal.Zero,
				Charges:        decimal.Zero,
				NetPnL:         decimal.Zero,
				GrossRFactor:   decimal.Zero,
			}
		}

		entry := holdingStats[bucket]

		entry.PositionsCount++
		entry.GrossPnL = entry.GrossPnL.Add(pos.GrossPnLAmount)
		entry.Charges = entry.Charges.Add(pos.TotalChargesAmount)
		entry.NetPnL = entry.NetPnL.Add(pos.NetPnLAmount)
		entry.GrossRFactor = entry.GrossRFactor.Add(pos.GrossRFactor)

	}

	result := GetTimeResult{
		DayOfTheWeek: make([]dayOfTheWeekItem, 0, 7),
		HourOfTheDay: make([]hourOfTheDayItem, 0, 24),
	}

	orderedDays := []common.Day{
		common.DayMon,
		common.DayTue,
		common.DayWed,
		common.DayThu,
		common.DayFri,
		common.DaySat,
		common.DaySun,
	}

	for _, day := range orderedDays {
		if stats, ok := dayStats[day]; ok {
			result.DayOfTheWeek = append(result.DayOfTheWeek, *stats)
		} else {
			// Ensure empty days still appear.
			result.DayOfTheWeek = append(result.DayOfTheWeek, dayOfTheWeekItem{
				Day:            day,
				PositionsCount: 0,
				GrossPnL:       decimal.Zero,
				Charges:        decimal.Zero,
				NetPnL:         decimal.Zero,
				GrossRFactor:   decimal.Zero,
			})
		}
	}

	orderedHours := []common.Hour{
		common.Hour00_01, common.Hour01_02, common.Hour02_03, common.Hour03_04,
		common.Hour04_05, common.Hour05_06, common.Hour06_07, common.Hour07_08,
		common.Hour08_09, common.Hour09_10, common.Hour10_11, common.Hour11_12,
		common.Hour12_13, common.Hour13_14, common.Hour14_15, common.Hour15_16,
		common.Hour16_17, common.Hour17_18, common.Hour18_19, common.Hour19_20,
		common.Hour20_21, common.Hour21_22, common.Hour22_23, common.Hour23_24,
	}

	for hour, positions := range hourPositions {
		hourStats[hour].PositionsCount = len(positions)
	}

	for _, hour := range orderedHours {
		if stats, ok := hourStats[hour]; ok {
			result.HourOfTheDay = append(result.HourOfTheDay, *stats)
		}
	}

	orderedBuckets := []common.HoldingPeriod{
		common.HoldingUnder1m,
		common.Holding1To5m,
		common.Holding5To15m,
		common.Holding15To60m,
		common.Holding1To24h,
		common.Holding1To7d,
		common.Holding7To30d,
		common.Holding30To365d,
		common.HoldingOver365d,
	}

	result.HoldingPeriod = make([]holdingPeriodItem, 0, len(orderedBuckets))

	for _, bucket := range orderedBuckets {
		if stats, ok := holdingStats[bucket]; ok {
			result.HoldingPeriod = append(result.HoldingPeriod, *stats)
		} else {
			result.HoldingPeriod = append(result.HoldingPeriod, holdingPeriodItem{
				Period:         bucket,
				PositionsCount: 0,
				GrossPnL:       decimal.Zero,
				Charges:        decimal.Zero,
				NetPnL:         decimal.Zero,
				GrossRFactor:   decimal.Zero,
			})
		}
	}

	return &result, service.ErrNone, nil
}

type symbolsPerformanceItem struct {
	Symbol                 string          `json:"symbol"`
	PositionsCount         int             `json:"positions_count"`
	ContributionPercentage float64         `json:"contribution_percentage"`
	GrossPnL               decimal.Decimal `json:"gross_pnl"`
	NetPnL                 decimal.Decimal `json:"net_pnl"`
	Charges                decimal.Decimal `json:"charges"`
	AvgGrossR              decimal.Decimal `json:"avg_gross_r"`
	AvgWinR                decimal.Decimal `json:"avg_win_r"`
	AvgLossR               decimal.Decimal `json:"avg_loss_r"`
	WinRate                decimal.Decimal `json:"win_rate"`
	Efficiency             decimal.Decimal `json:"efficiency"`
}

type GetSymbolsResult struct {
	BestPerformance  []symbolsPerformanceItem `json:"best_performance"`
	WorstPerformance []symbolsPerformanceItem `json:"worst_performance"`
	TopTraded        []symbolsPerformanceItem `json:"top_traded"`
}

func (s *Service) GetSymbols(ctx context.Context, userID uuid.UUID, tz *time.Location, enforcer *subscription.PlanEnforcer) (*GetSymbolsResult, service.Error, error) {
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

	_, rangeEnd := position.GetRangeBasedOnTrades(positions)
	positionsFiltered := position.FilterPositionsWithRealisingTradesUpTo(positions, rangeEnd, tz)

	result := GetSymbolsResult{
		BestPerformance:  []symbolsPerformanceItem{},
		WorstPerformance: []symbolsPerformanceItem{},
		TopTraded:        []symbolsPerformanceItem{},
	}

	type agg struct {
		positionsCount int

		grossPnL decimal.Decimal
		netPnL   decimal.Decimal
		charges  decimal.Decimal

		totalR decimal.Decimal

		wins       int
		losses     int
		winRTotal  decimal.Decimal
		lossRTotal decimal.Decimal
	}

	symbolMap := map[string]*agg{}

	for _, pos := range positionsFiltered {
		// Ignore the position if it's NOTE closed.
		if pos.ClosedAt == nil || !pos.OpenQuantity.IsZero() {
			continue
		}

		_, err := position.ComputeSmartTrades(pos.Trades, pos.Direction, pos.RiskAmount)
		if err != nil {
			continue
		}

		a, ok := symbolMap[pos.Symbol]
		if !ok {
			a = &agg{}
			symbolMap[pos.Symbol] = a
		}

		a.positionsCount++

		a.grossPnL = a.grossPnL.Add(pos.GrossPnLAmount)
		a.netPnL = a.netPnL.Add(pos.NetPnLAmount)
		a.charges = a.charges.Add(pos.TotalChargesAmount)

		a.totalR = a.totalR.Add(pos.GrossRFactor)

		if pos.GrossRFactor.GreaterThan(decimal.Zero) {
			a.wins++
			a.winRTotal = a.winRTotal.Add(pos.GrossRFactor)
		} else if pos.GrossRFactor.LessThan(decimal.Zero) {
			a.losses++
			a.lossRTotal = a.lossRTotal.Add(pos.GrossRFactor)
		}
	}

	buildItems := func(m map[string]*agg) []symbolsPerformanceItem {
		items := make([]symbolsPerformanceItem, 0, len(m))

		for symbol, a := range m {
			trades := decimal.NewFromInt(int64(a.positionsCount))

			avgGrossR := decimal.Zero
			if a.positionsCount > 0 {
				avgGrossR = a.totalR.Div(trades)
			}

			winRate := decimal.Zero
			if a.positionsCount > 0 {
				winRate = decimal.NewFromInt(int64(a.wins)).
					Div(trades).
					Mul(decimal.NewFromInt(100))
			}

			avgWinR := decimal.Zero
			if a.wins > 0 {
				avgWinR = a.winRTotal.Div(decimal.NewFromInt(int64(a.wins)))
			}

			avgLossR := decimal.Zero
			if a.losses > 0 {
				avgLossR = a.lossRTotal.Div(decimal.NewFromInt(int64(a.losses)))
			}

			efficiency := decimal.Zero
			if !a.grossPnL.IsZero() && a.grossPnL.GreaterThan(decimal.Zero) {
				efficiency = a.netPnL.Div(a.grossPnL)
			}

			items = append(items, symbolsPerformanceItem{
				Symbol:         symbol,
				PositionsCount: a.positionsCount,
				GrossPnL:       a.grossPnL,
				NetPnL:         a.netPnL,
				Charges:        a.charges,
				AvgGrossR:      avgGrossR,
				AvgWinR:        avgWinR,
				AvgLossR:       avgLossR,
				WinRate:        winRate,
				Efficiency:     efficiency,
			})
		}

		return items
	}

	allItems := buildItems(symbolMap)

	sort.Slice(allItems, func(i, j int) bool {
		return allItems[i].NetPnL.GreaterThan(allItems[j].NetPnL)
	})

	bestTop := []symbolsPerformanceItem{}
	bestOthers := &symbolsPerformanceItem{}

	for _, item := range allItems {
		if item.NetPnL.LessThanOrEqual(decimal.Zero) {
			continue
		}

		if len(bestTop) < 10 {
			bestTop = append(bestTop, item)
		} else {
			bestOthers = aggregateOthers(bestOthers, item)
		}
	}

	sort.Slice(allItems, func(i, j int) bool {
		return allItems[i].NetPnL.LessThan(allItems[j].NetPnL)
	})

	worstTop := []symbolsPerformanceItem{}
	worstOthers := &symbolsPerformanceItem{}

	for _, item := range allItems {
		if item.NetPnL.GreaterThanOrEqual(decimal.Zero) {
			continue
		}

		if len(worstTop) < 10 {
			worstTop = append(worstTop, item)
		} else {
			worstOthers = aggregateOthers(worstOthers, item)
		}
	}

	sort.Slice(allItems, func(i, j int) bool {
		return allItems[i].PositionsCount > allItems[j].PositionsCount
	})

	topTraded := allItems
	if len(topTraded) > 10 {
		topTraded = topTraded[:10]
	}

	totalPositive := decimal.Zero
	totalNegativeAbs := decimal.Zero

	for _, item := range allItems {
		if item.NetPnL.GreaterThan(decimal.Zero) {
			totalPositive = totalPositive.Add(item.NetPnL)
		}

		if item.NetPnL.LessThan(decimal.Zero) {
			totalNegativeAbs = totalNegativeAbs.Add(item.NetPnL.Abs())
		}
	}

	for i := range bestTop {
		if !totalPositive.IsZero() {
			bestTop[i].ContributionPercentage = bestTop[i].NetPnL.
				Div(totalPositive).
				Mul(decimal.NewFromInt(100)).
				InexactFloat64()
		}
	}

	for i := range worstTop {
		if !totalNegativeAbs.IsZero() {
			worstTop[i].ContributionPercentage = worstTop[i].NetPnL.Abs().
				Div(totalNegativeAbs).
				Mul(decimal.NewFromInt(100)).
				InexactFloat64()
		}
	}

	if bestOthers != nil && !bestOthers.NetPnL.IsZero() && !totalPositive.IsZero() {
		bestOthers.ContributionPercentage = bestOthers.NetPnL.
			Div(totalPositive).
			Mul(decimal.NewFromInt(100)).
			InexactFloat64()
	}

	if worstOthers != nil && !worstOthers.NetPnL.IsZero() && !totalNegativeAbs.IsZero() {
		worstOthers.ContributionPercentage = worstOthers.NetPnL.Abs().
			Div(totalNegativeAbs).
			Mul(decimal.NewFromInt(100)).
			InexactFloat64()
	}

	result.BestPerformance = append(bestTop, *bestOthers)
	result.WorstPerformance = append(worstTop, *worstOthers)
	result.TopTraded = topTraded

	return &result, service.ErrNone, nil
}
