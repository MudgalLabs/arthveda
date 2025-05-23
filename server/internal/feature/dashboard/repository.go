package dashboard

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

type Reader interface {
	Get(ctx context.Context, userID uuid.UUID) (*getDashboardReponse, error)
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

func (r *dashboardRepository) Get(ctx context.Context, userID uuid.UUID) (*getDashboardReponse, error) {
	pnlSQL := `
		SELECT
			COALESCE(SUM(p.gross_pnl_amount), 0) AS gross_pnl,
			COALESCE(SUM(p.net_pnl_amount), 0) AS net_pnl
		FROM
			position p
		WHERE
			p.created_by = $1;
	`

	var grossPnLStr, netPnLStr string

	err := r.db.QueryRow(ctx, pnlSQL, userID).Scan(&grossPnLStr, &netPnLStr)
	if err != nil {
		return nil, fmt.Errorf("pnl sql scan: %w", err)
	}

	grossPnL, err := decimal.NewFromString(grossPnLStr)
	if err != nil {
		return nil, fmt.Errorf("grossPnL parse: %w", err)
	}

	netPnL, err := decimal.NewFromString(netPnLStr)
	if err != nil {
		return nil, fmt.Errorf("netPnL parse: %w", err)
	}

	winRateSQL := `
		SELECT
			COALESCE(
				ROUND(
				100.0 *
				SUM(CASE WHEN status IN ('win', 'breakeven', 'open') THEN 1 ELSE 0 END) /
				NULLIF(COUNT(*), 0),
				2
			), 0) AS win_rate
		FROM
			position
		WHERE
			created_by = $1;
	`

	var winRatePercentage float64

	err = r.db.QueryRow(ctx, winRateSQL, userID).Scan(&winRatePercentage)
	if err != nil {
		return nil, fmt.Errorf("winrate sql scan: %w", err)
	}

	result := &getDashboardReponse{
		GrossPnL:          grossPnL,
		NetPnL:            netPnL,
		WinRatePercentage: winRatePercentage,
	}

	return result, nil
}
