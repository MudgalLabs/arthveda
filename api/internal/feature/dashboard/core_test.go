package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/domain/currency"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// Helper function to create decimal from string
func d(s string) decimal.Decimal {
	d, err := decimal.NewFromString(s)
	if err != nil {
		panic(err)
	}
	return d
}

// Helper function to create a test position
func createTestPosition(
	status position.Status,
	direction position.Direction,
	netPnL, grossPnL, charges, riskAmount string,
	openedAt time.Time,
	closedAt *time.Time,
) *position.Position {
	posID, _ := uuid.NewV7()
	userID, _ := uuid.NewV7()

	rFactor := decimal.Zero
	riskDec := d(riskAmount)
	netPnLDec := d(netPnL)
	if riskDec.GreaterThan(decimal.Zero) && status != position.StatusOpen {
		rFactor = netPnLDec.Div(riskDec)
	}

	return &position.Position{
		ID:                 posID,
		CreatedBy:          userID,
		CreatedAt:          openedAt,
		Symbol:             "TEST",
		Instrument:         types.InstrumentEquity,
		Currency:           currency.CurrencyINR,
		Direction:          direction,
		Status:             status,
		OpenedAt:           openedAt,
		ClosedAt:           closedAt,
		GrossPnLAmount:     d(grossPnL),
		NetPnLAmount:       d(netPnL),
		TotalChargesAmount: d(charges),
		RiskAmount:         d(riskAmount),
		RFactor:            rFactor,
		Trades:             []*trade.Trade{},
	}
}

// Helper function to create a test trade
func createTestTrade(
	positionID uuid.UUID,
	tradeTime time.Time,
	kind types.TradeKind,
	quantity, price, charges, realisedPnL string,
) *trade.Trade {
	tradeID, _ := uuid.NewV7()

	return &trade.Trade{
		ID:               tradeID,
		PositionID:       positionID,
		CreatedAt:        tradeTime,
		Time:             tradeTime,
		Kind:             kind,
		Quantity:         d(quantity),
		Price:            d(price),
		ChargesAmount:    d(charges),
		RealisedGrossPnL: d(realisedPnL),
	}
}

// ==================== Tests for getGeneralStats ====================

func TestGetGeneralStats_EmptyPositions(t *testing.T) {
	positions := []*position.Position{}
	stats := getGeneralStats(positions)

	if stats.WinRate != 0 {
		t.Errorf("Expected WinRate=0, got %f", stats.WinRate)
	}
	if stats.WinsCount != 0 {
		t.Errorf("Expected WinsCount=0, got %d", stats.WinsCount)
	}
	if stats.LossesCount != 0 {
		t.Errorf("Expected LossesCount=0, got %d", stats.LossesCount)
	}
}

func TestGetGeneralStats_SingleWinningPosition(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(
			position.StatusWin,
			position.DirectionLong,
			"100", "110", "10", "50",
			now, &closedAt,
		),
	}

	stats := getGeneralStats(positions)

	if stats.WinRate != 100.0 {
		t.Errorf("Expected WinRate=100.0, got %f", stats.WinRate)
	}
	if stats.LossRate != 0.0 {
		t.Errorf("Expected LossRate=0.0, got %f", stats.LossRate)
	}
	if stats.WinsCount != 1 {
		t.Errorf("Expected WinsCount=1, got %d", stats.WinsCount)
	}
	if stats.LossesCount != 0 {
		t.Errorf("Expected LossesCount=0, got %d", stats.LossesCount)
	}
	if stats.NetPnL != "100" {
		t.Errorf("Expected NetPnL=100, got %s", stats.NetPnL)
	}
	if stats.GrossPnL != "110" {
		t.Errorf("Expected GrossPnL=110, got %s", stats.GrossPnL)
	}
	if stats.Charges != "10" {
		t.Errorf("Expected Charges=10, got %s", stats.Charges)
	}
	if stats.AvgWin != "100" {
		t.Errorf("Expected AvgWin=100, got %s", stats.AvgWin)
	}
	if stats.MaxWin != "100" {
		t.Errorf("Expected MaxWin=100, got %s", stats.MaxWin)
	}
	if stats.WinStreak != 1 {
		t.Errorf("Expected WinStreak=1, got %d", stats.WinStreak)
	}
}

