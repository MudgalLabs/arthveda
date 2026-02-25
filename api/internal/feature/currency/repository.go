package currency

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	All(ctx context.Context) ([]*Currency, error)
}

type Writer interface {
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type currencyRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *currencyRepository {
	return &currencyRepository{db}
}

func (r *currencyRepository) All(ctx context.Context) ([]*Currency, error) {
	sql := `
	SELECT code, name, fx_supported FROM currency;
	`

	rows, err := r.db.Query(ctx, sql)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}

	currencies := []*Currency{}
	for rows.Next() {
		var curr Currency

		err := rows.Scan(&curr.Code, &curr.Name, &curr.FXSuppported)
		if err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}

		currencies = append(currencies, &curr)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return currencies, nil
}
