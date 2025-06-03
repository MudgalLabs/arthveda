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
	Start time.Time       `json:"start"`
	End   time.Time       `json:"end"`
	PnL   decimal.Decimal `json:"pnl"`
	Label string          `json:"label"`
}

// generateCumulativePnLBuckets calculates cumulative realized PnL across time buckets
// (daily, weekly, or monthly) for the given positions and their associated trades.
//
// Notes:
// - `positions` includes all position that have trade(s) that fall within [start, end].
// - Trades are assumed to be in UTC.
// - Charges are considered in this calculation to compute NetPnL.
// - Uses `position.ApplyTradeToPosition` to calculate realized PnL from partial or full exits.
func generateCumulativePnLBuckets(positions []*position.Position, period common.BucketPeriod, start, end time.Time) []CumulativePnLBucket {
	if len(positions) == 0 {
		return []CumulativePnLBucket{}
	}

	// Generate buckets
	buckets := common.GenerateBuckets(period, start, end)
	results := make([]CumulativePnLBucket, len(buckets))
	for i, b := range buckets {
		results[i] = CumulativePnLBucket{
			Start: b.Start,
			End:   b.End,
			Label: b.Label(),
			PnL:   decimal.Zero,
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

		// Add net PnL to the bucket (this is bucket-specific PnL, not cumulative yet)
		activeBucket.PnL = activeBucket.PnL.Add(netPnL)
	}

	// Convert bucket PnL to cumulative PnL with rounding
	for i := range results {
		if i > 0 {
			results[i].PnL = results[i].PnL.Add(results[i-1].PnL)
		}
		// Round final cumulative value to match database precision
		results[i].PnL = results[i].PnL.Round(2)
	}

	return results
}
