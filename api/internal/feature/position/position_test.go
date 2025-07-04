package position_test

import (
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"fmt"
	"testing"
	"time"

	"github.com/shopspring/decimal"
)

func d(s string) decimal.Decimal {
	d, err := decimal.NewFromString(s)
	if err != nil {
		panic(err)
	}
	return d
}

func TestComputeSmartTrades_LongPosition(t *testing.T) {
	pos := position.Position{
		Trades: []*trade.Trade{
			{Time: time.Date(2024, 1, 1, 10, 0, 0, 0, time.UTC), Kind: trade.TradeKindBuy, Quantity: d("100"), Price: d("100")},
			{Time: time.Date(2024, 1, 2, 10, 0, 0, 0, time.UTC), Kind: trade.TradeKindBuy, Quantity: d("50"), Price: d("110")},
			{Time: time.Date(2024, 1, 3, 10, 0, 0, 0, time.UTC), Kind: trade.TradeKindSell, Quantity: d("80"), Price: d("120")},
			{Time: time.Date(2024, 1, 4, 10, 0, 0, 0, time.UTC), Kind: trade.TradeKindBuy, Quantity: d("70"), Price: d("115")},
			{Time: time.Date(2024, 1, 5, 10, 0, 0, 0, time.UTC), Kind: trade.TradeKindSell, Quantity: d("90"), Price: d("125")},
			{Time: time.Date(2024, 1, 6, 10, 0, 0, 0, time.UTC), Kind: trade.TradeKindSell, Quantity: d("50"), Price: d("130")},
		},
	}

	updated, err := position.ComputeSmartTrades(pos)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	fmt.Println("--- Smart Trade Summary ---")
	for i, t := range updated.Trades {
		fmt.Printf("%2d. %s %s @ %s\n", i+1, t.Kind, t.Quantity.String(), t.Price.String())
		if !t.RealisedPnL.IsZero() {
			fmt.Printf("    Realised PnL: ₹%s\n", t.RealisedPnL.StringFixed(2))
			fmt.Printf("    ROI: %s%%\n", t.ROI.StringFixed(2))
		}
	}

	fmt.Println("--- Position Summary ---")
	fmt.Printf("Direction: %s\n", updated.Direction)
	fmt.Printf("Gross PnL: ₹%s\n", updated.GrossPnLAmount.StringFixed(2))
	fmt.Printf("Net Return: %s%%\n", updated.NetReturnPercentage.StringFixed(2))

	if updated.Direction != position.DirectionLong {
		t.Errorf("expected direction %s, got %s", position.DirectionLong, updated.Direction)
	}

	if !updated.GrossPnLAmount.Equal(d("3800.00")) {
		t.Errorf("expected GrossPnLAmount 3800.00, got %s", updated.GrossPnLAmount.String())
	}

	if !updated.NetReturnPercentage.Round(2).Equal(d("16.14")) {
		t.Errorf("expected NetReturnPercentage 16.14, got %s", updated.NetReturnPercentage.StringFixed(2))
	}
}
