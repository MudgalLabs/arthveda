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

type CumulativePnLBucket struct {
	Label    string          `json:"label"`
	Start    time.Time       `json:"start"`
	End      time.Time       `json:"end"`
	NetPnL   decimal.Decimal `json:"net_pnl"`
	GrossPnL decimal.Decimal `json:"gross_pnl"`
	Charges  decimal.Decimal `json:"charges"`
}

// getCumulativePnL calculates cumulative realized PnL across time buckets
// (daily, weekly, or monthly) for the given positions and their associated trades.
//
// Notes:
// - `positions` includes all position that have trade(s) that fall within [start, end].
// - Trades are assumed to be in UTC.
// - Charges are considered in this calculation to compute NetPnL.
// - Uses `position.ApplyTradeToPosition` to calculate realized PnL from partial or full exits.
func getCumulativePnL(positions []*position.Position, period common.BucketPeriod, start, end time.Time) []CumulativePnLBucket {
	if len(positions) == 0 {
		return []CumulativePnLBucket{}
	}

	// Generate buckets
	buckets := common.GenerateBuckets(period, start, end)
	results := make([]CumulativePnLBucket, len(buckets))
	for i, b := range buckets {
		results[i] = CumulativePnLBucket{
			Start:    b.Start,
			End:      b.End,
			Label:    b.Label(),
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

	// Process trades in time order
	positionStates := make(map[uuid.UUID]struct {
		AvgPrice     decimal.Decimal
		Quantity     decimal.Decimal
		TotalCost    decimal.Decimal
		TotalCharges decimal.Decimal
		Direction    position.Direction
	}) // Track state of each position

	for _, entry := range allTrades {
		t := entry.Trade
		pos := entry.Position

		// Find the active bucket for this trade
		var activeBucket *CumulativePnLBucket
		for i := range results {
			if !t.Time.Before(results[i].Start) && t.Time.Before(results[i].End) {
				activeBucket = &results[i]
				break
			}
		}

		if activeBucket == nil {
			continue // Skip trades outside the bucket range
		}

		// Get or initialize the position state
		state, exists := positionStates[pos.ID]
		if !exists {
			state = struct {
				AvgPrice     decimal.Decimal
				Quantity     decimal.Decimal
				TotalCost    decimal.Decimal
				TotalCharges decimal.Decimal
				Direction    position.Direction
			}{
				AvgPrice:     decimal.Zero,
				Quantity:     decimal.Zero,
				TotalCost:    decimal.Zero,
				TotalCharges: decimal.Zero,
				Direction:    position.DirectionLong, // Default to long
			}
			positionStates[pos.ID] = state
		}

		// Apply the trade to the position and compute PnL
		newAvgPrice, newQty, newDirection, realizedPnL, newTotalCost, newTotalCharges := position.ApplyTradeToPosition(
			state.AvgPrice,
			state.Quantity,
			state.TotalCost,
			state.TotalCharges,
			state.Direction,
			t.Quantity,
			t.Price,
			t.ChargesAmount,
			t.Kind,
		)

		// Update the position state
		positionStates[pos.ID] = struct {
			AvgPrice     decimal.Decimal
			Quantity     decimal.Decimal
			TotalCost    decimal.Decimal
			TotalCharges decimal.Decimal
			Direction    position.Direction
		}{
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

type streaks struct {
	WinStreak  int `json:"win_streak"`
	LossStreak int `json:"loss_streak"`
}

func getWinAndLossStreaks(sortedPositions []*position.Position) streaks {
	var maxWinStreak, maxLossStreak, currentWin, currentLoss int

	for _, pos := range sortedPositions {
		switch pos.Status {
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

	return streaks{
		WinStreak:  maxWinStreak,
		LossStreak: maxLossStreak,
	}
}
