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
	// --- Core ---
	NetPnL   decimal.Decimal `json:"net_pnl"`
	GrossPnL string          `json:"gross_pnl"`
	Charges  string          `json:"charges"`

	// --- Performance ---
	WinRate  float64 `json:"win_rate"`
	LossRate float64 `json:"loss_rate"`

	ProfitFactor    decimal.Decimal `json:"profit_factor"`
	Expectancy      decimal.Decimal `json:"expectancy"`
	AvgWinLossRatio decimal.Decimal `json:"avg_win_loss_ratio"`

	// --- Win / Loss Stats ---
	AvgWin  string `json:"avg_win"`
	AvgLoss string `json:"avg_loss"`
	MaxWin  string `json:"max_win"`
	MaxLoss string `json:"max_loss"`

	TotalNetWinAmount  decimal.Decimal `json:"total_net_win_amount"`
	TotalNetLossAmount decimal.Decimal `json:"total_net_loss_amount"`

	// --- R Metrics ---
	GrossRFactor    string `json:"gross_r_factor"`
	NetRFactor      string `json:"net_r_factor"`
	AvgRFactor      string `json:"avg_r_factor"`
	AvgGrossRFactor string `json:"avg_gross_r_factor"`

	AvgWinRFactor  string `json:"avg_win_r_factor"`
	AvgLossRFactor string `json:"avg_loss_r_factor"`

	// --- ROI ---
	AvgWinROI  string `json:"avg_win_roi"`
	AvgLossROI string `json:"avg_loss_roi"`

	// --- Streaks ---
	WinStreak  int `json:"win_streak"`
	LossStreak int `json:"loss_streak"`

	// --- Counts ---
	TotalTradesCount int `json:"total_trades_count"`
	WinsCount        int `json:"wins_count"`
	LossesCount      int `json:"losses_count"`
	BreakevensCount  int `json:"breakevens_count"`
}

