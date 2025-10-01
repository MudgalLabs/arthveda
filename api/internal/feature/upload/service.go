package upload

import (
	"arthveda/internal/env"
	"arthveda/internal/s3x"
	"arthveda/internal/service"
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
)

type Service struct {
	s3               *minio.Client
	uploadRepository ReadWriter
}

func NewService(s3 *minio.Client, ur ReadWriter) *Service {
	return &Service{
		s3:               s3,
		uploadRepository: ur,
	}
}

type PutPresignPayload struct {
	ResourceType ResourceTypeKind `json:"resource_type"` // e.g., 'journal', 'avatar'
	ResourceID   *uuid.UUID       `json:"resource_id"`   // optional, linked resource
	FileName     string           `json:"file_name"`
	MimeType     string           `json:"mime_type"`
	SizeBytes    int64            `json:"size_bytes"`
}

type PutPresignResult struct {
	UploadID    uuid.UUID `json:"upload_id"`
	UploadURL   string    `json:"upload_url"`
	DownloadURL string    `json:"download_url"`
}

func (s *Service) GetPutPresign(ctx context.Context, userID uuid.UUID, payload PutPresignPayload) (*PutPresignResult, service.Error, error) {
	upload, err := NewUpload(userID, payload.ResourceType, payload.ResourceID, payload.SizeBytes)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to create new upload: %w", err)
	}

	upload.FileName = payload.FileName
	upload.MimeType = payload.MimeType

	if err := s.uploadRepository.Create(ctx, upload); err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("upload repo create failed: %w", err)
	}

	// Generate presigned PUT URL
	putURL, err := s.s3.PresignedPutObject(
		ctx,
		s3x.BucketUserUploads,
		upload.ObjectKey,
		time.Second*60, // 60s expiry
	)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to generate upload URL: %w", err)
	}

	downloadURL := fmt.Sprintf("%s/v1/uploads/%s", env.API_URL, upload.ID.String())

	return &PutPresignResult{
		UploadID:    upload.ID,
		UploadURL:   putURL.String(),
		DownloadURL: downloadURL,
	}, service.ErrNone, nil
}

func (s *Service) GetGetPresign(ctx context.Context, userID uuid.UUID, uploadID uuid.UUID) (*url.URL, service.Error, error) {
	upload, err := s.uploadRepository.FindUploadByID(ctx, uploadID)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("upload repo find by id failed: %w", err)
	}

	if upload.UserID != userID {
		return nil, service.ErrUnauthorized, nil
	}

	presignedGetURL, err := s.s3.PresignedGetObject(
		ctx,
		s3x.BucketUserUploads,
		upload.ObjectKey,
		time.Hour*1, // 1 hour expiry
		nil,
	)
	if err != nil {
		return nil, service.ErrInternalServerError, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedGetURL, service.ErrNone, nil
}
