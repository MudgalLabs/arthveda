package position

import (
	"arthveda/internal/common"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	List(ctx context.Context, filter filter, pagination common.Pagination) ([]*Position, error)
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

type filter struct {
	Symbol string
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
        DELETE FROM "position"
        WHERE id = @id
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{"id": ID})
	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

func (r *positionRepository) List(ctx context.Context, filter filter, pagination common.Pagination) ([]*Position, error) {
	return nil, nil
}
