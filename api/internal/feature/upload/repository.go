package upload

import (
	"arthveda/internal/repository"
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUploadByID(ctx context.Context, uploadID uuid.UUID) (*Upload, error)
}

type Writer interface {
	Create(ctx context.Context, upload *Upload) error
	SyncJournalEntryUploads(ctx context.Context, userID, journalEntryID uuid.UUID, activeUploadIDs []uuid.UUID) error
}

type ReadWriter interface {
	Reader
	Writer
}

type uploadRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *uploadRepository {
	return &uploadRepository{db}
}

func (r *uploadRepository) Create(ctx context.Context, upload *Upload) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO uploads (id, user_id, resource_type, resource_id, object_key, file_name, mime_type, size_bytes, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, upload.ID, upload.UserID, upload.ResourceType, upload.ResourceID, upload.ObjectKey, upload.FileName, upload.MimeType, upload.SizeBytes,
		upload.Status, upload.CreatedAt)
	if err != nil {
		return err
	}

	return nil
}

func (r *uploadRepository) FindUploadByID(ctx context.Context, uploadID uuid.UUID) (*Upload, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, user_id, resource_type, resource_id, object_key, file_name, mime_type, size_bytes, status, created_at
		FROM uploads
		WHERE id = $1
	`, uploadID)

	var upload Upload
	err := row.Scan(&upload.ID, &upload.UserID, &upload.ResourceType, &upload.ResourceID, &upload.ObjectKey,
		&upload.FileName, &upload.MimeType, &upload.SizeBytes, &upload.Status, &upload.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, repository.ErrNotFound
		}

		return nil, err
	}

	return &upload, nil
}

// FIXME: Use a transaction here to ensure atomicity.

func (r *uploadRepository) SyncJournalEntryUploads(ctx context.Context, userID, journalEntryID uuid.UUID, activeUploadIDs []uuid.UUID) error {
	// Update the given upload IDs to link to the journal entry and set status to 'active'
	_, err := r.db.Exec(ctx, `
		UPDATE uploads
		SET resource_id = $1, status = $2
		WHERE id = ANY($3) AND user_id = $4
	`, journalEntryID, StatusActive, activeUploadIDs, userID)
	if err != nil {
		return fmt.Errorf("failed to link uploads to journal entry: %w", err)
	}

	// Unlink any uploads previously linked to this journal entry that are not in the given upload IDs.
	// This handles the case where an image was removed from the journal entry.
	// The cron job will clean up unlinked uploads later.
	_, err = r.db.Exec(ctx, `
		UPDATE uploads
		SET resource_id = NULL, status = $1
		WHERE resource_type = $2 AND resource_id = $3 AND id != ALL($4) AND user_id = $5
	`, StatusDeleted, ResourceTypeJournalEntry, journalEntryID, activeUploadIDs, userID)
	if err != nil {
		return fmt.Errorf("failed to unlink previous uploads: %w", err)
	}

	return nil
}
