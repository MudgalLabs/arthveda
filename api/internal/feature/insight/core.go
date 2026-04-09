package insight

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/report"
	"math"
	"sort"
	"strings"

	"github.com/shopspring/decimal"
)

const (
	BASE_MIN_TRADES   = 5    // 5 trades
	MIN_WINRATE_DELTA = 0.15 // 15%
	MIN_PNL_DELTA     = 0.25 // 25%
)

type thresholds struct {
	TinyTrades   int // Noise filter.
	NormalTrades int // Reliable data.
	HighTrades   int // Overtrading detection.
}

func buildThresholds(medianTrades int) thresholds {
	tiny := max(2, medianTrades/10)
	normal := max(BASE_MIN_TRADES, medianTrades/5)
	high := int(float64(medianTrades) * 1.5)

	return thresholds{
		TinyTrades:   tiny,
		NormalTrades: normal,
		HighTrades:   high,
	}
}

func getTimeOfDayInsights(
	hours []report.HourOfTheDayItem,
	baseline decimal.Decimal,
) []insight {
	insights := []insight{}

	var trades []int

	for i := range hours {
		h := &hours[i]

		if h.PositionsCount < BASE_MIN_TRADES {
			continue
		}

		trades = append(trades, h.PositionsCount)
	}

	medianTrades := calcMedian(trades)

	// Skip insights generation.
	if medianTrades == 0 {
		return insights
	}

	thresholds := buildThresholds(medianTrades)

	var mostProfits *report.HourOfTheDayItem
	var leastProfits *report.HourOfTheDayItem

	var tradeBest *report.HourOfTheDayItem
	var tradeWorst *report.HourOfTheDayItem

	var lowEfficiency *report.HourOfTheDayItem
	var highEfficiency *report.HourOfTheDayItem

	var bestEfficiency decimal.Decimal

	for i := range hours {
		h := &hours[i]

		if h.PositionsCount < thresholds.NormalTrades {
			continue
		}

		// Most profits (contribution)
		if mostProfits == nil || h.NetPnL.GreaterThan(mostProfits.NetPnL) {
			mostProfits = h
		}

		// Worst loss (contribution)
		if leastProfits == nil || h.NetPnL.LessThan(leastProfits.NetPnL) {
			leastProfits = h
		}

		// Trade best (quality)
		if h.AvgPnL.GreaterThan(baseline) {
			if tradeBest == nil || h.AvgPnL.GreaterThan(tradeBest.AvgPnL) {
				tradeBest = h
			}
		}

		// Trade worst (quality)
		if h.AvgPnL.LessThan(baseline) {
			if tradeWorst == nil || h.AvgPnL.LessThan(tradeWorst.AvgPnL) {
				tradeWorst = h
			}
		}

		// High efficiency (exploratory).
		if h.PositionsCount >= thresholds.TinyTrades &&
			h.PositionsCount < thresholds.NormalTrades &&
			h.AvgPnL.GreaterThan(baseline) {

			efficiency := h.AvgPnL.Sub(baseline)

			if highEfficiency == nil || efficiency.GreaterThan(bestEfficiency) {
				highEfficiency = h
				bestEfficiency = efficiency
			}
		}

		// Low efficiency (behavioral).
		if h.PositionsCount >= thresholds.HighTrades &&
			h.AvgPnL.LessThan(baseline) {

			if lowEfficiency == nil || h.PositionsCount > lowEfficiency.PositionsCount {
				lowEfficiency = h
			}
		}
	}

	// Deduplication.

	if highEfficiency != nil && mostProfits != nil && highEfficiency.Hour == mostProfits.Hour {
		highEfficiency = nil
	}

	if lowEfficiency != nil && leastProfits != nil && lowEfficiency.Hour == leastProfits.Hour {
		lowEfficiency = nil
	}

	if tradeBest != nil && mostProfits != nil && tradeBest.Hour == mostProfits.Hour {
		tradeBest = nil
	}

	if tradeWorst != nil && leastProfits != nil && tradeWorst.Hour == leastProfits.Hour {
		tradeWorst = nil
	}

	if tradeBest != nil && highEfficiency != nil && tradeBest.Hour == highEfficiency.Hour {
		highEfficiency = nil
	}

	if mostProfits != nil && mostProfits.AvgPnL.GreaterThan(baseline) {
		hourLabel := common.FormatHour(mostProfits.Hour)

		desc := "Trades during this hour contribute the most to your overall PnL"

		if tradeBest != nil && tradeBest.Hour != mostProfits.Hour {
			desc += ", but your trades perform better at " + common.FormatHour(tradeBest.Hour)
		}

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "positive",
			Title:       "Your best hour is " + hourLabel,
			Description: desc,
			Action:      "Focus more on this hour",
		})
	}

	if leastProfits != nil && leastProfits.AvgPnL.LessThan(decimal.Zero) {
		hourLabel := common.FormatHour(leastProfits.Hour)

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "negative",
			Title:       "Your weakest hour is " + hourLabel,
			Description: "Trades during this hour consistently reduce your overall PnL",
			Action:      "Avoid trading during this hour",
		})
	}

	if tradeBest != nil {
		delta := decimal.Zero
		if !baseline.IsZero() {
			delta = tradeBest.AvgPnL.Sub(baseline).
				Div(baseline).
				Mul(decimal.NewFromInt(100))
		}

		hourLabel := common.FormatHour(tradeBest.Hour)

		desc := "Your average PnL per trade is {delta} higher during this hour"

		if mostProfits != nil && mostProfits.Hour != tradeBest.Hour {
			desc += ", but most of your profits come from " + common.FormatHour(mostProfits.Hour)
		}

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "positive",
			Title:       "You trade best at " + hourLabel,
			Description: desc,
			Tokens: map[string]token{
				"delta": {
					Value: delta.InexactFloat64(),
					Type:  "percentage",
					Tone:  "positive",
				},
			},
			Action: "Lean into this time window",
		})
	}

	if tradeWorst != nil {
		delta := decimal.Zero
		if !baseline.IsZero() {
			delta = baseline.Sub(tradeWorst.AvgPnL).
				Div(baseline).
				Mul(decimal.NewFromInt(100))
		}

		hourLabel := common.FormatHour(tradeWorst.Hour)

		desc := "Your average PnL per trade drops by {delta} during this hour"

		if tradeBest != nil && tradeBest.Hour != tradeWorst.Hour {
			desc += ", compared to stronger performance at " + common.FormatHour(tradeBest.Hour)
		}

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "negative",
			Title:       "Your trade worst at " + hourLabel,
			Description: desc,
			Tokens: map[string]token{
				"delta": {
					Value: delta.InexactFloat64(),
					Type:  "percentage",
					Tone:  "negative",
				},
			},
			Action: "Be more cautious during this hour",
		})
	}

	if lowEfficiency != nil {
		hourLabel := common.FormatHour(lowEfficiency.Hour)

		desc := "You take more trades during this hour, but they underperform your average"

		if tradeBest != nil && tradeBest.Hour != lowEfficiency.Hour {
			desc += ", while you perform better at " + common.FormatHour(tradeBest.Hour)
		}

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "negative",
			Title:       "You overtrade at " + hourLabel,
			Description: desc,
			Action:      "Be more selective during this hour",
		})
	}

	if highEfficiency != nil {
		hourLabel := common.FormatHour(highEfficiency.Hour)

		desc := "You don’t trade much during this hour, but your trades perform better than average"

		if mostProfits != nil && mostProfits.Hour != highEfficiency.Hour {
			desc += ", while most of your trading happens at " + common.FormatHour(mostProfits.Hour)
		}

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "positive",
			Title:       "Untapped edge at " + hourLabel,
			Description: desc,
			Action:      "Explore trading more during this hour",
		})
	}

	strongStart, strongEnd, strongCurrStart := -1, -1, -1
	strongSum := decimal.Zero
	strongCurrSum := decimal.Zero

	for i := range hours {
		h := &hours[i]

		// Treat tiny trades as break (use adaptive threshold).
		if h.PositionsCount < thresholds.TinyTrades {
			if strongCurrStart != -1 {
				if strongStart == -1 || strongCurrSum.GreaterThan(strongSum) {
					strongStart = strongCurrStart
					strongEnd = i - 1
					strongSum = strongCurrSum
				}
				strongCurrStart = -1
				strongCurrSum = decimal.Zero
			}
			continue
		}

		// Only consider clearly positive edge.
		if h.AvgPnL.GreaterThan(baseline) {
			if strongCurrStart == -1 {
				strongCurrStart = i
				strongCurrSum = decimal.Zero
			}

			// Accumulate edge vs baseline.
			strongCurrSum = strongCurrSum.Add(h.AvgPnL.Sub(baseline))
		} else {
			if strongCurrStart != -1 {
				if strongStart == -1 || strongCurrSum.GreaterThan(strongSum) {
					strongStart = strongCurrStart
					strongEnd = i - 1
					strongSum = strongCurrSum
				}
				strongCurrStart = -1
				strongCurrSum = decimal.Zero
			}
		}
	}

	// Handle tail.
	if strongCurrStart != -1 {
		if strongStart == -1 || strongCurrSum.GreaterThan(strongSum) {
			strongStart = strongCurrStart
			strongEnd = len(hours) - 1
			strongSum = strongCurrSum
		}
	}

	// Only show meaningful window (avoid 1-hour overlap with best hour).
	if strongStart != -1 && strongEnd > strongStart {
		label := common.FormatHourRange(
			hours[strongStart].Hour,
			hours[strongEnd].Hour,
		)

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "positive",
			Title:       "Most of your profits come from " + label,
			Description: "Trades during this period contribute the majority of your PnL",
			Action:      "Prioritize trading in this window",
		})
	}

	weakStart, weakEnd, weakCurrStart := -1, -1, -1
	weakSum := decimal.Zero
	weakCurrSum := decimal.Zero

	for i := range hours {
		h := &hours[i]

		// Skip tiny samples.
		if h.PositionsCount < thresholds.TinyTrades {
			if weakCurrStart != -1 {
				if weakStart == -1 || weakCurrSum.LessThan(weakSum) {
					weakStart = weakCurrStart
					weakEnd = i - 1
					weakSum = weakCurrSum
				}

				weakCurrStart = -1
				weakCurrSum = decimal.Zero
			}
			continue
		}

		// if h.AvgPnL.LessThan(baseline) {
		if h.NetPnL.LessThan(decimal.Zero) {
			if weakCurrStart == -1 {
				weakCurrStart = i
				weakCurrSum = decimal.Zero
			}

			weakCurrSum = weakCurrSum.Add(h.AvgPnL.Sub(baseline))
		} else {
			if weakCurrStart != -1 {
				if weakStart == -1 || weakCurrSum.LessThan(weakSum) {
					weakStart = weakCurrStart
					weakEnd = i - 1
					weakSum = weakCurrSum
				}
				weakCurrStart = -1
				weakCurrSum = decimal.Zero
			}
		}
	}

	// Tail.
	if weakCurrStart != -1 {
		if weakStart == -1 || weakCurrSum.LessThan(weakSum) {
			weakStart = weakCurrStart
			weakEnd = len(hours) - 1
			weakSum = weakCurrSum
		}
	}

	// Only show meaningful window.
	if weakStart != -1 && weakEnd > weakStart {
		label := common.FormatHourRange(
			hours[weakStart].Hour,
			hours[weakEnd].Hour,
		)

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "negative",
			Title:       "You give back profits during " + label,
			Description: "Trades during this period consistently reduce your overall PnL",
			Action:      "Avoid trading in this window",
		})
	}

	return insights
}

