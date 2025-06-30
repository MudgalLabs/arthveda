package dashboard

import (
	"arthveda/internal/feature/position"
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Reader interface {
	GetGeneralStats(ctx context.Context, userID uuid.UUID, payload GetDashboardPayload, positions []*position.Position) (*generalStats, error)
}

type Writer interface{}

type ReadWriter interface {
	Reader
	Writer
}

type dashboardRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *dashboardRepository {
	return &dashboardRepository{db}
}

type generalStats struct {
	streaks

	WinRate        float64 `json:"win_rate"`
	LossRate       float64 `json:"loss_rate"`
	GrossPnL       string  `json:"gross_pnl"`
	NetPnL         string  `json:"net_pnl"`
	Charges        string  `json:"charges"`
	AvgRFactor     float64 `json:"avg_r_factor"`
	AvgWin         string  `json:"avg_win"`
	AvgLoss        string  `json:"avg_loss"`
	MaxWin         string  `json:"max_win"`
	MaxLoss        string  `json:"max_loss"`
	AvgWinRFactor  float64 `json:"avg_win_r_factor"`
	AvgLossRFactor float64 `json:"avg_loss_r_factor"`
}

func (r *dashboardRepository) GetGeneralStats(ctx context.Context, userID uuid.UUID, payload GetDashboardPayload, positions []*position.Position) (*generalStats, error) {
	var winRate float64

	var grossPnL, netPnL, charges, avgRFactor, avgWinRFactor, avgLossRFactor, avgWin, avgLoss, maxWin, maxLoss decimal.Decimal

	var openTradesCount, settledTradesCount, winTradesCount, lossTradesCount int

	for _, p := range positions {
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
	}

	// Trades that are not open are considered settled.
	settledTradesCount = len(positions) - openTradesCount
	// Trades that are settled and not winning are considered losing.
	lossTradesCount = settledTradesCount - winTradesCount

	winRate = (float64(winTradesCount) / float64(settledTradesCount)) * 100.0
	lossRate := 100.0 - winRate

	avgWin = avgWin.Div(decimal.NewFromInt(int64(winTradesCount)))
	avgLoss = avgLoss.Div(decimal.NewFromInt(int64(lossTradesCount)))

	avgRFactor = avgRFactor.Div(decimal.NewFromInt(int64(settledTradesCount)))
	avgWinRFactor = avgWinRFactor.Div(decimal.NewFromInt(int64(winTradesCount)))
	avgLossRFactor = avgLossRFactor.Div(decimal.NewFromInt(int64(lossTradesCount)))

	streaksData := getWinAndLossStreaks(positions)

	result := &generalStats{
		WinRate:        winRate,
		LossRate:       lossRate,
		GrossPnL:       grossPnL.String(),
		NetPnL:         netPnL.String(),
		Charges:        charges.String(),
		AvgRFactor:     avgRFactor.Round(2).InexactFloat64(),
		AvgWin:         avgWin.String(),
		AvgLoss:        avgLoss.String(),
		MaxWin:         maxWin.String(),
		MaxLoss:        maxLoss.String(),
		AvgWinRFactor:  avgWinRFactor.Round(2).InexactFloat64(),
		AvgLossRFactor: avgLossRFactor.Round(2).InexactFloat64(),

		streaks: streaks{
			WinStreak:  streaksData.WinStreak,
			LossStreak: streaksData.LossStreak,
		},
	}

	return result, nil
}
