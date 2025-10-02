package s3x

import (
	"arthveda/internal/env"
	"arthveda/internal/logger"
	"context"
	"fmt"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const BucketUserUploads = "arthveda-user-uploads"

func Init() (*minio.Client, error) {
	l := logger.Get()

	l.Info("connecting to s3")

	fmt.Println("S3 URL:", env.S3_URL)
	fmt.Println("S3 Access Key:", env.S3_ACCESS_KEY)
	fmt.Println("S3 Secret Key:", env.S3_SECRET_KEY) // Do not print secret key for security reasons

	client, err := minio.New(env.S3_URL, &minio.Options{
		Creds:  credentials.NewStaticV4(env.S3_ACCESS_KEY, env.S3_SECRET_KEY, ""),
		Secure: false,
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
			l.Debugf("Bucket %s already exists", BucketUserUploads)
		} else {
			l.Fatalf("Failed to create bucket %s: %v", BucketUserUploads, err)
		}
	} else {
		l.Infof("Successfully created bucket %s", BucketUserUploads)
	}

	return client, nil
}