func TestGetGeneralStats_SingleLosingPosition(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(
			position.StatusLoss,
			position.DirectionLong,
			"-50", "-45", "5", "100",
			now, &closedAt,
		),
	}

	stats := getGeneralStats(positions)

	if stats.WinRate != 0.0 {
		t.Errorf("Expected WinRate=0.0, got %f", stats.WinRate)
	}
	if stats.LossRate != 100.0 {
		t.Errorf("Expected LossRate=100.0, got %f", stats.LossRate)
	}
	if stats.WinsCount != 0 {
		t.Errorf("Expected WinsCount=0, got %d", stats.WinsCount)
	}
	if stats.LossesCount != 1 {
		t.Errorf("Expected LossesCount=1, got %d", stats.LossesCount)
	}
	if stats.NetPnL != "-50" {
		t.Errorf("Expected NetPnL=-50, got %s", stats.NetPnL)
	}
	if stats.AvgLoss != "-50" {
		t.Errorf("Expected AvgLoss=-50, got %s", stats.AvgLoss)
	}
	if stats.MaxLoss != "-50" {
		t.Errorf("Expected MaxLoss=-50, got %s", stats.MaxLoss)
	}
	if stats.LossStreak != 1 {
		t.Errorf("Expected LossStreak=1, got %d", stats.LossStreak)
	}
}

func TestGetGeneralStats_MixedPositions(t *testing.T) {
	now := time.Now().UTC()
	closedAt1 := now.Add(time.Hour)
	closedAt2 := now.Add(2 * time.Hour)
	closedAt3 := now.Add(3 * time.Hour)

	positions := []*position.Position{
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt1),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt2),
		createTestPosition(position.StatusWin, position.DirectionShort, "200", "220", "20", "100", now, &closedAt3),
		createTestPosition(position.StatusOpen, position.DirectionLong, "0", "0", "0", "50", now, nil),
	}

	stats := getGeneralStats(positions)

	// 2 wins out of 3 settled = 66.67%
	if stats.WinRate < 66.6 || stats.WinRate > 66.7 {
		t.Errorf("Expected WinRate≈66.67, got %f", stats.WinRate)
	}
	if stats.LossRate < 33.3 || stats.LossRate > 33.4 {
		t.Errorf("Expected LossRate≈33.33, got %f", stats.LossRate)
	}
	if stats.WinsCount != 2 {
		t.Errorf("Expected WinsCount=2, got %d", stats.WinsCount)
	}
	if stats.LossesCount != 1 {
		t.Errorf("Expected LossesCount=1, got %d", stats.LossesCount)
	}

	// Net PnL: 100 - 50 + 200 = 250
	if stats.NetPnL != "250" {
		t.Errorf("Expected NetPnL=250, got %s", stats.NetPnL)
	}

	// Avg Win: (100 + 200) / 2 = 150
	if stats.AvgWin != "150" {
		t.Errorf("Expected AvgWin=150, got %s", stats.AvgWin)
	}

	// Max Win: 200
	if stats.MaxWin != "200" {
		t.Errorf("Expected MaxWin=200, got %s", stats.MaxWin)
	}

	// Max Loss: -50
	if stats.MaxLoss != "-50" {
		t.Errorf("Expected MaxLoss=-50, got %s", stats.MaxLoss)
	}
}

