package s3x

import (
	"arthveda/internal/env"
	"arthveda/internal/logger"
	"context"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const BucketUserUploads = "arthveda-user-uploads"

func Init() (*minio.Client, error) {
	l := logger.Get()

	l.Info("connecting to s3")

	client, err := minio.New(env.S3_URL, &minio.Options{
		Creds:  credentials.NewStaticV4(env.S3_ACCESS_KEY, env.S3_SECRET_KEY, ""),
		Secure: env.S3_URL == "s3.arthveda.app",
	})
	if err != nil {
		return nil, err
	}

	ctx := context.Background()

	_, err = client.HealthCheck(time.Second)
	if err != nil {
		l.Fatalf("Failed to start healtcheck: %v", err)
	}

	isOnline := client.IsOnline()
	if isOnline {
		l.Info("connected to s3")
	} else {
		l.Fatal("failed to connect to s3")
	}

	err = client.MakeBucket(ctx, BucketUserUploads, minio.MakeBucketOptions{})
	if err != nil {
		exists, errBucketExists := client.BucketExists(ctx, BucketUserUploads)
		if errBucketExists == nil && exists {
			l.Debugf("Bucket %s already exists", BucketUserUploads)
		} else {
			l.Fatalf("Failed to create bucket %s: %v", BucketUserUploads, err)
		}
	} else {
		l.Infof("Successfully created bucket %s", BucketUserUploads)
	}

	return client, nil
}
