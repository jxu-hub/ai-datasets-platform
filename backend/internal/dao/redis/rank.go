package redis

import (
	"backend/internal/util"
	"context"
	"encoding/json"

	"github.com/go-redis/redis/v8"
)

type RankRedisDAO struct {
	redis *redis.Client
}

func NewRankRedisDAO(r *redis.Client) *RankRedisDAO {
	return &RankRedisDAO{redis: r}
}

func (d RankRedisDAO) RefreshHotRank(items []map[string]interface{}) error {
	// 1. 刷新热门榜：清空并批量写入最小字段 JSON，score=下载量
	ctx := context.Background()
	pipe := d.redis.TxPipeline()
	pipe.Del(ctx, util.RANK_DATASET_HOT)
	for _, it := range items {
		b, _ := json.Marshal(it)
		dl := 0.0
		if v, ok := it["downloadCount"].(int); ok {
			dl = float64(v)
		}
		if v, ok := it["downloadCount"].(float64); ok {
			dl = v
		}
		pipe.ZAdd(ctx, util.RANK_DATASET_HOT, &redis.Z{Score: dl, Member: string(b)})
	}
	_, err := pipe.Exec(ctx)
	return err
}

func (d RankRedisDAO) RefreshLatestRank(items []map[string]interface{}, nowUnix int64) error {
	// 1. 刷新最近上传榜：清空并批量写入最小字段 JSON，score=上传时间戳
	ctx := context.Background()
	pipe := d.redis.TxPipeline()
	pipe.Del(ctx, util.RANK_DATASET_LATEST)
	for _, it := range items {
		b, _ := json.Marshal(it)
		ts := nowUnix
		if v, ok := it["createdAtUnix"].(int64); ok {
			ts = v
		}
		if v, ok := it["createdAtUnix"].(float64); ok {
			ts = int64(v)
		}
		pipe.ZAdd(ctx, util.RANK_DATASET_LATEST, &redis.Z{Score: float64(ts), Member: string(b)})
	}
	_, err := pipe.Exec(ctx)
	return err
}

func (d RankRedisDAO) AppendLatest(item map[string]interface{}, ts int64, capLimit int) error {
	// 1. 追加最近上传单条记录，保持容量上限
	ctx := context.Background()
	b, _ := json.Marshal(item)
	if err := d.redis.ZAdd(ctx, util.RANK_DATASET_LATEST, &redis.Z{Score: float64(ts), Member: string(b)}).Err(); err != nil {
		return err
	}
	// 2. 裁剪保留前 capLimit 条
	size, _ := d.redis.ZCard(ctx, util.RANK_DATASET_LATEST).Result()
	if size > int64(capLimit) {
		// 移除最旧的成员（score 最小）
		_ = d.redis.ZRemRangeByRank(ctx, util.RANK_DATASET_LATEST, 0, size-int64(capLimit)-1).Err()
	}
	return nil
}

func (d RankRedisDAO) GetTopHotJSON(limit int) ([]map[string]interface{}, error) {
	// 1. 读取热门榜 TopN JSON 成员
	ctx := context.Background()
	res, err := d.redis.ZRevRange(ctx, util.RANK_DATASET_HOT, 0, int64(limit-1)).Result()
	if err != nil {
		return nil, err
	}
	out := make([]map[string]interface{}, 0, len(res))
	for _, s := range res {
		var m map[string]interface{}
		_ = json.Unmarshal([]byte(s), &m)
		out = append(out, m)
	}
	return out, nil
}

func (d RankRedisDAO) GetTopLatestJSON(limit int) ([]map[string]interface{}, error) {
	// 1. 读取最近上传榜 TopN JSON 成员
	ctx := context.Background()
	res, err := d.redis.ZRevRange(ctx, util.RANK_DATASET_LATEST, 0, int64(limit-1)).Result()
	if err != nil {
		return nil, err
	}
	out := make([]map[string]interface{}, 0, len(res))
	for _, s := range res {
		var m map[string]interface{}
		_ = json.Unmarshal([]byte(s), &m)
		out = append(out, m)
	}
	return out, nil
}
