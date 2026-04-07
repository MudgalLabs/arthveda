package report

import "github.com/shopspring/decimal"

func aggregateOthers(base *symbolsPerformanceItem, item symbolsPerformanceItem) *symbolsPerformanceItem {
	base.Symbol = "Others"

	base.PositionsCount += item.PositionsCount
	base.GrossPnL = base.GrossPnL.Add(item.GrossPnL)
	base.NetPnL = base.NetPnL.Add(item.NetPnL)
	base.Charges = base.Charges.Add(item.Charges)

	base.AvgGrossR = decimal.Zero
	base.AvgWinR = decimal.Zero
	base.AvgLossR = decimal.Zero
	base.WinRate = decimal.Zero
	base.Efficiency = decimal.Zero

	return base
}
