package broker

import (
	"arthveda/internal/dbx"
	"arthveda/internal/repository"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	GetByID(ctx context.Context, id uuid.UUID) (*Broker, error)
	GetByName(ctx context.Context, name string) (*Broker, error)
	List(ctx context.Context) ([]*Broker, error)
}

type Writer interface {
	Create(ctx context.Context, broker *Broker) error
}

type ReadWriter interface {
	Reader
	Writer
}

type brokerRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *brokerRepository {
	return &brokerRepository{db}
}

type filters struct {
	ID   *uuid.UUID
	Name *string
}

func (r *brokerRepository) Create(ctx context.Context, broker *Broker) error {
	const sql = `
		INSERT INTO broker (id, name)
		VALUES ($1, $2)
	`

	_, err := r.db.Exec(ctx, sql, broker.ID, broker.Name)
	if err != nil {
		return fmt.Errorf("create broker: %w", err)
	}

	return nil
}

func (r *brokerRepository) GetByID(ctx context.Context, id uuid.UUID) (*Broker, error) {
	filter := filters{ID: &id}
	brokers, err := r.findBrokers(ctx, filter)

	if err != nil {
		return nil, fmt.Errorf("get broker by ID: %w", err)
	}

	if len(brokers) == 0 {
		return nil, repository.ErrNotFound
	}

	return brokers[0], nil
}

func (r *brokerRepository) GetByName(ctx context.Context, name string) (*Broker, error) {
	filter := filters{Name: &name}
	brokers, err := r.findBrokers(ctx, filter)

	if err != nil {
		return nil, fmt.Errorf("get broker by name: %w", err)
	}

	if len(brokers) == 0 {
		return nil, repository.ErrNotFound
	}

	return brokers[0], nil
}

func (r *brokerRepository) List(ctx context.Context) ([]*Broker, error) {
	filter := filters{} // Empty filter to fetch all brokers
	brokers, err := r.findBrokers(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("repository list: %w", err)
	}

	return brokers, nil
}

func (r *brokerRepository) findBrokers(ctx context.Context, f filters) ([]*Broker, error) {
	baseSQL := "SELECT id, name FROM broker"
	builder := dbx.NewSQLBuilder(baseSQL)

	if v := f.ID; v != nil {
		builder.AddCompareFilter("id", "=", v)
	}

	if v := f.Name; v != nil {
		builder.AddCompareFilter("name", "=", v)
	}

	builder.AddSorting("name", "ASC")

	sql, args := builder.Build()

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	var brokers []*Broker
	for rows.Next() {
		var broker Broker
		if err := rows.Scan(&broker.ID, &broker.Name); err != nil {
			return nil, fmt.Errorf("scan broker: %w", err)
		}
		brokers = append(brokers, &broker)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return brokers, nil
}
