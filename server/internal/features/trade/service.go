package trade

import (
	"arthveda/internal/apires"
	"arthveda/internal/service"
	"context"
	"fmt"
	"time"

	"github.com/shopspring/decimal"
)

type Service struct {
	tradeRepository ReadWriter
}

func NewService(repo ReadWriter) *Service {
	return &Service{
		tradeRepository: repo,
	}
}

type computeAddTradeSubTrade struct {
	OrderKind OrderKind `json:"order_kind"`
	Time      time.Time `json:"time"`
	Quantity  string    `json:"quantity"`
	Price     string    `json:"price"`
}

type ComputeAddTradePayload struct {
	PlannedRiskAmount string                    `json:"planned_risk_amount"`
	ChargesAmount     string                    `json:"charges_amount"`
	SubTrades         []computeAddTradeSubTrade `json:"sub_trades"`
}

type computeAddTradeResult struct {
	Direction                   DirectionKind `json:"direction"`
	Outcome                     OutcomeKind   `json:"outcome"`
	OpenedAt                    time.Time     `json:"opened_at"`
	ClosedAt                    *time.Time    `json:"closed_at"` // `nil` if the Outcome is OutcomeKindOpen
	GrossPnLAmount              string        `json:"gross_pnl_amount"`
	NetPnLAmount                string        `json:"net_pnl_amount"`
	RFactor                     float64       `json:"r_factor"`
	NetReturnPercentage         float64       `json:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL float64       `json:"charges_as_percentage_of_net_pnl"`
	OpenQty                     string        `json:"open_qty"`
	OpenPrice                   string        `json:"open_price"`
}

func (s *Service) ComputeAddTrade(ctx context.Context, payload ComputeAddTradePayload) (computeAddTradeResult, service.ErrKind, error) {
	var err error
	result := computeAddTradeResult{}

	if len(payload.SubTrades) == 0 {
		return result, service.ErrNone, nil
	}

	var closedAt *time.Time = nil
	var outcome OutcomeKind
	var direction DirectionKind
	var avgPrice decimal.Decimal
	grossPnL := decimal.NewFromFloat(0)
	totalCost := decimal.NewFromFloat(0)
	netQty := decimal.NewFromFloat(0)

	var i int
	for i = 0; i < len(payload.SubTrades); i++ {
		subTrade := payload.SubTrades[i]
		var subTradeQty, subTradePrice decimal.Decimal

		subTradeQty, err = decimal.NewFromString(subTrade.Quantity)
		if err != nil {
			return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid quantity %s in a sub trade", subTrade.Quantity), "", fmt.Sprintf("sub_trades[%d]", i), subTrade.Quantity))
		}
		subTradePrice, err = decimal.NewFromString(subTrade.Price)
		if err != nil {
			return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid price %s in a sub trade", subTrade.Price), "", fmt.Sprintf("sub_trades[%d]", i), subTrade.Price))
		}

		var pnl decimal.Decimal

		avgPrice, netQty, direction, pnl, totalCost = applyTradeToPosition(avgPrice, netQty, totalCost, direction, subTradeQty, subTradePrice, subTrade.OrderKind)

		grossPnL = grossPnL.Add(pnl)

		if netQty.IsZero() {
			closedAt = &subTrade.Time
		}
	}

	plannedRiskAmount, err := decimal.NewFromString(payload.PlannedRiskAmount)
	if err != nil {
		return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid planned risk amount %s", payload.PlannedRiskAmount), "", "planned_risk_amount", payload.PlannedRiskAmount))
	}

	chargesAmount, err := decimal.NewFromString(payload.ChargesAmount)
	if err != nil {
		return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid charges amount %s", payload.ChargesAmount), "", "charges_amount", payload.ChargesAmount))
	}

	var netPnL, rFactor, netReturnPercentage, chargesAsPercentageOfNetPnL decimal.Decimal

	if grossPnL.IsPositive() {
		netPnL = grossPnL.Sub(chargesAmount)
		chargesAsPercentageOfNetPnL = chargesAmount.Div(grossPnL).Mul(decimal.NewFromFloat(100)).Round(2)

		if plannedRiskAmount.IsPositive() {
			rFactor = netPnL.Div(plannedRiskAmount).Round(2)
		}

		if totalCost.IsPositive() {
			netReturnPercentage = netPnL.Div(totalCost).Mul(decimal.NewFromFloat(100)).Round(2)
		}
	}

	if netQty.IsZero() {
		// The trade is closed.
		if netPnL.IsZero() {
			outcome = OutcomeKindBreakeven
		} else if netPnL.IsPositive() {
			outcome = OutcomeKindWin
		} else if netPnL.IsNegative() {
			outcome = OutcomeKindLoss
		}
	} else {
		// Trade is open.
		outcome = OutcomeKindOpen
	}

	result.Direction = direction
	result.Outcome = outcome
	result.OpenedAt = payload.SubTrades[0].Time
	result.ClosedAt = closedAt
	result.GrossPnLAmount = grossPnL.String()
	result.NetPnLAmount = netPnL.String()
	result.RFactor, _ = rFactor.Float64()
	result.NetReturnPercentage, _ = netReturnPercentage.Float64()
	result.ChargesAsPercentageOfNetPnL, _ = chargesAsPercentageOfNetPnL.Float64()

	if netQty.IsPositive() {
		result.OpenQty = netQty.String()
		result.OpenPrice = avgPrice.String()
	}

	return result, service.ErrNone, nil
}
