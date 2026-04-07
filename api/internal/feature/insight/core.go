package insight

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/report"
	"sort"

	"github.com/shopspring/decimal"
)

const BASE_MIN_TRADES = 5

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

		desc := "This hour contributes the most to your total PnL"

		if tradeBest != nil && tradeBest.Hour != mostProfits.Hour {
			desc += ", but your trades perform better at " + common.FormatHour(tradeBest.Hour)
		}

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "positive",
			Title:       "You make the most money at " + hourLabel,
			Description: desc,
			Action:      "Focus more on this hour",
		})
	}

	if leastProfits != nil && leastProfits.AvgPnL.LessThan(decimal.Zero) {
		hourLabel := common.FormatHour(leastProfits.Hour)

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "negative",
			Title:       "You lose the most at " + hourLabel,
			Description: "Your trades lose money during this hour and drag down your overall performance",
			Action:      "Consider avoiding this hour",
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

		desc := "Your trades perform {delta} better than your average during this hour"

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

		desc := "Your trades perform {delta} worse than your average during this hour"

		if tradeBest != nil && tradeBest.Hour != tradeWorst.Hour {
			desc += ", compared to stronger performance at " + common.FormatHour(tradeBest.Hour)
		}

		insights = append(insights, insight{
			Type:        "time_of_day",
			Direction:   "negative",
			Title:       "Your trade quality drops at " + hourLabel,
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

		desc := "You take many trades here, but your returns are weaker than your average"

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

		desc := "You don’t trade much here, but your trades perform well"

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
			Description: "This period contributes the bulk of your PnL",
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
			Description: "Your performance drops during this period",
			Action:      "Avoid trading in this window",
		})
	}

	return insights
}

func getHoldingDurationInsights(
	durations []report.HoldingPeriodItem,
	baseline decimal.Decimal,
) []insight {
	var mostProfits *report.HoldingPeriodItem
	var leastProfits *report.HoldingPeriodItem

	for i := range durations {
		d := &durations[i]

		if d.PositionsCount == 0 {
			continue
		}

		if mostProfits == nil || d.NetPnL.GreaterThan(mostProfits.NetPnL) {
			mostProfits = d
		}

		if leastProfits == nil || d.NetPnL.LessThan(leastProfits.NetPnL) {
			leastProfits = d
		}
	}

	insights := []insight{}

	if mostProfits != nil {
		label := common.FormatHoldingPeriod(mostProfits.Period)
		category := common.GetHoldingCategory(mostProfits.Period)

		insights = append(insights, insight{
			Type:        "holding_duration",
			Direction:   "positive",
			Title:       "You make the most money holding for " + label,
			Description: "This holding period contributes the most to your total PnL",
			Action:      getHoldingAction(category, "positive"),
		})
	}

	if leastProfits != nil {
		label := common.FormatHoldingPeriod(leastProfits.Period)
		category := common.GetHoldingCategory(leastProfits.Period)

		insights = append(insights, insight{
			Type:        "holding_duration",
			Direction:   "negative",
			Title:       "You lose the most when holding for " + label,
			Description: "Your trades lose money during this holding period and drag down your overall performance",
			Action:      getHoldingAction(category, "negative"),
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
