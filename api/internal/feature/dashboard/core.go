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

type generalStats struct {
	WinRate  float64 `json:"win_rate"`
	LossRate float64 `json:"loss_rate"`

	GrossPnL       string `json:"gross_pnl"`
	NetPnL         string `json:"net_pnl"`
	Charges        string `json:"charges"`
	AvgWin         string `json:"avg_win"`
	AvgLoss        string `json:"avg_loss"`
	MaxWin         string `json:"max_win"`
	MaxLoss        string `json:"max_loss"`
	AvgRFactor     string `json:"avg_r_factor"`
	AvgWinRFactor  string `json:"avg_win_r_factor"`
	AvgLossRFactor string `json:"avg_loss_r_factor"`

	WinStreak  int `json:"win_streak"`
	LossStreak int `json:"loss_streak"`

	WinsCount   int `json:"wins_count"`
	LossesCount int `json:"losses_count"`
}

func getGeneralStats(positions []*position.Position) generalStats {
	if len(positions) == 0 {
		return generalStats{}
	}

	var winRate float64
	var grossPnL, netPnL, charges, avgRFactor, avgWinRFactor, avgLossRFactor, avgWin, avgLoss, maxWin, maxLoss decimal.Decimal
	var openTradesCount, settledTradesCount, winTradesCount, lossTradesCount, tradesWithRiskAmountCount int
	var maxWinStreak, maxLossStreak, currentWin, currentLoss int

	// Initialize maxLoss to zero instead of default (for proper comparison)
	maxLoss = decimal.Zero

	for _, p := range positions {
		// Calculate open trades count.
		// Will be used to calculate win rate.
		if p.Status == position.StatusOpen {
			openTradesCount++
			continue // Skip further processing for open positions
		}

		// "Win" and "Breakeven" trades are considered winning trades
		// for the purpose of calculating win rate.
		isWin := p.Status == position.StatusWin || p.Status == position.StatusBreakeven
		isLoss := p.Status == position.StatusLoss

		if isWin {
			winTradesCount++
		}

		// Accumulate PnL values for all closed positions
		grossPnL = grossPnL.Add(p.GrossPnLAmount)
		netPnL = netPnL.Add(p.NetPnLAmount)
		charges = charges.Add(p.TotalChargesAmount)

		// Process R-Factor calculations
		if p.RiskAmount.GreaterThan(decimal.Zero) {
			tradesWithRiskAmountCount++
			avgRFactor = avgRFactor.Add(p.RFactor)

			if isWin {
				avgWinRFactor = avgWinRFactor.Add(p.RFactor)
			} else if isLoss {
				avgLossRFactor = avgLossRFactor.Add(p.RFactor)
			}
		}

		// Process win/loss specific calculations
		if isWin {
			avgWin = avgWin.Add(p.NetPnLAmount)
			if p.NetPnLAmount.GreaterThan(maxWin) {
				maxWin = p.NetPnLAmount
			}
		} else if isLoss {
			avgLoss = avgLoss.Add(p.NetPnLAmount)
			if p.NetPnLAmount.LessThan(maxLoss) {
				maxLoss = p.NetPnLAmount
			}
		}

		// Calculate win/loss streaks
		if isWin {
			currentWin++
			currentLoss = 0
			if currentWin > maxWinStreak {
				maxWinStreak = currentWin
			}
		} else if isLoss {
			currentLoss++
			currentWin = 0
			if currentLoss > maxLossStreak {
				maxLossStreak = currentLoss
			}
		} else {
			currentWin = 0
			currentLoss = 0
		}
	}

	// Trades that are not open are considered settled.
	settledTradesCount = len(positions) - openTradesCount
	// Trades that are settled and not winning are considered losing.
	lossTradesCount = settledTradesCount - winTradesCount

	// Calculate averages once at the end
	if tradesWithRiskAmountCount > 0 {
		divisor := decimal.NewFromInt(int64(tradesWithRiskAmountCount))
		avgRFactor = avgRFactor.Div(divisor)
	}

	if settledTradesCount > 0 {
		winRate = (float64(winTradesCount) / float64(settledTradesCount)) * 100.0
	}

	if winTradesCount > 0 {
		divisor := decimal.NewFromInt(int64(winTradesCount))
		avgWinRFactor = avgWinRFactor.Div(divisor)
		avgWin = avgWin.Div(divisor)
	}

	if lossTradesCount > 0 {
		divisor := decimal.NewFromInt(int64(lossTradesCount))
		avgLossRFactor = avgLossRFactor.Div(divisor)
		avgLoss = avgLoss.Div(divisor)
	}

	lossRate := 100.0 - winRate

	result := generalStats{
		WinRate:        winRate,
		LossRate:       lossRate,
		GrossPnL:       grossPnL.String(),
		NetPnL:         netPnL.String(),
		Charges:        charges.String(),
		AvgRFactor:     avgRFactor.StringFixed(2),
		AvgWin:         avgWin.String(),
		AvgLoss:        avgLoss.String(),
		MaxWin:         maxWin.String(),
		MaxLoss:        maxLoss.String(),
		AvgWinRFactor:  avgWinRFactor.StringFixed(2),
		AvgLossRFactor: avgLossRFactor.StringFixed(2),
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

	// Pre-calculate total trades count for pre-allocation
	totalTrades := 0
	for _, pos := range positions {
		totalTrades += len(pos.Trades)
	}

	// Pre-allocate slice with exact capacity to avoid reallocation
	allTrades := make([]*trade.Trade, 0, totalTrades)

	for _, pos := range positions {
		allTrades = append(allTrades, pos.Trades...)
	}

	// Sort trades by time once
	sort.Slice(allTrades, func(i, j int) bool {
		return allTrades[i].Time.Before(allTrades[j].Time)
	})

	// Compute realised stats once for all positions
	realisedStatsByTradeID := position.GetRealisedStatsUptoATradeByTradeID(positions)

	// Pre-allocate charge tracking map with estimated capacity
	chargesByPositionID := make(map[uuid.UUID]decimal.Decimal, len(positions))

	// Optimization: Use binary search to find bucket index instead of linear search
	findBucketIndex := func(tradeTime time.Time) int {
		// Binary search for the correct bucket
		left, right := 0, len(results)-1
		for left <= right {
			mid := (left + right) / 2
			if tradeTime.Before(results[mid].Start) {
				right = mid - 1
			} else if !tradeTime.Before(results[mid].End) {
				left = mid + 1
			} else {
				return mid
			}
		}
		return -1 // Not found
	}

	for _, t := range allTrades {
		// Binary search for active bucket (O(log n) instead of O(n))
		bucketIdx := findBucketIndex(t.Time)
		if bucketIdx == -1 {
			continue // Skip trades outside the bucket range
		}

		activeBucket := &results[bucketIdx]
		stats := realisedStatsByTradeID[t.ID]

		// Get previous charges or zero (map returns zero value if key doesn't exist)
		chargesAmount := chargesByPositionID[t.PositionID]

		grossPnL := t.RealisedGrossPnL
		charges := stats.ChargesAmount.Sub(chargesAmount)
		netPnL := grossPnL.Sub(charges)

		if stats.IsScaleOut {
			activeBucket.GrossPnL = activeBucket.GrossPnL.Add(grossPnL)
			activeBucket.NetPnL = activeBucket.NetPnL.Add(netPnL)
			activeBucket.Charges = activeBucket.Charges.Add(charges)

			// Update the charges for this position
			chargesByPositionID[t.PositionID] = stats.ChargesAmount
		}
	}

	return results
}
