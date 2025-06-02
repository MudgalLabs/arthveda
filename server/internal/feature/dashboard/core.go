package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"fmt"
	"time"

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
// Assumptions:
// - `positions` include all trades that fall within [start, end] for all buckets.
// - Trades are assumed to be in UTC.
// - Charges are not considered in this calculation.
// - Uses `position.Compute` to calculate realized PnL from partial or full exits.
// - Cumulative PnL is calculated in order of buckets, and each bucket includes PnL from trades in that time range.
func generateCumulativePnLBuckets(positions []*position.Position, period common.BucketPeriod, start, end time.Time) []CumulativePnLBucket {
	if len(positions) == 0 {
		return nil
	}

	buckets := common.GenerateBuckets(period, start, end)
	results := make([]CumulativePnLBucket, len(buckets))

	var cumulativePnL decimal.Decimal

	for i, b := range buckets {
		var pnlForThisBucket decimal.Decimal

		for _, pos := range positions {
			var tradesInBucket []*trade.Trade

			// Collect trades for this position that fall into the current bucket
			for _, t := range pos.Trades {
				if !t.Time.Before(b.Start) && !t.Time.After(b.End) {
					tradesInBucket = append(tradesInBucket, t)
				}
			}

			if len(tradesInBucket) == 0 {
				fmt.Println("No trades in bucket for position:", pos.ID, "Bucket:", b.Label(), "Actual:", len(pos.Trades))
				continue
			}

			// Compute NetPnL (includes charges from each trade)
			result := position.Compute(position.ComputePayload{
				RiskAmount: pos.RiskAmount,
				Trades:     position.ConvertTradesToCreatePayload(tradesInBucket),
			})

			pnlForThisBucket = pnlForThisBucket.Add(result.NetPnLAmount)
		}

		cumulativePnL = cumulativePnL.Add(pnlForThisBucket)

		results[i] = CumulativePnLBucket{
			Start: b.Start,
			End:   b.End,
			PnL:   cumulativePnL,
			Label: b.Label(), // e.g. "2024-05-01" or "Week 18"
		}
	}

	return results
}
