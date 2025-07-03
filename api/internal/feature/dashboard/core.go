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

	GrossPnL       string  `json:"gross_pnl"`
	NetPnL         string  `json:"net_pnl"`
	Charges        string  `json:"charges"`
	AvgWin         string  `json:"avg_win"`
	AvgLoss        string  `json:"avg_loss"`
	MaxWin         string  `json:"max_win"`
	MaxLoss        string  `json:"max_loss"`
	AvgRFactor     float64 `json:"avg_r_factor"`
	AvgWinRFactor  float64 `json:"avg_win_r_factor"`
	AvgLossRFactor float64 `json:"avg_loss_r_factor"`

	WinStreak  int `json:"win_streak"`
	LossStreak int `json:"loss_streak"`
}

func getGeneralStats(positions []*position.Position) generalStats {
	if len(positions) == 0 {
		return generalStats{}
	}

	var winRate float64
	var grossPnL, netPnL, charges, avgRFactor, avgWinRFactor, avgLossRFactor, avgWin, avgLoss, maxWin, maxLoss decimal.Decimal
	var openTradesCount, settledTradesCount, winTradesCount, lossTradesCount int
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
			avgRFactor = avgRFactor.Add(p.RFactor)

			switch p.Status {
			case position.StatusWin, position.StatusBreakeven:
				avgWinRFactor = avgWinRFactor.Add(p.RFactor)
			case position.StatusLoss:
				avgLossRFactor = avgLossRFactor.Add(p.RFactor)
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
		case "win":
			currentWin++
			currentLoss = 0
		case "loss":
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

	if settledTradesCount > 0 {
		winRate = (float64(winTradesCount) / float64(settledTradesCount)) * 100.0
		avgRFactor = avgRFactor.Div(decimal.NewFromInt(int64(settledTradesCount)))
	}

	if winTradesCount > 0 {
		avgWinRFactor = avgWinRFactor.Div(decimal.NewFromInt(int64(winTradesCount)))
		avgWin = avgWin.Div(decimal.NewFromInt(int64(winTradesCount)))
	}

	if lossTradesCount > 0 {
		avgLossRFactor = avgLossRFactor.Div(decimal.NewFromInt(int64(lossTradesCount)))
		avgLoss = avgLoss.Div(decimal.NewFromInt(int64(lossTradesCount)))
	}

	lossRate := 100.0 - winRate

	result := generalStats{
		WinRate:        winRate,
		LossRate:       lossRate,
		GrossPnL:       grossPnL.String(),
		NetPnL:         netPnL.String(),
		Charges:        charges.String(),
		AvgRFactor:     avgRFactor.Round(2).InexactFloat64(),
		AvgWin:         avgWin.String(),
		AvgLoss:        avgLoss.String(),
		MaxWin:         maxWin.String(),
		MaxLoss:        maxLoss.String(),
		AvgWinRFactor:  avgWinRFactor.Round(2).InexactFloat64(),
		AvgLossRFactor: avgLossRFactor.Round(2).InexactFloat64(),
		WinStreak:      maxWinStreak,
		LossStreak:     maxLossStreak,
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

// getCumulativePnLBuckets calculates cumulative realized PnL across time buckets
// (daily, weekly, or monthly) for the given positions and their associated trades.
//
// Notes:
// - `positions` includes all position that have trade(s) that fall within [start, end].
// - Trades are assumed to be in UTC.
// - Charges are considered in this calculation to compute NetPnL.
// - Uses `position.ApplyTradeToPosition` to calculate realized PnL from partial or full exits.
func getCumulativePnLBuckets(positions []*position.Position, period common.BucketPeriod, start, end time.Time, loc *time.Location) []pnlBucket {
	results := getPnLBuckets(positions, period, start, end, loc)

	// Convert bucket PnL and charges to cumulative values with rounding
	for i := range results {
		if i > 0 {
			results[i].NetPnL = results[i].NetPnL.Add(results[i-1].NetPnL)
			results[i].GrossPnL = results[i].GrossPnL.Add(results[i-1].GrossPnL)
			results[i].Charges = results[i].Charges.Add(results[i-1].Charges)
		}
		// Round final cumulative values to match database precision
		results[i].NetPnL = results[i].NetPnL.Round(2)
		results[i].GrossPnL = results[i].GrossPnL.Round(2)
		results[i].Charges = results[i].Charges.Round(2)
	}

	return results
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

	// Collect all trades and sort them by time
	var allTrades []struct {
		Trade    *trade.Trade
		Position *position.Position
	}
	for _, pos := range positions {
		for _, t := range pos.Trades {
			allTrades = append(allTrades, struct {
				Trade    *trade.Trade
				Position *position.Position
			}{Trade: t, Position: pos})
		}
	}
	sort.Slice(allTrades, func(i, j int) bool {
		return allTrades[i].Trade.Time.Before(allTrades[j].Trade.Time)
	})

	type state struct {
		AvgPrice     decimal.Decimal
		Quantity     decimal.Decimal
		TotalCost    decimal.Decimal
		TotalCharges decimal.Decimal
		Direction    position.Direction
	}

	// Process trades in time order
	// Track state of each position
	stateByPositionIDMap := make(map[uuid.UUID]state)

	for _, entry := range allTrades {
		t := entry.Trade
		pos := entry.Position

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

		// Get or initialize the position s
		s, exists := stateByPositionIDMap[pos.ID]
		if !exists {
			s = state{
				AvgPrice:     decimal.Zero,
				Quantity:     decimal.Zero,
				TotalCost:    decimal.Zero,
				TotalCharges: decimal.Zero,
				Direction:    position.DirectionLong, // Default to long
			}
			stateByPositionIDMap[pos.ID] = s
		}

		// Apply the trade to the position and compute PnL
		newAvgPrice, newQty, newDirection, realizedPnL, newTotalCost, newTotalCharges := position.ApplyTradeToPosition(
			s.AvgPrice,
			s.Quantity,
			s.TotalCost,
			s.TotalCharges,
			s.Direction,
			t.Quantity,
			t.Price,
			t.ChargesAmount,
			t.Kind,
		)

		// Update the position state
		stateByPositionIDMap[pos.ID] = state{
			AvgPrice:     newAvgPrice,
			Quantity:     newQty,
			TotalCost:    newTotalCost,
			TotalCharges: newTotalCharges,
			Direction:    newDirection,
		}

		// Subtract trade charges from realizedPnL to calculate NetPnL
		netPnL := realizedPnL.Sub(t.ChargesAmount)

		// Round to match database precision (NUMERIC(14,2))
		netPnL = netPnL.Round(2)
		realizedPnL = realizedPnL.Round(2)         // Round GrossPnL for consistency
		t.ChargesAmount = t.ChargesAmount.Round(2) // Round charges for consistency

		// Add PnL and charges to the bucket (this is bucket-specific, not cumulative yet)
		activeBucket.NetPnL = activeBucket.NetPnL.Add(netPnL)
		activeBucket.GrossPnL = activeBucket.GrossPnL.Add(realizedPnL)
		activeBucket.Charges = activeBucket.Charges.Add(t.ChargesAmount)
	}

	return results
}