func TestGetGeneralStats_BreakevenPosition(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(position.StatusBreakeven, position.DirectionLong, "5", "10", "5", "50", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	// Breakeven is counted as a win
	if stats.WinRate != 100.0 {
		t.Errorf("Expected WinRate=100.0 for breakeven, got %f", stats.WinRate)
	}
	if stats.WinsCount != 1 {
		t.Errorf("Expected WinsCount=1 for breakeven, got %d", stats.WinsCount)
	}
}

func TestGetGeneralStats_OnlyOpenPositions(t *testing.T) {
	now := time.Now().UTC()

	positions := []*position.Position{
		createTestPosition(position.StatusOpen, position.DirectionLong, "0", "0", "0", "50", now, nil),
		createTestPosition(position.StatusOpen, position.DirectionShort, "0", "0", "0", "100", now, nil),
	}

	stats := getGeneralStats(positions)

	if stats.WinRate != 0 {
		t.Errorf("Expected WinRate=0 for only open positions, got %f", stats.WinRate)
	}
	if stats.WinsCount != 0 {
		t.Errorf("Expected WinsCount=0, got %d", stats.WinsCount)
	}
	if stats.LossesCount != 0 {
		t.Errorf("Expected LossesCount=0, got %d", stats.LossesCount)
	}
}

func TestGetGeneralStats_WinStreakCalculation(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt),
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt),
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	if stats.WinStreak != 3 {
		t.Errorf("Expected WinStreak=3, got %d", stats.WinStreak)
	}
}

func TestGetGeneralStats_LossStreakCalculation(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	if stats.LossStreak != 3 {
		t.Errorf("Expected LossStreak=3, got %d", stats.LossStreak)
	}
}

func TestGetGeneralStats_RFactorCalculation(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	// Win: RFactor = 100/50 = 2.0
	// Loss: RFactor = -50/50 = -1.0
	// Average: (2.0 + -1.0) / 2 = 0.5
	positions := []*position.Position{
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	// Average R-Factor should be 0.5
	avgRFactor := d(stats.AvgRFactor)
	expected := d("0.50")
	if !avgRFactor.Equal(expected) {
		t.Errorf("Expected AvgRFactor=0.50, got %s", stats.AvgRFactor)
	}

	// Average Win R-Factor should be 2.0
	avgWinRFactor := d(stats.AvgWinRFactor)
	expectedWin := d("2.00")
	if !avgWinRFactor.Equal(expectedWin) {
		t.Errorf("Expected AvgWinRFactor=2.00, got %s", stats.AvgWinRFactor)
	}

	// Average Loss R-Factor should be -1.0
	avgLossRFactor := d(stats.AvgLossRFactor)
	expectedLoss := d("-1.00")
	if !avgLossRFactor.Equal(expectedLoss) {
		t.Errorf("Expected AvgLossRFactor=-1.00, got %s", stats.AvgLossRFactor)
	}
}

func TestGetGeneralStats_NoRiskAmount(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	// Positions without risk amount should not affect R-Factor calculations
	positions := []*position.Position{
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "0", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "0", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	// R-Factor should be 0 when no positions have risk amount
	avgRFactor := d(stats.AvgRFactor)
	if !avgRFactor.Equal(decimal.Zero) {
		t.Errorf("Expected AvgRFactor=0 when no risk amount, got %s", stats.AvgRFactor)
	}
}

// ==================== Tests for getPnLBuckets ====================

func TestGetPnLBuckets_EmptyPositions(t *testing.T) {
	positions := []*position.Position{}
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC)

	buckets := getPnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	if len(buckets) != 0 {
		t.Errorf("Expected 0 buckets for empty positions, got %d", len(buckets))
	}
}

func TestGetPnLBuckets_NoTradesInRange(t *testing.T) {
	posID, _ := uuid.NewV7()

	positions := []*position.Position{
		{
			ID:     posID,
			Status: position.StatusWin,
			Trades: []*trade.Trade{
				createTestTrade(posID, time.Date(2023, 12, 15, 10, 0, 0, 0, time.UTC), types.TradeKindBuy, "100", "50", "5", "0"),
			},
		},
	}

	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC)

	buckets := getPnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	// Should have 30 buckets (Jan 1-30), all with zero PnL
	if len(buckets) != 30 {
		t.Errorf("Expected 30 buckets, got %d", len(buckets))
	}

	for i, bucket := range buckets {
		if !bucket.NetPnL.Equal(decimal.Zero) {
			t.Errorf("Bucket %d: Expected zero NetPnL, got %s", i, bucket.NetPnL.String())
		}
	}
}

