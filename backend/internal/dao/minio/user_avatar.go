package minio

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/minio/minio-go/v7"
)

type UserMinioDAO struct {
	minioClient *minio.Client
	bucket      string
}

func NewUserMinioDAO(minioClient *minio.Client, bucket string) *UserMinioDAO {
	return &UserMinioDAO{
		minioClient: minioClient,
		bucket:      bucket,
	}
}

// 上传头像到指定桶
func (m *UserMinioDAO) UploadAvatarToBucket(userID uint, file multipart.File, fileSize int64, contentType, originalFilename string) (string, error) {
	ctx := context.Background()
	objectName := m.GenerateAvatarObjectName(userID, originalFilename)
	_, err := m.minioClient.PutObject(ctx, m.bucket, objectName, file, fileSize, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%s", m.bucket, objectName), nil
}

// 生成头像文件名（userID/时间戳）
func (m *UserMinioDAO) GenerateAvatarObjectName(userID uint, originalFilename string) string {
	ext := filepath.Ext(originalFilename)
	return fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
}
