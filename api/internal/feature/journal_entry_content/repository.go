package journal_entry_content

import (
	"arthveda/internal/repository"
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	GetByJournalEntryID(ctx context.Context, journalEntryID uuid.UUID) (*JournalEntryContent, error)
}

type Writer interface {
	Upsert(ctx context.Context, journalEntryID uuid.UUID, content json.RawMessage) (*JournalEntryContent, error)
}

type ReadWriter interface {
	Reader
	Writer
}

type journalEntryContentRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *journalEntryContentRepository {
	return &journalEntryContentRepository{db}
}

func (r *journalEntryContentRepository) Upsert(ctx context.Context, entryID uuid.UUID, content json.RawMessage) (*JournalEntryContent, error) {
	journalEntryContent := JournalEntryContent{}

	err := r.db.QueryRow(
		ctx,
		`INSERT INTO journal_entry_content (journal_entry_id, content) VALUES ($1, $2)
		ON CONFLICT (journal_entry_id) DO UPDATE SET content = EXCLUDED.content
		RETURNING journal_entry_id, content`,
		entryID, content,
	).Scan(
		&journalEntryContent.EntryID, &journalEntryContent.Content,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert journal entry content: %w", err)
	}

	return &journalEntryContent, nil
}

func (r *journalEntryContentRepository) GetByJournalEntryID(ctx context.Context, journalEntryID uuid.UUID) (*JournalEntryContent, error) {
	journalEntryContent := JournalEntryContent{}

	err := r.db.QueryRow(
		ctx,
		`SELECT journal_entry_id, content FROM journal_entry_content WHERE journal_entry_id = $1`,
		journalEntryID,
	).Scan(
		&journalEntryContent.EntryID, &journalEntryContent.Content,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf("failed to get journal entry content by journal entry id: %w", err)
	}

	return &journalEntryContent, nil
}
