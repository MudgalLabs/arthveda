package position

import (
	"arthveda/internal/dbx"
	"arthveda/internal/features/trade"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	Search(ctx context.Context, payload SearchPayload) ([]*Position, int, error)
}

type Writer interface {
	Create(ctx context.Context, position *Position) error
	Delete(ctx context.Context, ID uuid.UUID) error
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type searchFilter struct {
	UserID *uuid.UUID `query:"user_id"`
	Symbol *string    `query:"symbol"`
}

var sortableFields = []string{
	"p.symbol",
}

type positionRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *positionRepository {
	return &positionRepository{db}
}

func (r *positionRepository) Create(ctx context.Context, position *Position) error {
	const sql = `
        INSERT INTO position (
            id, user_id, created_at, updated_at, symbol, instrument, currency_code,
            risk_amount, charges_amount, direction, status, opened_at, closed_at,
            gross_pnl_amount, net_pnl_amount, r_factor, net_return_percentage,
            charges_as_percentage_of_net_pnl, open_quantity, open_average_price_amount
        )
        VALUES (
            @id, @user_id, @created_at, @updated_at, @symbol, @instrument, @currency_code,
            @risk_amount, @charges_amount, @direction, @status, @opened_at, @closed_at,
            @gross_pnl_amount, @net_pnl_amount, @r_factor, @net_return_percentage,
            @charges_as_percentage_of_net_pnl, @open_quantity, @open_average_price_amount
        )
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{
		"id":                               position.ID,
		"user_id":                          position.UserID,
		"created_at":                       position.CreatedAt,
		"updated_at":                       position.UpdatedAt,
		"symbol":                           position.Symbol,
		"instrument":                       position.Instrument,
		"currency_code":                    position.CurrencyCode,
		"risk_amount":                      position.RiskAmount,
		"charges_amount":                   position.ChargesAmount,
		"direction":                        position.Direction,
		"status":                           position.Status,
		"opened_at":                        position.OpenedAt,
		"closed_at":                        position.ClosedAt,
		"gross_pnl_amount":                 position.GrossPnLAmount,
		"net_pnl_amount":                   position.NetPnLAmount,
		"r_factor":                         position.RFactor,
		"net_return_percentage":            position.NetReturnPercentage,
		"charges_as_percentage_of_net_pnl": position.ChargesAsPercentageOfNetPnL,
		"open_quantity":                    position.OpenQuantity,
		"open_average_price_amount":        position.OpenAveragePriceAmount,
	})

	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

func (r *positionRepository) Delete(ctx context.Context, ID uuid.UUID) error {
	const sql = `
        DELETE FROM position
        WHERE id = @id
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{"id": ID})
	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

func (r *positionRepository) Search(ctx context.Context, p SearchPayload) ([]*Position, int, error) {
	baseSQL := `
        SELECT
            -- position columns
            p.id, p.user_id, p.created_at, p.updated_at,
            p.symbol, p.instrument, p.currency_code, p.risk_amount, p.charges_amount,
            p.direction, p.status, p.opened_at, p.closed_at,
            p.gross_pnl_amount, p.net_pnl_amount, p.r_factor, p.net_return_percentage,
            p.charges_as_percentage_of_net_pnl, p.open_quantity, p.open_average_price_amount,

            -- trade columns
            t.id, t.position_id, t.created_at, t.updated_at,
            t.kind, t.time, t.quantity, t.price
        FROM
			position p
        JOIN
			trade t ON p.id = t.position_id `

	b := dbx.NewSQLBuilder(baseSQL)

	if p.Filters.UserID != nil {
		b.AddCompareFilter("p.user_id", "=", p.Filters.UserID)
	}
	if p.Filters.Symbol != nil {
		b.AddCompareFilter("p.symbol", "=", p.Filters.Symbol)
	}

	b.AddSorting(p.Sort.Field, p.Sort.Order)
	b.AddPagination(p.Pagination.Limit, p.Pagination.Offset())

	sql, args := b.Build()

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	positionsMap := make(map[uuid.UUID]*Position)

	for rows.Next() {
		var (
			pos Position
			tr  trade.Trade
		)

		err := rows.Scan(
			// position
			&pos.ID, &pos.UserID, &pos.CreatedAt, &pos.UpdatedAt,
			&pos.Symbol, &pos.Instrument, &pos.CurrencyCode, &pos.RiskAmount, &pos.ChargesAmount,
			&pos.Direction, &pos.Status, &pos.OpenedAt, &pos.ClosedAt,
			&pos.GrossPnLAmount, &pos.NetPnLAmount, &pos.RFactor, &pos.NetReturnPercentage,
			&pos.ChargesAsPercentageOfNetPnL, &pos.OpenQuantity, &pos.OpenAveragePriceAmount,

			// trade
			&tr.ID, &tr.PositionID, &tr.CreatedAt, &tr.UpdatedAt,
			&tr.Kind, &tr.Time, &tr.Quantity, &tr.Price,
		)

		if err != nil {
			return nil, 0, fmt.Errorf("scan: %w", err)
		}

		// Attach to position map
		p := positionsMap[pos.ID]
		if p == nil {
			pos.Trades = []*trade.Trade{}
			positionsMap[pos.ID] = &pos
			p = &pos
		}

		// If a trade is present (LEFT JOIN can return NULLs)
		if tr.ID.String() != "" {
			p.Trades = append(p.Trades, &tr)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows err: %w", err)
	}

	// Convert map to slice
	positions := make([]*Position, 0, len(positionsMap))
	for _, p := range positionsMap {
		positions = append(positions, p)
	}

	// For count we need to only care about positions only. Without this, the count will
	// include the number of trades associated with all the positions as well.
	b.AddGroupBy("p.id")

	var total int
	countSQL, countArgs := b.Count()

	err = r.db.QueryRow(ctx, countSQL, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return positions, total, nil
}
