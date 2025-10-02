package upload

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Upload struct {
	ID           uuid.UUID        `db:"id"`
	UserID       uuid.UUID        `db:"user_id"`
	ResourceType ResourceTypeKind `db:"resource_type"`
	ResourceID   *uuid.UUID       `db:"resource_id"`
	ObjectKey    string           `db:"object_key"`
	FileName     string           `db:"file_name"`
	MimeType     string           `db:"mime_type"`
	SizeBytes    int64            `db:"size_bytes"`
	Status       Status           `db:"status"`
	CreatedAt    time.Time        `db:"created_at"`
}

type ResourceTypeKind string

const (
	ResourceTypeJournalEntry ResourceTypeKind = "journal_entry"
	// ResourceTypeAvatar ResourceTypeKind = "avatar"
)

func (r ResourceTypeKind) ForS3Key() string {
	switch r {
	case ResourceTypeJournalEntry:
		return "journal_entry_images"
	// case ResourceTypeAvatar:
	// 	return "avatars"
	default:
		return "unknown"
	}
}

type Status string

const (
	StatusPending Status = "pending"
	StatusActive  Status = "active"
	StatusDeleted Status = "deleted"
)

func NewUpload(userID uuid.UUID, resourceType ResourceTypeKind, resourceID *uuid.UUID, sizeBytes int64) (*Upload, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("failed to generate uuid: %w", err)
	}

	objectKey := fmt.Sprintf("user_%s/%s/upload_%s", userID.String(), resourceType.ForS3Key(), id.String())

	return &Upload{
		ID:           id,
		UserID:       userID,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		ObjectKey:    objectKey,
		SizeBytes:    sizeBytes,
		Status:       StatusPending,
		CreatedAt:    time.Now().UTC(),
	}, nil
}
