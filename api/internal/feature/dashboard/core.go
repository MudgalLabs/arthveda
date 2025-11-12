package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type GeneralStats struct {
	WinRate  float64 `json:"win_rate"`
	LossRate float64 `json:"loss_rate"`

	GrossPnL       string          `json:"gross_pnl"`
	NetPnL         decimal.Decimal `json:"net_pnl"`
	Charges        string          `json:"charges"`
	AvgWin         string          `json:"avg_win"`
	AvgLoss        string          `json:"avg_loss"`
	MaxWin         string          `json:"max_win"`
	MaxLoss        string          `json:"max_loss"`
	AvgRFactor     string          `json:"avg_r_factor"`
	AvgWinRFactor  string          `json:"avg_win_r_factor"`
	AvgLossRFactor string          `json:"avg_loss_r_factor"`
	AvgWinROI      string          `json:"avg_win_roi"`
	AvgLossROI     string          `json:"avg_loss_roi"`

	WinStreak  int `json:"win_streak"`
	LossStreak int `json:"loss_streak"`

	WinsCount   int `json:"wins_count"`
	LossesCount int `json:"losses_count"`
}

func GetGeneralStats(positions []*position.Position) GeneralStats {
	if len(positions) == 0 {
		return GeneralStats{}
	}

	var winRate float64
	var grossPnL, netPnL, charges, avgRFactor, avgWinRFactor, avgLossRFactor, avgWinROI, avgLossROI, avgWin, avgLoss, maxWin, maxLoss decimal.Decimal
	var openTradesCount, settledTradesCount, winTradesCount, lossTradesCount, tradesWithRiskAmountCount int
	var maxWinStreak, maxLossStreak, currentWin, currentLoss int

	for _, p := range positions {
		// Calculate open trades count.
		// Will be used to calculate win rate.
		if p.Status == position.StatusOpen {
			openTradesCount++
		}

		// "Win" and "Breakeven" trades are considered winning trades
		// for the purpose of calculating win rate.
		if p.Status == position.StatusWin || p.Status == position.StatusBreakeven {
			winTradesCount++
		}

		grossPnL = grossPnL.Add(p.GrossPnLAmount)
		netPnL = netPnL.Add(p.NetPnLAmount)
		charges = charges.Add(p.TotalChargesAmount)

		if p.RiskAmount.GreaterThan(decimal.Zero) {
			tradesWithRiskAmountCount++
			avgRFactor = avgRFactor.Add(p.RFactor)

			switch p.Status {
			case position.StatusWin, position.StatusBreakeven:
				avgWinRFactor = avgWinRFactor.Add(p.RFactor)
				avgWinROI = avgWinROI.Add(p.NetReturnPercentage)
			case position.StatusLoss:
				avgLossRFactor = avgLossRFactor.Add(p.RFactor)
				avgLossROI = avgLossROI.Add(p.NetReturnPercentage)
			}
		}

		if p.Status == position.StatusWin {
			avgWin = avgWin.Add(p.NetPnLAmount)

			if p.NetPnLAmount.GreaterThan(maxWin) {
				maxWin = p.NetPnLAmount
			}
		}

		if p.Status == position.StatusLoss {
			avgLoss = avgLoss.Add(p.NetPnLAmount)

			if p.NetPnLAmount.LessThan(maxLoss) {
				maxLoss = p.NetPnLAmount
			}
		}

		// Calculate win/loss streaks
		switch p.Status {
		case position.StatusWin:
			currentWin++
			currentLoss = 0
		case position.StatusLoss:
			currentLoss++
			currentWin = 0
		default:
			currentWin = 0
			currentLoss = 0
		}

		maxWinStreak = max(maxWinStreak, currentWin)
		maxLossStreak = max(maxLossStreak, currentLoss)
	}

	// Trades that are not open are considered settled.
	settledTradesCount = len(positions) - openTradesCount
	// Trades that are settled and not winning are considered losing.
	lossTradesCount = settledTradesCount - winTradesCount

	if tradesWithRiskAmountCount > 0 {
		avgRFactor = avgRFactor.Div(decimal.NewFromInt(int64(tradesWithRiskAmountCount)))
	}

	if settledTradesCount > 0 {
		winRate = (float64(winTradesCount) / float64(settledTradesCount)) * 100.0
	}

	if winTradesCount > 0 {
		avgWinRFactor = avgWinRFactor.Div(decimal.NewFromInt(int64(winTradesCount)))
		avgWinROI = avgWinROI.Div(decimal.NewFromInt(int64(winTradesCount)))
		avgWin = avgWin.Div(decimal.NewFromInt(int64(winTradesCount)))
	}

	if lossTradesCount > 0 {
		avgLossRFactor = avgLossRFactor.Div(decimal.NewFromInt(int64(lossTradesCount)))
		avgLossROI = avgLossROI.Div(decimal.NewFromInt(int64(lossTradesCount)))
		avgLoss = avgLoss.Div(decimal.NewFromInt(int64(lossTradesCount)))
	}

	lossRate := 100.0 - winRate

	result := GeneralStats{
		WinRate:        winRate,
		LossRate:       lossRate,
		GrossPnL:       grossPnL.String(),
		NetPnL:         netPnL,
		Charges:        charges.String(),
		AvgRFactor:     avgRFactor.StringFixed(2),
		AvgWin:         avgWin.StringFixed(2),
		AvgLoss:        avgLoss.StringFixed(2),
		MaxWin:         maxWin.String(),
		MaxLoss:        maxLoss.String(),
		AvgWinRFactor:  avgWinRFactor.StringFixed(2),
		AvgLossRFactor: avgLossRFactor.StringFixed(2),
		AvgWinROI:      avgWinROI.StringFixed(2),
		AvgLossROI:     avgLossROI.StringFixed(2),
		WinStreak:      maxWinStreak,
		LossStreak:     maxLossStreak,
		WinsCount:      winTradesCount,
		LossesCount:    lossTradesCount,
	}

	return result
}

