package storage

import (
	"context"
	"fmt"
	"time"
	"vigi/internal/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
)

type Service interface {
	GetPresignedURL(ctx context.Context, key string, contentType string) (string, error)
	IsS3Enabled() bool
}

type ServiceImpl struct {
	logger        *zap.SugaredLogger
	cfg           *config.Config
	s3Client      *s3.Client
	presignClient *s3.PresignClient
}

func NewService(
	logger *zap.SugaredLogger,
	cfg *config.Config,
) (Service, error) {
	s := &ServiceImpl{
		logger: logger.Named("[storage-service]"),
		cfg:    cfg,
	}

	if s.IsS3Enabled() {
		if err := s.initS3Client(); err != nil {
			return nil, err
		}
	} else {
		s.logger.Warn("S3 is NOT enabled")
	}

	return s, nil
}

func (s *ServiceImpl) IsS3Enabled() bool {
	return s.cfg.S3Endpoint != "" && s.cfg.S3Bucket != "" && s.cfg.S3AccessKey != "" && s.cfg.S3SecretKey != ""
}

func (s *ServiceImpl) initS3Client() error {
	ctx := context.Background()

	cfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(s.cfg.S3Region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			s.cfg.S3AccessKey,
			s.cfg.S3SecretKey,
			"",
		)),
	)
	if err != nil {
		return fmt.Errorf("unable to load SDK config: %w", err)
	}

	s.s3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(s.cfg.S3Endpoint)
		o.UsePathStyle = true
		// Disable SSL if needed (e.g. for local testing with MinIO without certs)
		if s.cfg.S3DisableSSL {
			o.EndpointOptions.DisableHTTPS = true
		}
	})

	s.presignClient = s3.NewPresignClient(s.s3Client)

	return nil
}

func (s *ServiceImpl) GetPresignedURL(ctx context.Context, key string, contentType string) (string, error) {
	if !s.IsS3Enabled() {
		return "", fmt.Errorf("S3 is not enabled")
	}

	request, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.cfg.S3Bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(15 * time.Minute)
	})

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return request.URL, nil
}
