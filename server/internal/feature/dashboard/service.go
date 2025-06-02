package dashboard

import (
	"arthveda/internal/common"
	"arthveda/internal/feature/position"
	"arthveda/internal/feature/trade"
	"arthveda/internal/logger"
	"arthveda/internal/service"
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Service struct {
	dashboardRepository ReadWriter
	positionRepository  position.ReadWriter
	tradeRepository     trade.ReadWriter
}

func NewService(dashboardRepository ReadWriter, positionRepository position.ReadWriter, tradeRepository trade.ReadWriter) *Service {
	return &Service{
		dashboardRepository,
		positionRepository,
		tradeRepository,
	}
}

type getDashboardReponse struct {
	GrossPnL          decimal.Decimal       `json:"gross_pnl"`
	NetPnL            decimal.Decimal       `json:"net_pnl"`
	WinRatePercentage float64               `json:"win_rate_percentage"`
	CumulativePnL     []CumulativePnLBucket `json:"cumulative_pnl"`
	Positions         []*position.Position  `json:"positions"`
}

func (s *Service) Get(ctx context.Context, userID uuid.UUID) (*getDashboardReponse, service.Error, error) {
	l := logger.FromCtx(ctx)

	generalStats, err := s.dashboardRepository.GetGeneralStats(ctx, userID)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	searchPositionPayload := position.SearchPayload{
		Filters: position.SearchFilter{
			CreatedBy: &userID,
		},
		Sort: common.Sorting{
			Field: "opened_at",
			Order: common.SortOrderASC,
		},
	}

	positions, _, err := s.positionRepository.Search(ctx, searchPositionPayload)
	if err != nil {
		return nil, service.ErrInternalServerError, err
	}

	for _, position := range positions {
		trades, err := s.tradeRepository.FindByPositionID(ctx, position.ID)
		if err != nil {
			return nil, service.ErrInternalServerError, err
		}
		position.Trades = trades
	}

	// Validate stored PnL values against runtime calculations
	var totalStoredGrossPnL, totalStoredNetPnL decimal.Decimal
	var totalCalculatedGrossPnL, totalCalculatedNetPnL decimal.Decimal

	for _, pos := range positions {
		// Add stored values to totals
		totalStoredGrossPnL = totalStoredGrossPnL.Add(pos.GrossPnLAmount)
		totalStoredNetPnL = totalStoredNetPnL.Add(pos.NetPnLAmount)

		// Recalculate PnL from trades
		if len(pos.Trades) > 0 {
			tradePayloads := position.ConvertTradesToCreatePayload(pos.Trades)
			computePayload := position.ComputePayload{
				RiskAmount: pos.RiskAmount,
				Trades:     tradePayloads,
			}
			computeResult := position.Compute(computePayload)

			// Add calculated values to totals
			totalCalculatedGrossPnL = totalCalculatedGrossPnL.Add(computeResult.GrossPnLAmount)
			totalCalculatedNetPnL = totalCalculatedNetPnL.Add(computeResult.NetPnLAmount)

			// Check for discrepancies in individual positions
			grossDiff := pos.GrossPnLAmount.Sub(computeResult.GrossPnLAmount)
			netDiff := pos.NetPnLAmount.Sub(computeResult.NetPnLAmount)

			if !grossDiff.IsZero() || !netDiff.IsZero() {
				// Log detailed trade information for significant discrepancies
				l.Errorw("Significant PnL discrepancy found in position",
					"position_id", pos.ID,
					"symbol", pos.Symbol,
					"stored_gross_pnl", pos.GrossPnLAmount,
					"calculated_gross_pnl", computeResult.GrossPnLAmount,
					"gross_diff", grossDiff,
					"stored_net_pnl", pos.NetPnLAmount,
					"calculated_net_pnl", computeResult.NetPnLAmount,
					"net_diff", netDiff,
					"trades_count", len(pos.Trades),
					"trades", pos.Trades,
				)
			}
		}
	}

	// Check total discrepancies
	totalGrossDiff := totalStoredGrossPnL.Sub(totalCalculatedGrossPnL)
	totalNetDiff := totalStoredNetPnL.Sub(totalCalculatedNetPnL)

	l.Infow("PnL validation summary",
		"total_stored_gross_pnl", totalStoredGrossPnL,
		"total_calculated_gross_pnl", totalCalculatedGrossPnL,
		"total_gross_diff", totalGrossDiff,
		"total_stored_net_pnl", totalStoredNetPnL,
		"total_calculated_net_pnl", totalCalculatedNetPnL,
		"total_net_diff", totalNetDiff,
		"positions_count", len(positions),
	)

	// Find the earliest and latest trade times
	var start, end time.Time
	for _, position := range positions {
		for _, trade := range position.Trades {
			if start.IsZero() || trade.Time.Before(start) {
				start = trade.Time
			}
			if end.IsZero() || trade.Time.After(end) {
				end = trade.Time
			}
		}
	}

	// Extend the end time to include the full bucket
	end = end.AddDate(0, 0, 1)

	// Use original positions since Compute now rounds to match database precision
	cumulativePnL := generateCumulativePnLBuckets(positions, common.BucketPeriodMonthly, start, end)

	result := &getDashboardReponse{
		GrossPnL:          generalStats.GrossPnL,
		NetPnL:            generalStats.NetPnL,
		WinRatePercentage: generalStats.WinRatePercentage,
		CumulativePnL:     cumulativePnL,
		Positions:         positions,
	}

	return result, service.ErrNone, nil
}
