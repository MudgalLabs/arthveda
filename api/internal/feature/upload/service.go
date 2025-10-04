package upload

import (
	"arthveda/internal/env"
	"arthveda/internal/logger"
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
	upload, err := New(userID, payload.ResourceType, payload.ResourceID, payload.SizeBytes)
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

func (s *Service) CleanupUploads(ctx context.Context) (int, service.Error, error) {
	l := logger.FromCtx(ctx)

	uploads, err := s.uploadRepository.FindUploadsToCleanup(ctx)
	if err != nil {
		return 0, service.ErrInternalServerError, fmt.Errorf("upload repo find uploads to cleanup failed: %w", err)
	}

	uploadIDs := make([]uuid.UUID, 0, len(uploads))
	objectsCh := make(chan minio.ObjectInfo, len(uploads))

	// Feed object keys into the channel
	go func() {
		defer close(objectsCh)
		for _, u := range uploads {
			uploadIDs = append(uploadIDs, u.ID)
			objectsCh <- minio.ObjectInfo{Key: u.ObjectKey}
		}
	}()

	// Collect errors from RemoveObjects
	var errs []error
	for rErr := range s.s3.RemoveObjects(ctx, s3x.BucketUserUploads, objectsCh, minio.RemoveObjectsOptions{}) {
		errs = append(errs, fmt.Errorf("failed to delete %s: %w", rErr.ObjectName, rErr.Err))
	}

	if len(errs) > 0 {
		return 0, service.ErrInternalServerError, fmt.Errorf("cleanup completed with %d errors: %v", len(errs), errs)
	}

	err = s.uploadRepository.DeleteByIDs(ctx, uploadIDs)
	if err != nil {
		l.Errorw("Failed to delete upload records after S3 cleanup", "error", err.Error())
		// Not returning error to avoid retrying S3 deletions.
	}

	return len(uploadIDs), service.ErrNone, nil
}
