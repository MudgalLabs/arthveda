package dashboard

import (
	"arthveda/internal/dbx"
	"arthveda/internal/feature/position"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
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
	baseSQL := `
		SELECT
			-- Win Rate (%)
			COALESCE(
				ROUND(
					100.0 * 
					SUM(CASE WHEN status IN ('win', 'breakeven', 'open') THEN 1 ELSE 0 END) 
					/ NULLIF(COUNT(*), 0),
					2
				), 
				0
			) AS win_rate,

			-- PnL
			COALESCE(SUM(gross_pnl_amount), 0) AS gross_pnl,
			COALESCE(SUM(net_pnl_amount), 0) AS net_pnl,
			COALESCE(SUM(total_charges_amount), 0) AS charges,

			-- Average R
			COALESCE(ROUND(AVG(r_factor), 2), 0) AS avg_r_factor,

			-- Average Win
			COALESCE(ROUND(AVG(CASE WHEN status = 'win' THEN net_pnl_amount END), 2), 0) AS avg_win,

			-- Average Loss
			COALESCE(ROUND(AVG(CASE WHEN status = 'loss' THEN net_pnl_amount END), 2), 0) AS avg_loss,

			-- Max Win
			COALESCE(MAX(net_pnl_amount), 0) AS max_win,

			-- Max Loss
			COALESCE(MIN(net_pnl_amount), 0) AS max_loss,

			-- Average R for Wins
			COALESCE(ROUND(AVG(CASE WHEN status IN ('win', 'breakeven') THEN r_factor END), 2), 0) AS avg_win_r_factor,

			-- Average R for Losses
			COALESCE(ROUND(AVG(CASE WHEN status = 'loss' THEN r_factor END), 2), 0) AS avg_loss_r_factor

		FROM
			position
	`

	b := dbx.NewSQLBuilder(baseSQL)

	b.AddCompareFilter("created_by", "=", userID)

	if payload.DateRange != nil {
		if payload.DateRange.From != nil {
			b.AddCompareFilter("opened_at", ">=", payload.DateRange.From)
		}
		if payload.DateRange.To != nil {
			b.AddCompareFilter("opened_at", "<=", payload.DateRange.To)
		}
	}

	sql, args := b.Build()

	var grossPnL, netPnL, charges, avgWin, avgLoss, maxWin, maxLoss string
	var winRate, avgRFactor, avgWinRFactor, avgLossRFactor float64

	err := r.db.QueryRow(ctx, sql, args...).Scan(&winRate, &grossPnL, &netPnL, &charges, &avgRFactor, &avgWin, &avgLoss, &maxWin, &maxLoss, &avgWinRFactor, &avgLossRFactor)
	if err != nil {
		return nil, fmt.Errorf("get general stats sql scan: %w", err)
	}

	lossRate := 100.0 - winRate

	streaksData := getWinAndLossStreaks(positions)

	result := &generalStats{
		WinRate:        winRate,
		LossRate:       lossRate,
		GrossPnL:       grossPnL,
		NetPnL:         netPnL,
		Charges:        charges,
		AvgRFactor:     avgRFactor,
		AvgWin:         avgWin,
		AvgLoss:        avgLoss,
		MaxWin:         maxWin,
		MaxLoss:        maxLoss,
		AvgWinRFactor:  avgWinRFactor,
		AvgLossRFactor: avgLossRFactor,

		streaks: streaks{
			WinStreak:  streaksData.WinStreak,
			LossStreak: streaksData.LossStreak,
		},
	}

	return result, nil
}
