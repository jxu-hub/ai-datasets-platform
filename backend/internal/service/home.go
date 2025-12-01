package service

import (
	"backend/internal/dao/mysql"
	rds "backend/internal/dao/redis"
	"backend/internal/model"
	"backend/internal/util"
	"time"
)

type HomeService struct {
	homeDAO   *mysql.HomeDAO
	rankRedis *rds.RankRedisDAO
}

func NewHomeService(homeDAO *mysql.HomeDAO, rankRedis *rds.RankRedisDAO) *HomeService {
	return &HomeService{homeDAO: homeDAO, rankRedis: rankRedis}
}

func (s HomeService) GetPlatformStats() (int, int, int, error) {
	// 1. 读取MySQL统计数据（用户、数据集、交易）
	// 2. 返回聚合结果
	return s.homeDAO.GetPlatformStats()
}

func (s HomeService) GetHotRank(limit int) ([]model.DatasetListResponse, error) {
	// 1. 读取Redis热门榜 TopN JSON
	items, err := s.rankRedis.GetTopHotJSON(limit)
	if err != nil || len(items) == 0 {
		// 2.1 Redis无数据，触发一次刷新
		_ = s.RefreshHotRank(limit)
		items, _ = s.rankRedis.GetTopHotJSON(limit)
	}
	// 3. 映射最小字段
	out := make([]model.DatasetListResponse, 0, len(items))
	for _, it := range items {
		out = append(out, model.DatasetListResponse{
			ID:            uint(toInt(it["id"])),
			Title:         toStr(it["title"]),
			Category:      toStr(it["category"]),
			IsFree:        toBool(it["isFree"]),
			Price:         toFloat(it["price"]),
			DownloadCount: toInt(it["downloadCount"]),
		})
	}
	return out, nil
}

func (s HomeService) GetLatestRank(limit int) ([]model.DatasetListResponse, error) {
	// 1. 读取Redis最近上传榜 TopN JSON
	items, err := s.rankRedis.GetTopLatestJSON(limit)
	if err != nil || len(items) == 0 {
		// 2.1 Redis无数据，触发一次刷新
		_ = s.RefreshLatestRank(limit)
		items, _ = s.rankRedis.GetTopLatestJSON(limit)
	}
	// 3. 映射
	out := make([]model.DatasetListResponse, 0, len(items))
	for _, it := range items {
		unix := int64(toInt(it["createdAtUnix"]))
		if unix <= 0 {
			// 兼容直接缺失的情况
			unix = time.Now().Unix()
		}
		out = append(out, model.DatasetListResponse{
			ID:        uint(toInt(it["id"])),
			Title:     toStr(it["title"]),
			Category:  toStr(it["category"]),
			IsFree:    toBool(it["isFree"]),
			Price:     toFloat(it["price"]),
			CreatedAt: time.Unix(unix, 0).Format("2006-01-02T15:04:05Z07:00"),
		})
	}
	return out, nil
}

func (s HomeService) RefreshHotRank(limit int) error {
	// 1. 从 MySQL 取 TopN 下载量
	// 2. 组装最小字段 JSON
	// 3. 刷新 Redis 热门榜
	if limit <= 0 {
		limit = util.RANK_DEFAULT_LIMIT
	}
	datasets, err := s.homeDAO.GetTopByDownloads(limit)
	if err != nil {
		return err
	}
	items := make([]map[string]interface{}, 0, len(datasets))
	for _, d := range datasets {
		items = append(items, map[string]interface{}{
			"id": d.ID, "title": d.Title, "category": d.Category, "isFree": d.IsFree,
			"price": d.Price, "downloadCount": d.DownloadCount,
		})
	}
	return s.rankRedis.RefreshHotRank(items)
}

func (s HomeService) RefreshLatestRank(limit int) error {
	// 1. 从 MySQL 取 TopN 最新上传
	// 2. 组装最小字段 JSON
	// 3. 刷新 Redis 最近上传榜
	if limit <= 0 {
		limit = util.RANK_DEFAULT_LIMIT
	}
	datasets, err := s.homeDAO.GetLatestByCreatedAt(limit)
	if err != nil {
		return err
	}
	items := make([]map[string]interface{}, 0, len(datasets))
	for _, d := range datasets {
		// 1. 解析数据集创建时间（字符串→Unix秒）
		ts := parseTimeToUnix(d.CreatedAt)
		items = append(items, map[string]interface{}{
			"id": d.ID, "title": d.Title, "category": d.Category, "isFree": d.IsFree,
			"price": d.Price, "createdAtUnix": ts,
		})
	}
	return s.rankRedis.RefreshLatestRank(items, time.Now().Unix())
}

func parseTimeToUnix(s string) int64 {
	if s == "" {
		return time.Now().Unix()
	}
	if t, err := time.Parse("2006-01-02T15:04:05Z07:00", s); err == nil {
		return t.Unix()
	}
	// 兜底为当前时间（避免空值）
	return time.Now().Unix()
}

func toInt(v interface{}) int {
	switch t := v.(type) {
	case int:
		return t
	case int64:
		return int(t)
	case float64:
		return int(t)
	default:
		return 0
	}
}
func toStr(v interface{}) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
func toBool(v interface{}) bool {
	if b, ok := v.(bool); ok {
		return b
	}
	return false
}
func toFloat(v interface{}) float64 {
	switch t := v.(type) {
	case float64:
		return t
	case int:
		return float64(t)
	case int64:
		return float64(t)
	default:
		return 0
	}
}
