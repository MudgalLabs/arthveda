package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// Helper function to generate test positions with trades
func generateTestPositions(numPositions, tradesPerPosition int) []*position.Position {
	positions := make([]*position.Position, numPositions)
	baseTime := time.Now().UTC().AddDate(0, -1, 0) // Start 1 month ago

	statuses := []position.Status{
		position.StatusWin,
		position.StatusLoss,
		position.StatusBreakeven,
		position.StatusOpen,
	}

	directions := []position.Direction{
		position.DirectionLong,
		position.DirectionShort,
	}

	for i := 0; i < numPositions; i++ {
		posID, _ := uuid.NewV7()
		userID, _ := uuid.NewV7()

		// Generate random position data
		status := statuses[rand.Intn(len(statuses))]
		direction := directions[rand.Intn(2)]

		openedAt := baseTime.Add(time.Duration(rand.Intn(30*24)) * time.Hour)
		var closedAt *time.Time
		if status != position.StatusOpen {
			closed := openedAt.Add(time.Duration(rand.Intn(24*7)) * time.Hour) // Closed within 1 week
			closedAt = &closed
		}

		// Generate realistic PnL amounts
		var netPnL, grossPnL decimal.Decimal
		switch status {
		case position.StatusWin:
			netPnL = decimal.NewFromFloat(float64(rand.Intn(10000) + 100)) // $100 - $10,100
			grossPnL = netPnL.Add(decimal.NewFromFloat(float64(rand.Intn(100))))
		case position.StatusLoss:
			netPnL = decimal.NewFromFloat(float64(rand.Intn(5000) + 50)).Neg() // -$50 to -$5,050
			grossPnL = netPnL.Sub(decimal.NewFromFloat(float64(rand.Intn(50))))
		case position.StatusBreakeven:
			netPnL = decimal.NewFromFloat(float64(rand.Intn(20) - 10)) // -$10 to $10
			grossPnL = netPnL.Add(decimal.NewFromFloat(float64(rand.Intn(10))))
		default:
			netPnL = decimal.Zero
			grossPnL = decimal.Zero
		}

		charges := decimal.NewFromFloat(float64(rand.Intn(50) + 10)) // $10 - $60
		riskAmount := decimal.NewFromFloat(float64(rand.Intn(1000) + 100))
		rFactor := decimal.Zero
		if riskAmount.GreaterThan(decimal.Zero) && status != position.StatusOpen {
			rFactor = netPnL.Div(riskAmount)
		}

		pos := &position.Position{
			ID:                          posID,
			CreatedBy:                   userID,
			CreatedAt:                   openedAt,
			Symbol:                      fmt.Sprintf("TEST%d", i),
			Instrument:                  types.InstrumentEquity,
			Currency:                    currency.CurrencyINR,
			Direction:                   direction,
			Status:                      status,
			OpenedAt:                    openedAt,
			ClosedAt:                    closedAt,
			GrossPnLAmount:              grossPnL,
			NetPnLAmount:                netPnL,
			TotalChargesAmount:          charges,
			RiskAmount:                  riskAmount,
			RFactor:                     rFactor,
			NetReturnPercentage:         decimal.NewFromFloat(float64(rand.Intn(100))),
			ChargesAsPercentageOfNetPnL: decimal.NewFromFloat(float64(rand.Intn(10))),
			OpenQuantity:                decimal.NewFromInt(int64(rand.Intn(100) + 1)),
			OpenAveragePriceAmount:      decimal.NewFromFloat(float64(rand.Intn(500) + 10)),
			Trades:                      make([]*trade.Trade, tradesPerPosition),
		}

		// Generate trades for this position
		tradeTime := openedAt
		for j := 0; j < tradesPerPosition; j++ {
			tradeID, _ := uuid.NewV7()

			// Alternate between buy and sell to simulate realistic trading
			var tradeKind types.TradeKind
			if j%2 == 0 {
				if direction == position.DirectionLong {
					tradeKind = types.TradeKindBuy
				} else {
					tradeKind = types.TradeKindSell
				}
			} else {
				if direction == position.DirectionLong {
					tradeKind = types.TradeKindSell
				} else {
					tradeKind = types.TradeKindBuy
				}
			}

			// Add some time between trades
			tradeTime = tradeTime.Add(time.Duration(rand.Intn(120)) * time.Minute)

			realisedPnL := decimal.Zero
			if j > 0 && tradeKind == types.TradeKindSell && status != position.StatusOpen {
				realisedPnL = decimal.NewFromFloat(float64(rand.Intn(200) - 100))
			}

			pos.Trades[j] = &trade.Trade{
				ID:               tradeID,
				PositionID:       posID,
				CreatedAt:        tradeTime,
				Time:             tradeTime,
				Kind:             tradeKind,
				Quantity:         decimal.NewFromInt(int64(rand.Intn(50) + 1)),
				Price:            decimal.NewFromFloat(float64(rand.Intn(200) + 10)),
				ChargesAmount:    decimal.NewFromFloat(float64(rand.Intn(20) + 1)),
				RealisedGrossPnL: realisedPnL,
			}
		}

		positions[i] = pos
	}

	return positions
}

// Benchmark getGeneralStats with different dataset sizes
func BenchmarkGetGeneralStats_Small(b *testing.B) {
	positions := generateTestPositions(10, 5) // 10 positions, 5 trades each
	b.ResetTimer()
	for b.Loop() {
		_ = getGeneralStats(positions)
	}
}

