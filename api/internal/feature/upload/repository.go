package upload

import (
	"arthveda/internal/repository"
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	FindUploadByID(ctx context.Context, uploadID uuid.UUID) (*Upload, error)
}

type Writer interface {
	Create(ctx context.Context, upload *Upload) error
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
		SELECT id, user_id, resource_type, resource_id, object_key, file_name, mime_type, size_bytes, status, created_at, updated_at
		FROM uploads
		WHERE id = $1
	`, uploadID)

	var upload Upload
	err := row.Scan(&upload.ID, &upload.UserID, &upload.ResourceType, &upload.ResourceID, &upload.ObjectKey,
		&upload.FileName, &upload.MimeType, &upload.SizeBytes, &upload.Status, &upload.CreatedAt, &upload.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, repository.ErrNotFound
		}

		return nil, err
	}

	return &upload, nil
}
