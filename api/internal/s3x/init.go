package s3x

import (
	"arthveda/internal/env"
	"arthveda/internal/logger"
	"context"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const BucketUserUploads = "arthveda-user-uploads"

func Init() (*minio.Client, error) {
	l := logger.Get()

	l.Info("connecting to s3")

	client, err := minio.New(env.S3_URL, &minio.Options{
		Creds:  credentials.NewStaticV4(env.S3_ACCESS_KEY, env.S3_SECRET_KEY, ""),
		Secure: env.IsProd(),
	})
	if err != nil {
		return nil, err
	}

	l.Info("connected to s3")

	ctx := context.Background()

	err = client.MakeBucket(ctx, BucketUserUploads, minio.MakeBucketOptions{})
	if err != nil {
		exists, errBucketExists := client.BucketExists(ctx, BucketUserUploads)
		if errBucketExists == nil && exists {
			l.Infof("Bucket %s already exists", BucketUserUploads)
		} else {
			l.Fatalf("Failed to create bucket %s: %v", BucketUserUploads, err)
		}
	} else {
		l.Infof("Successfully created bucket %s", BucketUserUploads)
	}

	return client, nil
}
