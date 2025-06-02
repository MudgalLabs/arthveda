package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type CumulativePnLBucket struct {
	Start time.Time       `json:"start"`
	End   time.Time       `json:"end"`
	PnL   decimal.Decimal `json:"pnl"`
}

// GenerateCumulativePnLBuckets calculates cumulative realized PnL across time buckets
// (daily, weekly, or monthly) for the given positions and their associated trades.
//
// Assumptions:
// - `positions` include all trades that fall within [start, end] for all buckets.
// - Trades are assumed to be in UTC.
// - Charges are not considered in this calculation.
// - Uses `position.Compute` to calculate realized PnL from partial or full exits.
// - Cumulative PnL is calculated in order of buckets, and each bucket includes PnL from trades in that time range.
func GenerateCumulativePnLBuckets(positions []*position.Position, period common.BucketPeriod, start, end time.Time) []CumulativePnLBucket {
	buckets := common.GenerateBuckets(period, start, end)
	results := make([]CumulativePnLBucket, len(buckets))

	var cumulativePnL decimal.Decimal

	for i, b := range buckets {
		var bucketTradesByPosition = map[uuid.UUID][]*trade.Trade{}

		// Filter trades from all positions that fall within this bucket
		for _, pos := range positions {
			var tradesInBucket []*trade.Trade

			for _, t := range pos.Trades {
				if !t.Time.Before(b.Start) && t.Time.Before(b.End) {
					tradesInBucket = append(tradesInBucket, t)
				}
			}

			if len(tradesInBucket) > 0 {
				bucketTradesByPosition[pos.ID] = tradesInBucket
			}
		}

		// If no trades fall in this bucket, carry forward the cumulative value
		if len(bucketTradesByPosition) == 0 {
			results[i] = CumulativePnLBucket{
				Start: b.Start,
				End:   b.End,
				PnL:   cumulativePnL,
			}
			continue
		}

		var pnlForThisBucket decimal.Decimal

		// Compute realized PnL for each set of trades grouped by position
		for _, pos := range positions {
			trades := bucketTradesByPosition[pos.ID]
			if len(trades) == 0 {
				continue
			}

			result := position.Compute(position.ComputePayload{
				RiskAmount: pos.RiskAmount,
				Trades:     position.ConvertTradesToCreatePayload(trades),
			})

			pnlForThisBucket = pnlForThisBucket.Add(result.NetPnLAmount)
		}

		cumulativePnL = cumulativePnL.Add(pnlForThisBucket)

		results[i] = CumulativePnLBucket{
			Start: b.Start,
			End:   b.End,
			PnL:   cumulativePnL,
		}
	}

	return results
}