func TestGetPnLBuckets_SingleTradeInBucket(t *testing.T) {
	posID, _ := uuid.NewV7()
	tradeTime := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)

	// Create a position with scale-in and scale-out trades
	positions := []*position.Position{
		{
			ID:        posID,
			Direction: position.DirectionLong,
			Status:    position.StatusWin,
			Trades: []*trade.Trade{
				createTestTrade(posID, time.Date(2024, 1, 10, 10, 0, 0, 0, time.UTC), types.TradeKindBuy, "100", "50", "5", "0"),
				createTestTrade(posID, tradeTime, types.TradeKindSell, "100", "60", "5", "1000"),
			},
		},
	}

	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC)

	buckets := getPnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	// Find the bucket containing Jan 15
	var targetBucket *pnlBucket
	for i := range buckets {
		if buckets[i].Start.Day() == 15 {
			targetBucket = &buckets[i]
			break
		}
	}

	if targetBucket == nil {
		t.Fatal("Could not find bucket for Jan 15")
	}

	// The sell trade should have recorded PnL in this bucket
	if targetBucket.GrossPnL.Equal(decimal.Zero) {
		t.Error("Expected non-zero GrossPnL in bucket with scale-out trade")
	}
}

func TestGetPnLBuckets_DailyPeriod(t *testing.T) {
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 8, 0, 0, 0, 0, time.UTC)

	posID, _ := uuid.NewV7()
	positions := []*position.Position{
		{
			ID:        posID,
			Direction: position.DirectionLong,
			Status:    position.StatusWin,
			Trades:    []*trade.Trade{},
		},
	}

	buckets := getPnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	// Should create 7 daily buckets (Jan 1-7)
	if len(buckets) != 7 {
		t.Errorf("Expected 7 daily buckets, got %d", len(buckets))
	}

	// Verify bucket structure
	for i, bucket := range buckets {
		expectedDay := start.AddDate(0, 0, i)
		if bucket.Start.Day() != expectedDay.Day() {
			t.Errorf("Bucket %d: Expected day %d, got %d", i, expectedDay.Day(), bucket.Start.Day())
		}
	}
}

func TestGetPnLBuckets_WeeklyPeriod(t *testing.T) {
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 2, 1, 0, 0, 0, 0, time.UTC)

	posID, _ := uuid.NewV7()
	positions := []*position.Position{
		{
			ID:        posID,
			Direction: position.DirectionLong,
			Status:    position.StatusWin,
			Trades:    []*trade.Trade{},
		},
	}

	buckets := getPnLBuckets(positions, common.BucketPeriodWeekly, start, end, time.UTC)

	// Should create weekly buckets
	if len(buckets) < 4 || len(buckets) > 5 {
		t.Errorf("Expected 4-5 weekly buckets for January, got %d", len(buckets))
	}
}

func TestGetPnLBuckets_MonthlyPeriod(t *testing.T) {
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 4, 1, 0, 0, 0, 0, time.UTC)

	posID, _ := uuid.NewV7()
	positions := []*position.Position{
		{
			ID:        posID,
			Direction: position.DirectionLong,
			Status:    position.StatusWin,
			Trades:    []*trade.Trade{},
		},
	}

	buckets := getPnLBuckets(positions, common.BucketPeriodMonthly, start, end, time.UTC)

	// Should create 3 monthly buckets (Jan, Feb, Mar)
	if len(buckets) != 3 {
		t.Errorf("Expected 3 monthly buckets, got %d", len(buckets))
	}
}

// ==================== Tests for getCumulativePnLBuckets ====================

