package position

import (
	"arthveda/internal/apires"
	"arthveda/internal/features/trade"
	"arthveda/internal/service"
	"context"
	"fmt"
	"time"

	"github.com/shopspring/decimal"
)

type Service struct {
	positionRepository ReadWriter
}

func NewService(repo ReadWriter) *Service {
	return &Service{
		positionRepository: repo,
	}
}

type computeTrade struct {
	OrderKind trade.Kind `json:"order_kind"`
	Time      time.Time  `json:"time"`
	Quantity  string     `json:"quantity"` // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
	Price     string     `json:"price"`    // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
}

type ComputePayload struct {
	RiskAmount    string         `json:"risk_amount"`    // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
	ChargesAmount string         `json:"charges_amount"` // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
	Trades        []computeTrade `json:"trades"`
}

type computeResult struct {
	Direction                   Direction  `json:"direction"`
	Outcome                     Status     `json:"outcome"`
	OpenedAt                    time.Time  `json:"opened_at"`
	ClosedAt                    *time.Time `json:"closed_at"`        // `nil` if the Outcome is OutcomeKindOpen meaning the trade is open.
	GrossPnLAmount              string     `json:"gross_pnl_amount"` // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
	NetPnLAmount                string     `json:"net_pnl_amount"`   // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
	RFactor                     float64    `json:"r_factor"`
	NetReturnPercentage         float64    `json:"net_return_percentage"`
	ChargesAsPercentageOfNetPnL float64    `json:"charges_as_percentage_of_net_pnl"`
	OpenQuantity                string     `json:"open_quantity"`             // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
	OpenAveragePriceAmount      string     `json:"open_average_price_amount"` // TODO: Can we directly use `decimal.Decimal` instead of `string` here?
}

func (s *Service) Compute(ctx context.Context, payload ComputePayload) (computeResult, service.ErrKind, error) {
	var err error
	result := computeResult{
		OpenedAt: time.Now().UTC(),
	}

	if len(payload.Trades) == 0 {
		return result, service.ErrNone, nil
	}

	var closedAt *time.Time = nil
	var outcome Status
	var direction Direction
	var avgPrice decimal.Decimal
	grossPnL := decimal.NewFromFloat(0)
	totalCost := decimal.NewFromFloat(0)
	netQty := decimal.NewFromFloat(0)

	for i := range payload.Trades {
		subTrade := payload.Trades[i]
		var subTradeQty, subTradePrice decimal.Decimal

		subTradeQty, err = decimal.NewFromString(subTrade.Quantity)
		if err != nil {
			return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid quantity %s in a sub trade", subTrade.Quantity), "", fmt.Sprintf("trades[%d]", i), subTrade.Quantity))
		}
		subTradePrice, err = decimal.NewFromString(subTrade.Price)
		if err != nil {
			return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid price %s in a sub trade", subTrade.Price), "", fmt.Sprintf("trades[%d]", i), subTrade.Price))
		}

		var pnl decimal.Decimal

		avgPrice, netQty, direction, pnl, totalCost = applyTradeToPosition(avgPrice, netQty, totalCost, direction, subTradeQty, subTradePrice, subTrade.OrderKind)

		grossPnL = grossPnL.Add(pnl)

		if netQty.IsZero() {
			closedAt = &subTrade.Time
		}
	}

	riskAmount, err := decimal.NewFromString(payload.RiskAmount)
	if err != nil {
		return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid risk amount %s", payload.RiskAmount), "", "risk_amount", payload.RiskAmount))
	}

	chargesAmount, err := decimal.NewFromString(payload.ChargesAmount)
	if err != nil {
		return result, service.ErrInvalidInput, service.NewInputValidationErrorsWithError(apires.NewApiError(fmt.Sprintf("Invalid charges amount %s", payload.ChargesAmount), "", "charges_amount", payload.ChargesAmount))
	}

	var netPnL, rFactor, netReturnPercentage, chargesAsPercentageOfNetPnL decimal.Decimal

	// The trade is closed.
	if netQty.IsZero() {
		netPnL = grossPnL.Sub(chargesAmount)

		if riskAmount.IsPositive() {
			rFactor = netPnL.Div(riskAmount).Round(2)
		}

		if netPnL.IsZero() {
			outcome = StatusBreakeven
		} else if netPnL.IsPositive() {
			outcome = StatusWin
		} else if netPnL.IsNegative() {
			outcome = StatusLoss
		}
	} else {
		// Trade is open.
		outcome = StatusOpen

		// The trade is still open but we have some realised gross pnl.
		if grossPnL.IsPositive() {
			netPnL = grossPnL
		}
	}

	if grossPnL.IsPositive() {
		chargesAsPercentageOfNetPnL = chargesAmount.Div(grossPnL).Mul(decimal.NewFromFloat(100)).Round(2)
	}

	if totalCost.IsPositive() {
		netReturnPercentage = netPnL.Div(totalCost).Mul(decimal.NewFromFloat(100)).Round(2)
	}

	result.Direction = direction
	result.Outcome = outcome
	result.OpenedAt = payload.Trades[0].Time
	result.ClosedAt = closedAt
	result.GrossPnLAmount = grossPnL.String()
	result.NetPnLAmount = netPnL.String()
	result.RFactor, _ = rFactor.Float64()
	result.NetReturnPercentage, _ = netReturnPercentage.Float64()
	result.ChargesAsPercentageOfNetPnL, _ = chargesAsPercentageOfNetPnL.Float64()

	if netQty.IsPositive() {
		result.OpenQuantity = netQty.String()
		result.OpenAveragePriceAmount = avgPrice.String()
	}

	return result, service.ErrNone, nil
}