func BenchmarkGetGeneralStats_Medium(b *testing.B) {
	positions := generateTestPositions(100, 10) // 100 positions, 10 trades each
	b.ResetTimer()
	for b.Loop() {
		_ = getGeneralStats(positions)
	}
}

func BenchmarkGetGeneralStats_Large(b *testing.B) {
	positions := generateTestPositions(1000, 10) // 1000 positions, 10 trades each
	b.ResetTimer()
	for b.Loop() {
		_ = getGeneralStats(positions)
	}
}

func BenchmarkGetGeneralStats_XLarge(b *testing.B) {
	positions := generateTestPositions(5000, 15) // 5000 positions, 15 trades each
	b.ResetTimer()
	for b.Loop() {
		_ = getGeneralStats(positions)
	}
}

// Benchmark getPnLBuckets with different dataset sizes and periods
func BenchmarkGetPnLBuckets_Small_Daily(b *testing.B) {
	positions := generateTestPositions(10, 5)
	start := time.Now().UTC().AddDate(0, -1, 0) // 1 month ago
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetPnLBuckets_Medium_Daily(b *testing.B) {
	positions := generateTestPositions(100, 10)
	start := time.Now().UTC().AddDate(0, -1, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetPnLBuckets_Large_Daily(b *testing.B) {
	positions := generateTestPositions(1000, 10)
	start := time.Now().UTC().AddDate(0, -1, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetPnLBuckets_XLarge_Daily(b *testing.B) {
	positions := generateTestPositions(5000, 15)
	start := time.Now().UTC().AddDate(0, -1, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetPnLBuckets_Large_Year(b *testing.B) {
	positions := generateTestPositions(1000, 10)
	start := time.Now().UTC().AddDate(-1, 0, 0) // 1 year ago
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetPnLBuckets_XLarge_Year(b *testing.B) {
	positions := generateTestPositions(5000, 15)
	start := time.Now().UTC().AddDate(-1, 0, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetPnLBuckets_Weekly(b *testing.B) {
	positions := generateTestPositions(1000, 10)
	start := time.Now().UTC().AddDate(0, -6, 0) // 6 months ago
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodWeekly, start, end, loc)
	}
}

func BenchmarkGetPnLBuckets_Monthly(b *testing.B) {
	positions := generateTestPositions(1000, 10)
	start := time.Now().UTC().AddDate(-1, 0, 0) // 1 year ago
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodMonthly, start, end, loc)
	}
}

// Benchmark getCumulativePnLBuckets
func BenchmarkGetCumulativePnLBuckets_Large(b *testing.B) {
	positions := generateTestPositions(1000, 10)
	start := time.Now().UTC().AddDate(0, -1, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getCumulativePnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetCumulativePnLBuckets_XLarge(b *testing.B) {
	positions := generateTestPositions(5000, 15)
	start := time.Now().UTC().AddDate(0, -1, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getCumulativePnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

// Benchmark complete workflow
func BenchmarkCompleteWorkflow_Large(b *testing.B) {
	positions := generateTestPositions(1000, 10)
	start := time.Now().UTC().AddDate(0, -1, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ResetTimer()
	for b.Loop() {
		_ = getGeneralStats(positions)
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
		_ = getCumulativePnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

// Memory allocation benchmarks
func BenchmarkGetPnLBuckets_Memory(b *testing.B) {
	positions := generateTestPositions(1000, 10)
	start := time.Now().UTC().AddDate(0, -1, 0)
	end := time.Now().UTC()
	loc := time.UTC

	b.ReportAllocs()
	b.ResetTimer()
	for b.Loop() {
		_ = getPnLBuckets(positions, common.BucketPeriodDaily, start, end, loc)
	}
}

func BenchmarkGetGeneralStats_Memory(b *testing.B) {
	positions := generateTestPositions(1000, 10)

	b.ReportAllocs()
	b.ResetTimer()
	for b.Loop() {
		_ = getGeneralStats(positions)
	}
}

// Test for correctness (not a benchmark)
func TestGeneralStatsCorrectness(t *testing.T) {
	positions := []*position.Position{
		{
			Status:             position.StatusWin,
			NetPnLAmount:       decimal.NewFromInt(100),
			GrossPnLAmount:     decimal.NewFromInt(110),
			TotalChargesAmount: decimal.NewFromInt(10),
			RiskAmount:         decimal.NewFromInt(50),
			RFactor:            decimal.NewFromInt(2),
		},
		{
			Status:             position.StatusLoss,
			NetPnLAmount:       decimal.NewFromInt(-50),
			GrossPnLAmount:     decimal.NewFromInt(-45),
			TotalChargesAmount: decimal.NewFromInt(5),
			RiskAmount:         decimal.NewFromInt(50),
			RFactor:            decimal.NewFromInt(-1),
		},
		{
			Status: position.StatusOpen,
		},
	}

	stats := getGeneralStats(positions)

	if stats.WinsCount != 1 {
		t.Errorf("Expected WinsCount=1, got %d", stats.WinsCount)
	}
	if stats.LossesCount != 1 {
		t.Errorf("Expected LossesCount=1, got %d", stats.LossesCount)
	}
	if stats.WinRate != 50.0 {
		t.Errorf("Expected WinRate=50.0, got %f", stats.WinRate)
	}

	netPnL := decimal.NewFromInt(50) // 100 - 50
	if stats.NetPnL != netPnL.String() {
		t.Errorf("Expected NetPnL=%s, got %s", netPnL.String(), stats.NetPnL)
	}
}
