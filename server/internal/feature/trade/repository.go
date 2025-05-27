package trade

import (
	"arthveda/internal/repository"
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindByPositionID(ctx context.Context, positionID uuid.UUID) ([]*Trade, error)
	AllBrokerTradeIDs(ctx context.Context, brokerID uuid.UUID) ([]string, error)
}

type Writer interface {
	Create(ctx context.Context, trades []*Trade) ([]*Trade, error)
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type filter struct {
	PositionID *uuid.UUID
}

type tradeRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *tradeRepository {
	return &tradeRepository{db}
}

func (r *tradeRepository) Create(ctx context.Context, trades []*Trade) ([]*Trade, error) {
	if len(trades) == 0 {
		return nil, nil
	}

	rows := make([][]any, len(trades))
	var positionID *uuid.UUID = nil
	for i, t := range trades {
		if positionID == nil {
			positionID = &t.PositionID
		} else {
			// Making sure we don't end up creating trades for multiple positions.
			if *positionID != t.PositionID {
				return nil, errors.New("all trades must have same position ID but found different position IDs")
			}
		}

		rows[i] = []any{
			t.ID,
			t.PositionID,
			t.CreatedAt,
			t.UpdatedAt,
			t.Kind,
			t.Time,
			t.Quantity,
			t.Price,
			t.BrokerTradeID,
		}
	}

	_, err := r.db.CopyFrom(
		ctx,
		pgx.Identifier{"trade"},
		[]string{"id", "position_id", "created_at", "updated_at", "kind", "time", "quantity", "price", "broker_trade_id"},
		pgx.CopyFromRows(rows),
	)

	if err != nil {
		return nil, fmt.Errorf("batch insert: %w", err)
	}

	return trades, nil
}

func (r *tradeRepository) FindByPositionID(ctx context.Context, positionID uuid.UUID) ([]*Trade, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin: %w", err)
	}

	defer tx.Rollback(ctx)

	trades, err := r.findTrades(ctx, tx, &filter{PositionID: &positionID})
	if err != nil {
		return nil, fmt.Errorf("find trades: %w", err)
	}

	return trades, nil
}

func (r *tradeRepository) AllBrokerTradeIDs(ctx context.Context, brokerID uuid.UUID) ([]string, error) {
	sql := `
	SELECT trade.broker_trade_id
	FROM trade
	JOIN position ON position.id = trade.position_id
	WHERE position.broker_id = $1`

	rows, err := r.db.Query(ctx, sql, brokerID)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	var brokerTradeIDs []string
	for rows.Next() {
		var brokerTradeID *string
		if err := rows.Scan(&brokerTradeID); err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}

		// Only append non-nil BrokerTradeIDs
		if brokerTradeID != nil {
			brokerTradeIDs = append(brokerTradeIDs, *brokerTradeID)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return brokerTradeIDs, nil
}

func (r *tradeRepository) findTrades(ctx context.Context, tx pgx.Tx, f *filter) ([]*Trade, error) {
	var where []string
	args := make(pgx.NamedArgs)

	if v := f.PositionID; v != nil {
		where = append(where, "position_id = @position_id")
		args["position_id"] = v
	}

	sql := `
	SELECT id, position_id, created_at, updated_at, kind, time, quantity, price, broker_trade_id
	FROM trade ` + repository.WhereSQL(where)

	rows, err := tx.Query(ctx, sql, args)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	var trades []*Trade
	for rows.Next() {
		var trade Trade

		err := rows.Scan(
			&trade.ID,
			&trade.PositionID,
			&trade.CreatedAt,
			&trade.UpdatedAt,
			&trade.Kind,
			&trade.Time,
			&trade.Quantity,
			&trade.Price,
			&trade.BrokerTradeID,
		)

		if err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}

		trades = append(trades, &trade)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return trades, nil
}