func GetGeneralStats(positions []*position.Position) GeneralStats {
	if len(positions) == 0 {
		return GeneralStats{}
	}

	var (
		winRate float64

		grossPnL, netPnL, charges decimal.Decimal

		grossRFactor, netRFactor      decimal.Decimal
		avgRFactor, avgGrossRFactor   decimal.Decimal
		avgWinRFactor, avgLossRFactor decimal.Decimal
		avgWinROI, avgLossROI         decimal.Decimal

		avgWin, avgLoss decimal.Decimal
		maxWin, maxLoss decimal.Decimal

		totalNetWinAmount, totalNetLossAmount decimal.Decimal

		expectancy      decimal.Decimal
		avgWinLossRatio decimal.Decimal

		openTradesCount, settledTradesCount                   int
		winTradesCount, lossTradesCount, breakevenTradesCount int
		tradesWithRiskAmountCount                             int

		maxWinStreak, maxLossStreak int
		currentWin, currentLoss     int
	)

	for _, p := range positions {
		if p.Status == position.StatusOpen {
			openTradesCount++
			continue
		}

		settledTradesCount++

		grossPnL = grossPnL.Add(p.GrossPnLAmount)
		netPnL = netPnL.Add(p.NetPnLAmount)
		charges = charges.Add(p.TotalChargesAmount)

		// --- R-based metrics ---
		if p.RiskAmount.GreaterThan(decimal.Zero) {
			tradesWithRiskAmountCount++

			grossRFactor = grossRFactor.Add(p.GrossRFactor)
			netRFactor = netRFactor.Add(p.RFactor)

			avgGrossRFactor = avgGrossRFactor.Add(p.GrossRFactor)
			avgRFactor = avgRFactor.Add(p.RFactor)

			if p.NetPnLAmount.GreaterThan(decimal.Zero) {
				avgWinRFactor = avgWinRFactor.Add(p.RFactor)
				avgWinROI = avgWinROI.Add(p.NetReturnPercentage)
			}

			if p.NetPnLAmount.LessThan(decimal.Zero) {
				avgLossRFactor = avgLossRFactor.Add(p.RFactor)
				avgLossROI = avgLossROI.Add(p.NetReturnPercentage)
			}
		}

		// --- PnL-based classification ---
		if p.NetPnLAmount.GreaterThan(decimal.Zero) {
			winTradesCount++

			totalNetWinAmount = totalNetWinAmount.Add(p.NetPnLAmount)
			avgWin = avgWin.Add(p.NetPnLAmount)

			if p.NetPnLAmount.GreaterThan(maxWin) {
				maxWin = p.NetPnLAmount
			}

			currentWin++
			currentLoss = 0
		} else if p.NetPnLAmount.LessThan(decimal.Zero) {
			lossTradesCount++

			lossAbs := p.NetPnLAmount.Abs()
			totalNetLossAmount = totalNetLossAmount.Add(lossAbs)
			avgLoss = avgLoss.Add(p.NetPnLAmount)

			if p.NetPnLAmount.LessThan(maxLoss) {
				maxLoss = p.NetPnLAmount
			}

			currentLoss++
			currentWin = 0
		} else {
			// breakeven
			breakevenTradesCount++
			currentWin = 0
			currentLoss = 0
		}

		maxWinStreak = max(maxWinStreak, currentWin)
		maxLossStreak = max(maxLossStreak, currentLoss)
	}

	// --- Averages ---
	if tradesWithRiskAmountCount > 0 {
		div := decimal.NewFromInt(int64(tradesWithRiskAmountCount))
		avgRFactor = avgRFactor.Div(div)
		avgGrossRFactor = avgGrossRFactor.Div(div)
	}

	if winTradesCount > 0 {
		div := decimal.NewFromInt(int64(winTradesCount))
		avgWin = avgWin.Div(div)
		avgWinRFactor = avgWinRFactor.Div(div)
		avgWinROI = avgWinROI.Div(div)
	}

	if lossTradesCount > 0 {
		div := decimal.NewFromInt(int64(lossTradesCount))
		avgLoss = avgLoss.Div(div)
		avgLossRFactor = avgLossRFactor.Div(div)
		avgLossROI = avgLossROI.Div(div)
	}

	// --- Win rate ---
	if (winTradesCount + lossTradesCount) > 0 {
		winRate = (float64(winTradesCount) / float64(winTradesCount+lossTradesCount)) * 100
	}
	lossRate := 100.0 - winRate

	// --- Profit Factor ---
	var profitFactor decimal.Decimal
	if !totalNetLossAmount.IsZero() {
		profitFactor = totalNetWinAmount.Div(totalNetLossAmount)
	}

	// --- Expectancy ---
	if settledTradesCount > 0 {
		expectancy = netPnL.Div(decimal.NewFromInt(int64(settledTradesCount)))
	}

	// --- Avg Win / Loss ratio ---
	if !avgLoss.IsZero() {
		avgWinLossRatio = avgWin.Div(avgLoss.Abs())
	}

	return GeneralStats{
		WinRate:  winRate,
		LossRate: lossRate,
		GrossPnL: grossPnL.StringFixed(2),
		NetPnL:   netPnL,
		Charges:  charges.Mul(decimal.NewFromInt(-1)).StringFixed(2),

		GrossRFactor:    grossRFactor.StringFixed(2),
		NetRFactor:      netRFactor.StringFixed(2),
		AvgRFactor:      avgRFactor.StringFixed(2),
		AvgGrossRFactor: avgGrossRFactor.StringFixed(2),

		AvgWin:  avgWin.StringFixed(2),
		AvgLoss: avgLoss.StringFixed(2),
		MaxWin:  maxWin.String(),
		MaxLoss: maxLoss.String(),

		AvgWinRFactor:  avgWinRFactor.StringFixed(2),
		AvgLossRFactor: avgLossRFactor.StringFixed(2),
		AvgWinROI:      avgWinROI.StringFixed(2),
		AvgLossROI:     avgLossROI.StringFixed(2),

		WinStreak:  maxWinStreak,
		LossStreak: maxLossStreak,

		TotalTradesCount: winTradesCount + lossTradesCount + breakevenTradesCount,
		WinsCount:        winTradesCount,
		LossesCount:      lossTradesCount,
		BreakevensCount:  breakevenTradesCount,

		ProfitFactor:       profitFactor,
		TotalNetWinAmount:  totalNetWinAmount,
		TotalNetLossAmount: totalNetLossAmount,

		Expectancy:      expectancy,
		AvgWinLossRatio: avgWinLossRatio,
	}
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