func TestGetCumulativePnLBuckets_EmptyPositions(t *testing.T) {
	positions := []*position.Position{}
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC)

	buckets := getCumulativePnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	if len(buckets) != 0 {
		t.Errorf("Expected 0 buckets for empty positions, got %d", len(buckets))
	}
}

func TestGetCumulativePnLBuckets_Accumulation(t *testing.T) {
	posID, _ := uuid.NewV7()

	positions := []*position.Position{
		{
			ID:        posID,
			Direction: position.DirectionLong,
			Status:    position.StatusWin,
			Trades: []*trade.Trade{
				createTestTrade(posID, time.Date(2024, 1, 1, 10, 0, 0, 0, time.UTC), types.TradeKindBuy, "100", "50", "5", "0"),
				createTestTrade(posID, time.Date(2024, 1, 2, 10, 0, 0, 0, time.UTC), types.TradeKindSell, "50", "60", "2.5", "500"),
				createTestTrade(posID, time.Date(2024, 1, 3, 10, 0, 0, 0, time.UTC), types.TradeKindSell, "50", "65", "2.5", "750"),
			},
		},
	}

	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 5, 0, 0, 0, 0, time.UTC)

	buckets := getCumulativePnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	// Verify cumulative nature - each bucket should have >= previous bucket
	for i := 1; i < len(buckets); i++ {
		if buckets[i].GrossPnL.LessThan(buckets[i-1].GrossPnL) {
			t.Errorf("Cumulative GrossPnL decreased from bucket %d to %d", i-1, i)
		}
		if buckets[i].Charges.LessThan(buckets[i-1].Charges) {
			t.Errorf("Cumulative Charges decreased from bucket %d to %d", i-1, i)
		}
	}
}

func TestGetCumulativePnLBuckets_VerifyLabels(t *testing.T) {
	posID, _ := uuid.NewV7()
	positions := []*position.Position{
		{
			ID:        posID,
			Direction: position.DirectionLong,
			Status:    position.StatusWin,
			Trades:    []*trade.Trade{},
		},
	}

	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 8, 0, 0, 0, 0, time.UTC)

	buckets := getCumulativePnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	for i, bucket := range buckets {
		if bucket.Label == "" {
			t.Errorf("Bucket %d has empty label", i)
		}
		if bucket.Start.IsZero() {
			t.Errorf("Bucket %d has zero start time", i)
		}
		if bucket.End.IsZero() {
			t.Errorf("Bucket %d has zero end time", i)
		}
	}
}

// ==================== Integration Tests ====================

func TestIntegration_CompleteWorkflow(t *testing.T) {
	now := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	closedAt1 := now.Add(24 * time.Hour)
	closedAt2 := now.Add(48 * time.Hour)

	posID1, _ := uuid.NewV7()
	posID2, _ := uuid.NewV7()

	positions := []*position.Position{
		{
			ID:                 posID1,
			Direction:          position.DirectionLong,
			Status:             position.StatusWin,
			NetPnLAmount:       d("100"),
			GrossPnLAmount:     d("110"),
			TotalChargesAmount: d("10"),
			RiskAmount:         d("50"),
			RFactor:            d("2"),
			OpenedAt:           now,
			ClosedAt:           &closedAt1,
			Trades: []*trade.Trade{
				createTestTrade(posID1, now, types.TradeKindBuy, "100", "50", "5", "0"),
				createTestTrade(posID1, closedAt1, types.TradeKindSell, "100", "60", "5", "1000"),
			},
		},
		{
			ID:                 posID2,
			Direction:          position.DirectionLong,
			Status:             position.StatusLoss,
			NetPnLAmount:       d("-50"),
			GrossPnLAmount:     d("-45"),
			TotalChargesAmount: d("5"),
			RiskAmount:         d("50"),
			RFactor:            d("-1"),
			OpenedAt:           now.Add(12 * time.Hour),
			ClosedAt:           &closedAt2,
			Trades: []*trade.Trade{
				createTestTrade(posID2, now.Add(12*time.Hour), types.TradeKindBuy, "100", "50", "2.5", "0"),
				createTestTrade(posID2, closedAt2, types.TradeKindSell, "100", "45", "2.5", "-500"),
			},
		},
	}

	// Test general stats
	stats := getGeneralStats(positions)
	if stats.WinsCount != 1 {
		t.Errorf("Expected WinsCount=1, got %d", stats.WinsCount)
	}
	if stats.LossesCount != 1 {
		t.Errorf("Expected LossesCount=1, got %d", stats.LossesCount)
	}

	// Test PnL buckets
	start := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(2024, 1, 8, 0, 0, 0, 0, time.UTC)
	buckets := getPnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)

	if len(buckets) == 0 {
		t.Error("Expected non-empty buckets")
	}

	// Test cumulative buckets
	cumBuckets := getCumulativePnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)
	if len(cumBuckets) != len(buckets) {
		t.Errorf("Expected same number of buckets, got %d vs %d", len(cumBuckets), len(buckets))
	}
}

