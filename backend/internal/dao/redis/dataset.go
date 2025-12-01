package redis

import (
	"backend/internal/util"
	"context"
	"github.com/go-redis/redis/v8"
	"time"
)

type DatasetRedisDAO struct {
	redis *redis.Client
}

func NewDatasetRedisDAO(redis *redis.Client) *DatasetRedisDAO {
	return &DatasetRedisDAO{
		redis: redis,
	}
}

// 记录进度
func (d DatasetRedisDAO) RecordDownloadTask(ctx context.Context, key string, progress uint) error {
	return d.redis.Set(ctx, key, progress, util.DATASET_EXPIRE*time.Minute).Err()
}

// 获取进度
func (d DatasetRedisDAO) GetDownloadTask(ctx context.Context, key string) (string, error) {
	return d.redis.Get(ctx, key).Result()
}

// 设置下载 url
func (d DatasetRedisDAO) SetDownloadURL(ctx context.Context, key string, url string) error {
	return d.redis.Set(ctx, key, url, util.DATASET_EXPIRE*time.Minute).Err()
}

// 获取下载 url
func (d DatasetRedisDAO) GetDownloadURL(ctx context.Context, key string) (string, error) {
	return d.redis.Get(ctx, key).Result()
}