func getHoldingDurationInsights(
	durations []report.HoldingPeriodItem,
	baseline decimal.Decimal,
	globalProfit decimal.Decimal,
	globalLoss decimal.Decimal,
) []insight {
	insights := []insight{}

	var trades []int

	for i := range durations {
		d := &durations[i]

		if d.PositionsCount < BASE_MIN_TRADES {
			continue
		}

		trades = append(trades, d.PositionsCount)
	}

	medianTrades := calcMedian(trades)

	if medianTrades == 0 {
		return insights
	}

	thresholds := buildThresholds(medianTrades)

	var holdingOrder = []common.HoldingPeriod{
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

	m := make(map[common.HoldingPeriod]*report.HoldingPeriodItem)

	for i := range durations {
		d := &durations[i]
		m[d.Period] = d
	}

	var bestStart, bestEnd, currStart int = -1, -1, -1

	bestScore := decimal.Zero
	currScore := decimal.Zero

	for i, period := range holdingOrder {
		d, ok := m[period]

		// Break if no data or too small
		if !ok {
			if currStart != -1 {
				if bestStart == -1 || currScore.GreaterThan(bestScore) {
					bestStart = currStart
					bestEnd = i - 1
					bestScore = currScore
				}
				currStart = -1
				currScore = decimal.Zero
			}
			continue
		}

		// Check if profitable edge
		if d.AvgPnL.GreaterThan(baseline) {
			if currStart == -1 {
				currStart = i
				currScore = decimal.Zero
			}

			currScore = currScore.Add(d.AvgPnL.Sub(baseline))
		} else {
			if currStart != -1 {
				if bestStart == -1 || currScore.GreaterThan(bestScore) {
					bestStart = currStart
					bestEnd = i - 1
					bestScore = currScore
				}
				currStart = -1
				currScore = decimal.Zero
			}
		}
	}

	// tail case
	if currStart != -1 {
		if bestStart == -1 || currScore.GreaterThan(bestScore) {
			bestStart = currStart
			bestEnd = len(holdingOrder) - 1
			bestScore = currScore
		}
	}

	if bestStart != -1 && bestScore.GreaterThan(decimal.Zero) {
		start := holdingOrder[bestStart]
		end := holdingOrder[bestEnd]

		totalTrades := 0
		for i := bestStart; i <= bestEnd; i++ {
			d := m[holdingOrder[i]]
			totalTrades += d.PositionsCount
		}

		isHighConfidence := totalTrades >= thresholds.NormalTrades
		isMediumConfidence := totalTrades >= BASE_MIN_TRADES && totalTrades < thresholds.NormalTrades
		isLowConfidence := totalTrades < BASE_MIN_TRADES

		titleLabel := common.FormatHoldingPeriodRange(start, end)
		broadPct := getHoldingBroadProfitShare(bestStart, bestEnd, holdingOrder, m, globalProfit)
		isRange := bestEnd > bestStart

		var impactPct float64
		var coreLabel string

		if isRange {
			impactPct, coreLabel = getHoldingImpact(bestStart, bestEnd, holdingOrder, m, globalProfit)
		}

		desc := "Trades in this range contribute the most to your PnL"

		tokens := map[string]token{
			"broad": {
				Value: broadPct,
				Type:  "percentage",
				Tone:  "positive",
			},
			"impact": {
				Value: impactPct,
				Type:  "percentage",
				Tone:  "positive",
			},
			"range": {
				Value: coreLabel,
				Type:  "string",
			},
		}

		hasRealConcentration :=
			coreLabel != "" &&
				coreLabel != titleLabel &&
				impactPct < broadPct

		if broadPct > 0 && hasRealConcentration {
			desc = "{broad} of your profits come from this range, with {impact} concentrated in {range}"
		} else if broadPct > 0 {
			desc = "{broad} of your profits come from this range"
		} else if impactPct > 0 && coreLabel != "" {
			desc = "{impact} of your profits are concentrated in {range}"
		}

		cats := getHoldingCategoriesForRange(bestStart, bestEnd, holdingOrder, m)
		actionLabel := formatHoldingCategories(cats)

		title := ""

		if isHighConfidence {
			title = "Your edge is in " + titleLabel + " trades"
		} else if isMediumConfidence {
			title = "You seem to perform well in " + titleLabel + " trades"
		} else if isLowConfidence {
			title = "Early signs of strength in " + titleLabel + " trades"
		}

		insights = append(insights, insight{
			Type:        title,
			Direction:   "positive",
			Title:       "Your edge is in " + titleLabel + " trades",
			Description: desc,
			Tokens:      tokens,
			Action:      "Focus more on " + actionLabel + " trades",
		})
	}

	var weakStart, weakEnd, weakCurrStart int = -1, -1, -1

	weakScore := decimal.Zero
	weakCurrScore := decimal.Zero

	for i, period := range holdingOrder {
		d, ok := m[period]

		// Break on weak data
		if !ok {
			if weakCurrStart != -1 {
				if weakStart == -1 || weakCurrScore.LessThan(weakScore) {
					weakStart = weakCurrStart
					weakEnd = i - 1
					weakScore = weakCurrScore
				}
				weakCurrStart = -1
				weakCurrScore = decimal.Zero
			}
			continue
		}

		// Weak zone = losing money
		if d.NetPnL.LessThan(decimal.Zero) {
			if weakCurrStart == -1 {
				weakCurrStart = i
				weakCurrScore = decimal.Zero
			}

			weakCurrScore = weakCurrScore.Add(d.NetPnL) // accumulate losses
		} else {
			if weakCurrStart != -1 {
				if weakStart == -1 || weakCurrScore.LessThan(weakScore) {
					weakStart = weakCurrStart
					weakEnd = i - 1
					weakScore = weakCurrScore
				}
				weakCurrStart = -1
				weakCurrScore = decimal.Zero
			}
		}
	}

	// tail
	if weakCurrStart != -1 {
		if weakStart == -1 || weakCurrScore.LessThan(weakScore) {
			weakStart = weakCurrStart
			weakEnd = len(holdingOrder) - 1
			weakScore = weakCurrScore
		}
	}

	if weakStart != -1 && weakScore.LessThan(decimal.Zero) {
		start := holdingOrder[weakStart]
		end := holdingOrder[weakEnd]

		totalTrades := 0
		for i := weakStart; i <= weakEnd; i++ {
			d := m[holdingOrder[i]]
			totalTrades += d.PositionsCount
		}

		isHighConfidence := totalTrades >= thresholds.NormalTrades
		isMediumConfidence := totalTrades >= BASE_MIN_TRADES && totalTrades < thresholds.NormalTrades
		isLowConfidence := totalTrades < BASE_MIN_TRADES

		titleLabel := common.FormatHoldingPeriodRange(start, end)

		broadPct := getHoldingBroadLossShare(weakStart, weakEnd, holdingOrder, m, globalLoss)

		var lossPct float64
		var coreLabel string
		isRange := weakEnd > weakStart

		if isRange {
			lossPct, coreLabel = getHoldingLossImpact(weakStart, weakEnd, holdingOrder, m, globalLoss)
		}

		desc := "Trades in this range reduce your overall PnL"

		tokens := map[string]token{
			"broad": {
				Value: broadPct,
				Type:  "percentage",
				Tone:  "negative",
			},
			"loss": {
				Value: lossPct,
				Type:  "percentage",
				Tone:  "negative",
			},
			"range": {
				Value: coreLabel,
				Type:  "string",
			},
		}

		hasRealConcentration :=
			coreLabel != "" &&
				coreLabel != titleLabel &&
				lossPct < broadPct

		if broadPct > 0 && hasRealConcentration {
			desc = "{broad} of your losses come from this range, with {loss} concentrated in {range}"
		} else if broadPct > 0 {
			desc = "{broad} of your losses come from this range"
		} else if lossPct > 0 && coreLabel != "" {
			desc = "{loss} of your losses are concentrated in {range}"
		}

		cats := getHoldingCategoriesForRange(weakStart, weakEnd, holdingOrder, m)
		actionLabel := formatHoldingCategories(cats)

		title := ""

		if isHighConfidence {
			title = "Most of your losses come from " + titleLabel + " trades"
		} else if isMediumConfidence {
			title = "You tend to lose in " + titleLabel + " trades"
		} else if isLowConfidence {
			title = "Some losses are coming from " + titleLabel + " trades"
		}

		insights = append(insights, insight{
			Type:        "holding_duration",
			Direction:   "negative",
			Title:       title,
			Description: desc,
			Tokens:      tokens,
			Action:      "Be more selective with " + actionLabel + " trades",
		})
	}

	return insights
}

func getHoldingAction(category common.HoldingCategory, direction string) string {
	switch direction {

	case "positive":
		switch category {
		case common.HoldingScalping:
			return "Focus more on scalping setups"
		case common.HoldingIntraday:
			return "Focus more on intraday setups"
		case common.HoldingSwing:
			return "Focus more on swing trading setups"
		case common.HoldingPosition:
			return "Focus more on positional trades"
		}

	case "negative":
		switch category {
		case common.HoldingScalping:
			return "Try to avoid scalping trades"
		case common.HoldingIntraday:
			return "Try to avoid intraday trades"
		case common.HoldingSwing:
			return "Be cautious with swing trades"
		case common.HoldingPosition:
			return "Be cautious with long-term holdings"
		}
	}

	return ""
}

func getHoldingCategoriesForRange(
	startIdx, endIdx int,
	holdingOrder []common.HoldingPeriod,
	m map[common.HoldingPeriod]*report.HoldingPeriodItem,
) []common.HoldingCategory {

	categoryScore := map[common.HoldingCategory]int{}
	total := 0

	for i := startIdx; i <= endIdx; i++ {
		p := holdingOrder[i]

		d, ok := m[p]
		if !ok || d.PositionsCount == 0 {
			continue
		}

		c := common.GetHoldingCategory(p)

		categoryScore[c] += d.PositionsCount
		total += d.PositionsCount
	}

	type pair struct {
		cat   common.HoldingCategory
		score int
	}

	var pairs []pair
	for c, s := range categoryScore {
		pairs = append(pairs, pair{c, s})
	}

	sort.Slice(pairs, func(i, j int) bool {
		return pairs[i].score > pairs[j].score
	})

	var result []common.HoldingCategory

	for _, p := range pairs {
		share := float64(p.score) / float64(total)

		if share >= 0.25 {
			result = append(result, p.cat)
		}
	}

	if len(result) == 0 && len(pairs) > 0 {
		result = append(result, pairs[0].cat)
	}

	return result
}

func getHoldingImpact(
	startIdx, endIdx int,
	holdingOrder []common.HoldingPeriod,
	m map[common.HoldingPeriod]*report.HoldingPeriodItem,
	globalProfit decimal.Decimal,
) (float64, string) {
	if globalProfit.Equal(decimal.Zero) {
		return 0, ""
	}

	rangePnL := decimal.Zero

	for i := startIdx; i <= endIdx; i++ {
		d := m[holdingOrder[i]]
		if d.NetPnL.GreaterThan(decimal.Zero) {
			rangePnL = rangePnL.Add(d.NetPnL)
		}
	}

	type bucket struct {
		idx int
		pnl decimal.Decimal
	}

	var buckets []bucket

	for i := startIdx; i <= endIdx; i++ {
		d := m[holdingOrder[i]]

		if d.NetPnL.GreaterThan(decimal.Zero) {
			buckets = append(buckets, bucket{i, d.NetPnL})
		}
	}

	if len(buckets) == 0 {
		return 0, ""
	}

	sort.Slice(buckets, func(i, j int) bool {
		return buckets[i].pnl.GreaterThan(buckets[j].pnl)
	})

	corePnL := decimal.Zero
	coreStart, coreEnd := -1, -1

	for _, b := range buckets {
		corePnL = corePnL.Add(b.pnl)

		if coreStart == -1 || b.idx < coreStart {
			coreStart = b.idx
		}
		if coreEnd == -1 || b.idx > coreEnd {
			coreEnd = b.idx
		}

		share := corePnL.Div(rangePnL)

		if share.GreaterThanOrEqual(decimal.NewFromFloat(0.7)) {
			break
		}
	}

	if coreStart == -1 || coreEnd == -1 {
		return 0, ""
	}

	impactPct := corePnL.Div(globalProfit).Mul(decimal.NewFromInt(100))

	label := common.FormatHoldingPeriodRange(
		holdingOrder[coreStart],
		holdingOrder[coreEnd],
	)

	return impactPct.InexactFloat64(), label
}

func getHoldingLossImpact(
	startIdx, endIdx int,
	holdingOrder []common.HoldingPeriod,
	m map[common.HoldingPeriod]*report.HoldingPeriodItem,
	globalLoss decimal.Decimal,
) (float64, string) {
	if globalLoss.Equal(decimal.Zero) {
		return 0, ""
	}

	type bucket struct {
		idx  int
		loss decimal.Decimal
	}

	var buckets []bucket

	for i := startIdx; i <= endIdx; i++ {
		d := m[holdingOrder[i]]

		if d.NetPnL.LessThan(decimal.Zero) {
			buckets = append(buckets, bucket{i, d.NetPnL.Abs()})
		}
	}

	sort.Slice(buckets, func(i, j int) bool {
		return buckets[i].loss.GreaterThan(buckets[j].loss)
	})

	coreLoss := decimal.Zero
	coreStart, coreEnd := -1, -1

	for _, b := range buckets {
		coreLoss = coreLoss.Add(b.loss)

		if coreStart == -1 || b.idx < coreStart {
			coreStart = b.idx
		}
		if coreEnd == -1 || b.idx > coreEnd {
			coreEnd = b.idx
		}

		share := coreLoss.Div(globalLoss)

		if share.GreaterThanOrEqual(decimal.NewFromFloat(0.7)) {
			break
		}
	}

	if coreStart == -1 || coreEnd == -1 {
		return 0, ""
	}

	lossPct := coreLoss.Div(globalLoss).Mul(decimal.NewFromInt(100))

	label := common.FormatHoldingPeriodRange(
		holdingOrder[coreStart],
		holdingOrder[coreEnd],
	)

	return lossPct.InexactFloat64(), label
}

func getHoldingBroadProfitShare(
	startIdx, endIdx int,
	holdingOrder []common.HoldingPeriod,
	m map[common.HoldingPeriod]*report.HoldingPeriodItem,
	globalProfit decimal.Decimal,
) float64 {

	rangePnL := decimal.Zero

	for i := range holdingOrder {
		d, ok := m[holdingOrder[i]]
		if !ok {
			continue
		}

		if d.NetPnL.GreaterThan(decimal.Zero) {

			if i >= startIdx && i <= endIdx {
				rangePnL = rangePnL.Add(d.NetPnL)
			}
		}
	}

	if globalProfit.Equal(decimal.Zero) {
		return 0
	}

	return rangePnL.Div(globalProfit).Mul(decimal.NewFromInt(100)).InexactFloat64()
}

func getHoldingBroadLossShare(
	startIdx, endIdx int,
	holdingOrder []common.HoldingPeriod,
	m map[common.HoldingPeriod]*report.HoldingPeriodItem,
	globalLoss decimal.Decimal,
) float64 {
	rangeLoss := decimal.Zero

	for i := range holdingOrder {
		d, ok := m[holdingOrder[i]]
		if !ok {
			continue
		}

		if d.NetPnL.LessThan(decimal.Zero) {
			loss := d.NetPnL.Abs()

			if i >= startIdx && i <= endIdx {
				rangeLoss = rangeLoss.Add(loss)
			}
		}
	}

	if globalLoss.Equal(decimal.Zero) {
		return 0
	}

	return rangeLoss.Div(globalLoss).Mul(decimal.NewFromInt(100)).InexactFloat64()
}

func formatHoldingCategories(cats []common.HoldingCategory) string {
	if len(cats) == 1 {
		return string(cats[0])
	}
	if len(cats) == 2 {
		return string(cats[0]) + " and " + string(cats[1])
	}

	var parts []string
	for _, c := range cats[:len(cats)-1] {
		parts = append(parts, string(c))
	}

	return strings.Join(parts, ", ") + " and " + string(cats[len(cats)-1])
}

func calcMedian(trades []int) int {
	medianTrades := 0

	n := len(trades)
	if n > 0 {
		sort.Ints(trades)

		if n%2 == 1 {
			medianTrades = trades[n/2]
		} else {
			medianTrades = (trades[n/2-1] + trades[n/2]) / 2
		}
	}

	return medianTrades
}

func getPsychologyInsights(allPositions []*position.Position) []insight {
	insights := []insight{}

	// 1. Filter only CLOSED positions
	closed := make([]*position.Position, 0, len(allPositions))
	for _, p := range allPositions {
		if p.Status != position.StatusOpen && p.ClosedAt != nil {
			closed = append(closed, p)
		}
	}

	// Need at least 3 to compare sequences
	if len(closed) < 3 {
		return insights
	}

	// 2. Sort by ClosedAt ASC
	sort.Slice(closed, func(i, j int) bool {
		return closed[i].ClosedAt.Before(*closed[j].ClosedAt)
	})

	afterWin := make([]*position.Position, 0)
	afterLoss := make([]*position.Position, 0)

	for i := 1; i < len(closed); i++ {
		prev := closed[i-1]
		curr := closed[i]

		if prev.NetPnLAmount.GreaterThan(decimal.Zero) {
			afterWin = append(afterWin, curr)
		} else if prev.NetPnLAmount.LessThan(decimal.Zero) {
			afterLoss = append(afterLoss, curr)
		}
	}

	if len(afterWin) < BASE_MIN_TRADES || len(afterLoss) < BASE_MIN_TRADES {
		return insights
	}

	afterWinExp := position.GetGeneralStats(afterWin)
	afterLossExp := position.GetGeneralStats(afterLoss)
	baselineStats := position.GetGeneralStats(closed)

	// Post-loss deviation.
	lossWinRateDelta := common.PctChangeFloat(afterLossExp.WinRate, baselineStats.WinRate)
	lossPnLDelta := common.PctChangeDecimal(afterLossExp.Expectancy, baselineStats.Expectancy)

	// Post-win deviation.
	winWinRateDelta := common.PctChangeFloat(afterWinExp.WinRate, baselineStats.WinRate)
	winPnLDelta := common.PctChangeDecimal(afterWinExp.Expectancy, baselineStats.Expectancy)

	// Guard: ignore pnl-based signals if baseline expectancy is too small.
	if baselineStats.Expectancy.Abs().LessThan(decimal.NewFromFloat(1)) {
		lossPnLDelta = decimal.Zero
		winPnLDelta = decimal.Zero
	}

	isWinWinRateBad := winWinRateDelta < -MIN_WINRATE_DELTA
	isWinPnLBad := winPnLDelta.LessThan(decimal.NewFromFloat(-MIN_PNL_DELTA))

	isLossWinRateBad := lossWinRateDelta < -MIN_WINRATE_DELTA
	isLossPnLBad := lossPnLDelta.LessThan(decimal.NewFromFloat(-MIN_PNL_DELTA))

	var lossInsight *insight

	if isLossWinRateBad || isLossPnLBad {
		var desc string

		if isLossWinRateBad && isLossPnLBad {
			desc = "After a loss, your average PnL per trade drops by {pnl_delta} and your win rate drops by {winrate_delta}"
		} else if isLossWinRateBad {
			desc = "After a loss, your win rate drops by {winrate_delta}"
		} else {
			desc = "After a loss, your average PnL per trade drops by {pnl_delta}"
		}

		lossInsight = &insight{
			Type:        "psychology",
			Direction:   "negative",
			Title:       "Performance drops after losses",
			Description: desc,
			Tokens: map[string]token{
				"pnl_delta": {
					Value: common.AbsDecimal(lossPnLDelta).Mul(decimal.NewFromInt(100)).InexactFloat64(),
					Type:  "percentage",
					Tone:  "negative",
				},
				"winrate_delta": {
					Value: math.Abs(lossWinRateDelta * 100),
					Type:  "percentage",
					Tone:  "negative",
				},
			},
			Action: "Take a pause after a loss before your next trade",
		}

	}

	var winInsight *insight

	if isWinWinRateBad || isWinPnLBad {
		var desc string

		if isWinWinRateBad && isWinPnLBad {
			desc = "After a win, your average PnL per trade drops by {pnl_delta} and your win rate drops by {winrate_delta}"
		} else if isWinWinRateBad {
			desc = "After a win, your win rate drops by {winrate_delta}"
		} else {
			desc = "After a win, your average PnL per trade drops by {pnl_delta}"
		}

		winInsight = &insight{
			Type:        "psychology",
			Direction:   "negative",
			Title:       "Performance drops after wins",
			Description: desc,
			Tokens: map[string]token{
				"pnl_delta": {
					Value: common.AbsDecimal(winPnLDelta).Mul(decimal.NewFromInt(100)).InexactFloat64(),
					Type:  "percentage",
					Tone:  "negative",
				},
				"winrate_delta": {
					Value: math.Abs(winWinRateDelta * 100),
					Type:  "percentage",
					Tone:  "negative",
				},
			},
			Action: "Stay disciplined after a win before your next trade",
		}

	}

	if lossInsight == nil && winInsight == nil {
		return insights
	}

	if lossInsight != nil && winInsight == nil {
		insights = append(insights, *lossInsight)
		return insights
	}

	if winInsight != nil && lossInsight == nil {
		insights = append(insights, *winInsight)
		return insights
	}

	lossPnLDeltaFloat := common.AbsDecimal(lossPnLDelta).InexactFloat64()
	winPnLDeltaFloat := common.AbsDecimal(winPnLDelta).InexactFloat64()

	lossSeverity := math.Max(
		math.Abs(lossWinRateDelta),
		lossPnLDeltaFloat,
	)

	winSeverity := math.Max(
		math.Abs(winWinRateDelta),
		winPnLDeltaFloat,
	)

	if winSeverity > lossSeverity {
		insights = append(insights, *winInsight)
	} else {
		insights = append(insights, *lossInsight)
	}

	return insights
}
