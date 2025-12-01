package minio

import (
	"backend/internal/model"
	"context"
	"github.com/minio/minio-go/v7"
)

type AdminMinioDAO struct {
	minioClient *minio.Client
	bucket      string
}

func NewAdminMinioDAO(minioClient *minio.Client, bucket string) *AdminMinioDAO {
	return &AdminMinioDAO{
		minioClient: minioClient,
		bucket:      bucket,
	}
}

// 删除数据集文件
func (d AdminMinioDAO) DeleteDatasetFile(objectName string) error {
	return d.minioClient.RemoveObject(context.Background(), d.bucket, objectName, minio.RemoveObjectOptions{})
}

// 获取minio buckets
func (d AdminMinioDAO) GetBuckets() ([]model.MinioBucketResponse, error) {
	buckets, err := d.minioClient.ListBuckets(context.Background())
	if err != nil {
		return nil, err
	}
	var res []model.MinioBucketResponse
	for _, bucket := range buckets {
		res = append(res, model.MinioBucketResponse{
			Name:         bucket.Name,
			CreationDate: bucket.CreationDate.String(),
		})
	}
	return res, nil
}

// 获取minio objects
func (d AdminMinioDAO) GetObjects(bucket string) ([]model.MinioObjectResponse, error) {
	var res []model.MinioObjectResponse
	for info := range d.minioClient.ListObjects(context.Background(), bucket, minio.ListObjectsOptions{}) {
		if info.Err != nil {
			return nil, info.Err
		}
		res = append(res, model.MinioObjectResponse{
			Name:         info.Key,
			Size:         info.Size,
			ETag:         info.ETag,
			LastModified: info.LastModified.String(),
			ContentType:  info.ContentType,
		})
	}
	return res, nil
}

// 删除minio objects
func (d AdminMinioDAO) DeleteMinioObject(bucket string, name string) error {
	return d.minioClient.RemoveObject(context.Background(), bucket, name, minio.RemoveObjectOptions{})
}