type pnlBucket struct {
	Label    string          `json:"label"`
	Start    time.Time       `json:"start"`
	End      time.Time       `json:"end"`
	NetPnL   decimal.Decimal `json:"net_pnl"`
	GrossPnL decimal.Decimal `json:"gross_pnl"`
	Charges  decimal.Decimal `json:"charges"`
}

// getCumulativePnLBuckets calculates cumulative realized PnL using pnL buckets.
func getCumulativePnLBuckets(positions []*position.Position, period common.BucketPeriod, start, end time.Time, loc *time.Location) []pnlBucket {
	pnlBuckets := getPnLBuckets(positions, period, start, end, loc)

	// Convert bucket PnL and charges to cumulative values with rounding
	for i := range pnlBuckets {
		if i > 0 {
			pnlBuckets[i].NetPnL = pnlBuckets[i].NetPnL.Add(pnlBuckets[i-1].NetPnL)
			pnlBuckets[i].GrossPnL = pnlBuckets[i].GrossPnL.Add(pnlBuckets[i-1].GrossPnL)
			pnlBuckets[i].Charges = pnlBuckets[i].Charges.Add(pnlBuckets[i-1].Charges)
		}
	}

	return pnlBuckets
}

func getPnLBuckets(positions []*position.Position, period common.BucketPeriod, start, end time.Time, loc *time.Location) []pnlBucket {
	if len(positions) == 0 {
		return []pnlBucket{}
	}

	positionByID := make(map[uuid.UUID]*position.Position)
	realisedStatsByTradeID := position.GetRealisedStatsUptoATradeByTradeID(positions)

	// Generate buckets
	buckets := common.GenerateBuckets(period, start, end, loc)
	results := make([]pnlBucket, len(buckets))
	for i, b := range buckets {
		results[i] = pnlBucket{
			Start:    b.Start,
			End:      b.End,
			Label:    b.Label(loc),
			NetPnL:   decimal.Zero,
			GrossPnL: decimal.Zero,
			Charges:  decimal.Zero,
		}
	}

	// Collect all trades and sort them by time
	var allTrades []*trade.Trade

	for _, pos := range positions {
		positionByID[pos.ID] = pos
		allTrades = append(allTrades, pos.Trades...)
	}

	sort.Slice(allTrades, func(i, j int) bool {
		return allTrades[i].Time.Before(allTrades[j].Time)
	})

	chargesByPositionID := make(map[uuid.UUID]decimal.Decimal)

	for _, t := range allTrades {
		// Find the active bucket for this trade
		var activeBucket *pnlBucket
		for i := range results {
			if !t.Time.Before(results[i].Start) && t.Time.Before(results[i].End) {
				activeBucket = &results[i]
				break
			}
		}

		if activeBucket == nil {
			continue // Skip trades outside the bucket range
		}

		stats := realisedStatsByTradeID[t.ID]

		chargesAmount, exists := chargesByPositionID[t.PositionID]
		if !exists {
			chargesByPositionID[t.PositionID] = decimal.Zero
			chargesAmount = decimal.Zero
		}

		grossPnL := t.RealisedGrossPnL
		charges := stats.ChargesAmount.Sub(chargesAmount)
		netPnL := grossPnL.Sub(charges)

		if stats.IsScaleOut {
			activeBucket.GrossPnL = activeBucket.GrossPnL.Add(grossPnL)
			activeBucket.NetPnL = activeBucket.NetPnL.Add(netPnL)
			activeBucket.Charges = activeBucket.Charges.Add(charges)

			chargesByPositionID[t.PositionID] = stats.ChargesAmount
		}
	}

	return results
}