func TestIntegration_LargeDataset(t *testing.T) {
	now := time.Now().UTC()
	positions := make([]*position.Position, 100)

	for i := 0; i < 100; i++ {
		closedAt := now.Add(time.Duration(i) * time.Hour)
		status := position.StatusWin
		netPnL := "100"

		if i%3 == 0 {
			status = position.StatusLoss
			netPnL = "-50"
		}

		positions[i] = createTestPosition(
			status,
			position.DirectionLong,
			netPnL, "110", "10", "50",
			now.Add(time.Duration(i)*time.Hour),
			&closedAt,
		)
	}

	// Test that it doesn't panic with large dataset
	stats := getGeneralStats(positions)
	if stats.WinsCount == 0 && stats.LossesCount == 0 {
		t.Error("Expected some wins or losses in large dataset")
	}

	start := now.AddDate(0, 0, -7)
	end := now
	buckets := getPnLBuckets(positions, common.BucketPeriodDaily, start, end, time.UTC)
	if len(buckets) == 0 {
		t.Error("Expected buckets for large dataset")
	}
}

// ==================== Edge Case Tests ====================

func TestEdgeCase_MaxWinWithMultiplePositions(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "110", "10", "50", now, &closedAt),
		createTestPosition(position.StatusWin, position.DirectionLong, "500", "550", "50", "100", now, &closedAt),
		createTestPosition(position.StatusWin, position.DirectionLong, "50", "60", "10", "25", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	if stats.MaxWin != "500" {
		t.Errorf("Expected MaxWin=500, got %s", stats.MaxWin)
	}
}

func TestEdgeCase_MaxLossWithMultiplePositions(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(position.StatusLoss, position.DirectionLong, "-50", "-45", "5", "50", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-200", "-190", "10", "100", now, &closedAt),
		createTestPosition(position.StatusLoss, position.DirectionLong, "-25", "-20", "5", "25", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	if stats.MaxLoss != "-200" {
		t.Errorf("Expected MaxLoss=-200, got %s", stats.MaxLoss)
	}
}

func TestEdgeCase_ZeroCharges(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(position.StatusWin, position.DirectionLong, "100", "100", "0", "50", now, &closedAt),
	}

	stats := getGeneralStats(positions)

	if stats.Charges != "0" {
		t.Errorf("Expected Charges=0, got %s", stats.Charges)
	}
	if stats.NetPnL != stats.GrossPnL {
		t.Error("NetPnL should equal GrossPnL when charges are zero")
	}
}

func TestEdgeCase_VeryLargeNumbers(t *testing.T) {
	now := time.Now().UTC()
	closedAt := now.Add(time.Hour)

	positions := []*position.Position{
		createTestPosition(
			position.StatusWin,
			position.DirectionLong,
			"1000000", "1100000", "100000", "500000",
			now, &closedAt,
		),
	}

	stats := getGeneralStats(positions)

	if stats.NetPnL != "1000000" {
		t.Errorf("Expected NetPnL=1000000, got %s", stats.NetPnL)
	}
}
