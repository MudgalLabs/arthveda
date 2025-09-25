package journal_entry

import (
	"arthveda/internal/repository"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	GetForPosition(ctx context.Context, userID, positionID uuid.UUID) (*JournalEntry, error)
}

type Writer interface {
	UpsertForPosition(ctx context.Context, userID, positionID uuid.UUID) (*JournalEntry, error)
}

type ReadWriter interface {
	Reader
	Writer
}

type journalEntryRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *journalEntryRepository {
	return &journalEntryRepository{db}
}

func (r *journalEntryRepository) UpsertForPosition(ctx context.Context, userID, positionID uuid.UUID) (*JournalEntry, error) {
	now := time.Now().UTC()
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("failed to generate uuid: %w", err)
	}

	journalEntry := JournalEntry{
		ID:         id,
		UserID:     userID,
		Scope:      JournalEntryScopePosition,
		PositionID: &positionID,
		CreatedAt:  now,
		UpdatedAt:  &now,
	}

	query := `
		INSERT INTO journal_entry (id, user_id, scope, position_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, position_id, scope) DO UPDATE
		SET updated_at = EXCLUDED.updated_at
		RETURNING id, user_id, scope, position_id, created_at, updated_at
	`
	err = r.db.QueryRow(
		ctx, query, journalEntry.ID, journalEntry.UserID, journalEntry.Scope,
		journalEntry.PositionID, journalEntry.CreatedAt, journalEntry.UpdatedAt,
	).Scan(
		&journalEntry.ID, &journalEntry.UserID, &journalEntry.Scope, &journalEntry.PositionID,
		&journalEntry.CreatedAt, &journalEntry.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert journal entry: %w", err)
	}

	return &journalEntry, nil
}

func (r *journalEntryRepository) GetForPosition(ctx context.Context, userID, positionID uuid.UUID) (*JournalEntry, error) {
	query := `
		SELECT id, user_id, scope, position_id, created_at, updated_at
		FROM journal_entry
		WHERE user_id = $1 AND position_id = $2 AND scope = $3
	`
	journalEntry := JournalEntry{}

	err := r.db.QueryRow(ctx, query, userID, positionID, JournalEntryScopePosition).Scan(
		&journalEntry.ID, &journalEntry.UserID, &journalEntry.Scope, &journalEntry.PositionID,
		&journalEntry.CreatedAt, &journalEntry.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf("failed to get journal entry for position: %w", err)
	}

	return &journalEntry, nil
}
