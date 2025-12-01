package minio

import (
	"backend/internal/util"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path/filepath"
	"strconv"
	"time"

	"github.com/minio/minio-go/v7"
)

type DatasetMinioDAO struct {
	minioClient *minio.Client
	core        *minio.Core
	Bucket      string
	BucketTemp  string
}

func NewDatasetMinioDAO(minioClient *minio.Client, core *minio.Core, bucket, bucketTemp string) *DatasetMinioDAO {
	return &DatasetMinioDAO{
		minioClient: minioClient,
		core:        core,
		Bucket:      bucket,
		BucketTemp:  bucketTemp,
	}
}

// 获取上传预览数据预签名 url
func (m *DatasetMinioDAO) GetUploadPreviewURL(userID uint) (string, error) {
	objectName := m.GenerateDatasetObjectName(userID, util.DATASET_EXTENSION)
	url, err := m.minioClient.PresignedPutObject(context.Background(), m.Bucket, objectName, util.DATASET_EXPIRE*time.Minute)
	if err != nil {
		return "", err
	}
	return url.String(), nil
}

// 生成数据集文件名（userID/时间戳）
func (m *DatasetMinioDAO) GenerateDatasetObjectName(userID uint, originalFilename string) string {
	ext := filepath.Ext(originalFilename)
	return fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
}

// 初始化分片上传
func (m *DatasetMinioDAO) InitiateMultipartUpload(objectName string) (string, error) {
	uploadID, err := m.core.NewMultipartUpload(context.Background(), m.Bucket, objectName, minio.PutObjectOptions{
		ContentType: "application/octet-stream",
	})
	if err != nil {
		return "", err
	}
	return uploadID, nil
}

// 获取某个分片的 URL
func (m *DatasetMinioDAO) GetPresignedPartURL(objectName, uploadId string, partNumber int) (string, error) {
	reqParams := make(url.Values)
	reqParams.Set("uploadId", uploadId)
	reqParams.Set("partNumber", strconv.Itoa(partNumber))
	url, err := m.core.PresignHeader(context.Background(), http.MethodPut, m.Bucket, objectName, util.DATASET_EXPIRE*time.Minute, reqParams,
		http.Header{"Content-Type": {"application/octet-stream"}})
	if err != nil {
		return "", err
	}
	return url.String(), nil
}

// 完成分片上传
func (m *DatasetMinioDAO) CompleteMultipartUpload(objectName, uploadId string, parts []minio.CompletePart) (string, error) {
	uploadInfo, err := m.core.CompleteMultipartUpload(context.Background(), m.Bucket, objectName, uploadId, parts, minio.PutObjectOptions{})
	return uploadInfo.Key, err
}

// 取消分片上传
func (m *DatasetMinioDAO) AbortMultipartUpload(objectName, uploadId string) error {
	return m.core.AbortMultipartUpload(context.Background(), m.Bucket, objectName, uploadId)
}

// 删除数据集
func (m *DatasetMinioDAO) DeleteObject(objectName string) error {
	return m.minioClient.RemoveObject(context.Background(), m.Bucket, objectName, minio.RemoveObjectOptions{})
}

// 下载免费数据集
func (m *DatasetMinioDAO) GetDownloadFreeDatasetURL(objectName string) (string, error) {
	url, err := m.minioClient.PresignedGetObject(context.Background(), m.Bucket, objectName, util.DATASET_EXPIRE*time.Minute, url.Values{})
	return url.String(), err
}

// 获取数据集读取器
func (m *DatasetMinioDAO) GetDatesetReader(ctx context.Context, objectName string) (io.Reader, error) {
	return m.minioClient.GetObject(ctx, m.Bucket, objectName, minio.GetObjectOptions{})
}

// 上传到 minio 临时桶
func (m *DatasetMinioDAO) UploadDatasetToTempBucket(ctx context.Context, pr *io.PipeReader, objectName string) error {
	_, err := m.minioClient.PutObject(ctx, m.BucketTemp, objectName, pr, -1, minio.PutObjectOptions{
		ContentType: "application/octet-stream",
	})
	return err
}

// 生成临时桶预签名 url
func (m *DatasetMinioDAO) GetTempBucketPresignedURL(ctx context.Context, objectName string) (string, error) {
	url, err := m.minioClient.PresignedGetObject(ctx, m.BucketTemp, objectName, util.DATASET_EXPIRE*time.Minute, url.Values{})
	return url.String(), err
}
