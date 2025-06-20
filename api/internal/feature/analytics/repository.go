package analytics

import (
	"arthveda/internal/dbx"
	"arthveda/internal/repository"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	GetByEmail(ctx context.Context, email string) (*Analytics, error)
}

type Writer interface {
	Create(ctx context.Context, analytics *Analytics) error
	Update(ctx context.Context, analytics *Analytics) error
	StartDemo(ctx context.Context, payload StartDemoPayload) (int, error)
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type filter struct {
	ID    *uuid.UUID
	Email *string
}

type analyticsRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *analyticsRepository {
	return &analyticsRepository{db}
}

func (r *analyticsRepository) GetByEmail(ctx context.Context, email string) (*Analytics, error) {
	analytics, err := r.findAnalytics(ctx, &filter{Email: &email})
	if err != nil {
		return nil, fmt.Errorf("find analytics: %w", err)
	}

	if len(analytics) == 0 {
		return nil, repository.ErrNotFound
	}

	return analytics[0], nil
}

func (r *analyticsRepository) findAnalytics(ctx context.Context, f *filter) ([]*Analytics, error) {
	baseSQL := `
		SELECT id, email, demo_start_count, created_at, updated_at
		FROM analytics
	`

	b := dbx.NewSQLBuilder(baseSQL)

	if v := f.ID; v != nil {
		b.AddCompareFilter("id", "=", v)
	}

	if v := f.Email; v != nil {
		b.AddCompareFilter("email", "=", v)
	}

	sql, args := b.Build()

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var analyticsRecords []*Analytics
	for rows.Next() {
		var a Analytics

		err := rows.Scan(&a.ID, &a.Email, &a.DemoStartCount, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}

		analyticsRecords = append(analyticsRecords, &a)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows: %w", err)
	}

	return analyticsRecords, nil
}

func (r *analyticsRepository) Create(ctx context.Context, analytics *Analytics) error {
	sql := `
		INSERT INTO analytics (id, email, demo_start_count, created_at, updated_at)
		VALUES (@id, @email, @demo_start_count, @created_at, @updated_at)
	`

	args := pgx.NamedArgs{
		"id":               analytics.ID,
		"email":            analytics.Email,
		"demo_start_count": analytics.DemoStartCount,
		"created_at":       analytics.CreatedAt,
		"updated_at":       analytics.UpdatedAt,
	}

	_, err := r.db.Exec(ctx, sql, args)
	if err != nil {
		return fmt.Errorf("exec: %w", err)
	}

	return nil
}

func (r *analyticsRepository) Update(ctx context.Context, analytics *Analytics) error {
	updatedAt := time.Now().UTC()
	analytics.UpdatedAt = &updatedAt

	sql := `
		UPDATE analytics
		SET demo_start_count = @demo_start_count, updated_at = @updated_at
		WHERE id = @id
	`

	args := pgx.NamedArgs{
		"id":               analytics.ID,
		"demo_start_count": analytics.DemoStartCount,
		"updated_at":       analytics.UpdatedAt,
	}

	_, err := r.db.Exec(ctx, sql, args)
	if err != nil {
		return fmt.Errorf("exec: %w", err)
	}

	return nil
}

func (r *analyticsRepository) StartDemo(ctx context.Context, payload StartDemoPayload) (int, error) {
	// Try to get existing analytics record
	analytics, err := r.GetByEmail(ctx, payload.Email)
	if err != nil {
		if err == repository.ErrNotFound {
			// Create new analytics record
			analytics, err = New(payload.Email)
			if err != nil {
				return 0, fmt.Errorf("new analytics: %w", err)
			}

			analytics.DemoStartCount = 1

			err = r.Create(ctx, analytics)
			if err != nil {
				return 0, fmt.Errorf("create analytics: %w", err)
			}

			return analytics.DemoStartCount, nil
		}
		return 0, fmt.Errorf("get by email: %w", err)
	}

	// Increment demo start count for existing record
	analytics.DemoStartCount++

	err = r.Update(ctx, analytics)
	if err != nil {
		return 0, fmt.Errorf("update analytics: %w", err)
	}

	return analytics.DemoStartCount, nil
}
