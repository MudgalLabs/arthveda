package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
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
}

func getGeneralStats(positions []*position.Position, end time.Time, loc *time.Location) generalStats {
	if len(positions) == 0 {
		return generalStats{}
	}

	originalPosByID := map[uuid.UUID]*position.Position{}

	// These are the trades that we will use to compute the stats.
	// We will only consider trades that are before or equal to the end date.
	// We will also create a copy of the positions so that we don't modify the original positions
	// and their trades. This is important because we will be calling "Compute" on the positions
	// to calculate the realised PnL and other stats, and we don't want to modify the original positions.
	positionsWithTradesUptoEnd := []position.Position{}

	// We need to compute the Position stats based on the trades that fall within the date range.
	// So we will go through all positions and their trades,
	// and call "Compute" up until we don't reach a trade that's time is after the end date.
	// If we reach a trade that is after the end date, we will stop processing the position.

	for _, p := range positions {
		originalPosByID[p.ID] = p
		positionCopy := *p
		trades := []*trade.Trade{}

		atLeastOneTradeWasRealisingPnL := false

		// Apply trades to the position to calculate realised PnL.
		// This will also update the position's GrossPnLAmount, NetPnLAmount
		// and TotalChargesAmount fields.
		for _, t := range p.Trades {
			if t.Time.In(loc).Before(end) || t.Time.In(loc).Equal(end) {
				trades = append(trades, t)

				if position.IsTradeRealisingPnL(t, p) {
					atLeastOneTradeWasRealisingPnL = true
				}
			}
		}

		positionCopy.Trades = trades

		if atLeastOneTradeWasRealisingPnL {
			positionsWithTradesUptoEnd = append(positionsWithTradesUptoEnd, positionCopy)
		}
	}

	// Let's call "Compute" on positionsWithTradesUptoEnd
	// to calculate the realised PnL and other stats.

	for i, p := range positionsWithTradesUptoEnd {
		payload := position.ComputePayload{
			Trades:     position.ConvertTradesToCreatePayload(p.Trades),
			RiskAmount: p.RiskAmount,
		}

		computeResult, err := position.Compute(payload)
		if err != nil {
			// If we fail silently and continue.
			logger.Get().Errorw("Failed to compute position", "error", err, "symbol", p.Symbol, "opened_at", p.OpenedAt)
			continue
		}

		position.ApplyComputeResultToPosition(&p, computeResult)
		positionsWithTradesUptoEnd[i] = p
	}

	// chargesDiffTotal := decimal.Zero
	// chargesDiffCount := 0

	// for _, p := range positionsWithTradesUptoEnd {
	// 	origPos, exists := originalPosByID[p.ID]
	// 	if !exists {
	// 		panic("gg")
	// 	}

	// 	if !origPos.GrossPnLAmount.Equal(p.GrossPnLAmount) {
	// 		fmt.Printf("Position %s has different GrossPnLAmount: original=%s, computed=%s\n",
	// 			origPos.ID, origPos.GrossPnLAmount.String(), p.GrossPnLAmount.String())
	// 	}

	// 	if !origPos.TotalChargesAmount.Equal(p.TotalChargesAmount) {
	// 		fmt.Printf("Position %s has different TotalChargesAmount: original=%s, computed=%s\n",
	// 			origPos.ID, origPos.TotalChargesAmount.String(), p.TotalChargesAmount.String())
	// 		diff := origPos.TotalChargesAmount.Sub(p.TotalChargesAmount).Abs()
	// 		chargesDiffTotal = chargesDiffTotal.Add(diff)
	// 		chargesDiffCount++
	// 	}
	// }

	// fmt.Printf("Total original positions: %d\n", len(originalPosByID))
	// fmt.Printf("Total positions with trades up to end: %d\n", len(positionsWithTradesUptoEnd))
	// fmt.Printf("Total charges difference across %d positions: %s\n", chargesDiffCount, chargesDiffTotal.String())

	var winRate float64
	var grossPnL, netPnL, charges, avgRFactor, avgWinRFactor, avgLossRFactor, avgWin, avgLoss, maxWin, maxLoss decimal.Decimal
	var openTradesCount, settledTradesCount, winTradesCount, lossTradesCount int
	var maxWinStreak, maxLossStreak, currentWin, currentLoss int

	for _, p := range positionsWithTradesUptoEnd {
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
	settledTradesCount = len(positionsWithTradesUptoEnd) - openTradesCount
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
		AvgRFactor:     avgRFactor.StringFixed(2),
		AvgWin:         avgWin.String(),
		AvgLoss:        avgLoss.String(),
		MaxWin:         maxWin.String(),
		MaxLoss:        maxLoss.String(),
		AvgWinRFactor:  avgWinRFactor.StringFixed(2),
		AvgLossRFactor: avgLossRFactor.StringFixed(2),
		WinStreak:      maxWinStreak,
		LossStreak:     maxLossStreak,
	}

	return result
}

type tradeWithRealisedStats struct {
	Trade         trade.Trade                      `json:"trade"`
	RealisedStats position.RealisedStatsUptoATrade `json:"realised_stats"`
}

type pnlBucketTradesBySymbol map[string][]tradeWithRealisedStats

type pnlBucket struct {
	Label          string                  `json:"label"`
	Start          time.Time               `json:"start"`
	End            time.Time               `json:"end"`
	NetPnL         decimal.Decimal         `json:"net_pnl"`
	GrossPnL       decimal.Decimal         `json:"gross_pnl"`
	Charges        decimal.Decimal         `json:"charges"`
	TradesBySymbol pnlBucketTradesBySymbol `json:"trades_by_symbol"`
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

	positionByID := make(map[uuid.UUID]*position.Position)
	realisedStatsByTradeID := position.GetRealisedStatsUptoATradeByTradeID(positions)

	// Generate buckets
	buckets := common.GenerateBuckets(period, start, end, loc)
	results := make([]pnlBucket, len(buckets))
	for i, b := range buckets {
		results[i] = pnlBucket{
			Start:          b.Start,
			End:            b.End,
			Label:          b.Label(loc),
			NetPnL:         decimal.Zero,
			GrossPnL:       decimal.Zero,
			Charges:        decimal.Zero,
			TradesBySymbol: make(pnlBucketTradesBySymbol),
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

		grossPnL := stats.GrossPnLAmount
		charges := stats.ChargesAmount.Sub(chargesAmount)
		netPnL := stats.GrossPnLAmount.Sub(charges)

		if stats.IsRealising {
			activeBucket.GrossPnL = activeBucket.GrossPnL.Add(grossPnL)
			activeBucket.NetPnL = activeBucket.NetPnL.Add(netPnL)
			activeBucket.Charges = activeBucket.Charges.Add(charges)
			chargesByPositionID[t.PositionID] = stats.ChargesAmount

			pos, exists := positionByID[t.PositionID]
			if exists {
				item := tradeWithRealisedStats{
					Trade:         *t,
					RealisedStats: stats,
				}
				activeBucket.TradesBySymbol[pos.Symbol] = append(activeBucket.TradesBySymbol[pos.Symbol], item)
			}
		}
	}

	return results
}
