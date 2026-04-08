package common

import "github.com/shopspring/decimal"

func AbsDecimal(d decimal.Decimal) decimal.Decimal {
	if d.IsNegative() {
		return d.Neg()
	}

	return d
}

func PctChangeDecimal(curr, base decimal.Decimal) decimal.Decimal {
	if base.IsZero() {
		return decimal.Zero
	}
	return curr.Sub(base).Div(base)
}

func PctChangeFloat(curr, base float64) float64 {
	if base == 0 {
		return 0
	}
	return (curr - base) / base
}
