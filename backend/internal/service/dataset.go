package service

import (
	"backend/internal/config"
	"backend/internal/dao/minio"
	"backend/internal/dao/mongo"
	"backend/internal/dao/mysql"
	"backend/internal/dao/redis"
	"backend/internal/model"
	"backend/internal/util"
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"strconv"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	minio2 "github.com/minio/minio-go/v7"
)

type DatasetService struct {
	datasetDAO      *mysql.DatasetDAO
	outboxDAO       *mysql.OutboxDAO
	datasetMongoDAO *mongo.DatasetsPreviewDAO
	datasetRedisDAO *redis.DatasetRedisDAO
	rankRedisDAO    *redis.RankRedisDAO
	datasetMinioDAO *minio.DatasetMinioDAO
	userStatsDAO    *mysql.UserStatsDAO
	db              *gorm.DB
}

func NewDatasetService(datasetDAO *mysql.DatasetDAO, outboxDAO *mysql.OutboxDAO, datasetMongoDAO *mongo.DatasetsPreviewDAO, datasetRedisDAO *redis.DatasetRedisDAO, rankRedisDAO *redis.RankRedisDAO, datasetMinioDAO *minio.DatasetMinioDAO, userStatsDAO *mysql.UserStatsDAO, db *gorm.DB) *DatasetService {
	return &DatasetService{
		datasetDAO:      datasetDAO,
		outboxDAO:       outboxDAO,
		datasetMongoDAO: datasetMongoDAO,
		datasetRedisDAO: datasetRedisDAO,
		rankRedisDAO:    rankRedisDAO,
		datasetMinioDAO: datasetMinioDAO,
		userStatsDAO:    userStatsDAO,
		db:              db,
	}
}

// 存入预览数据
func (s DatasetService) SavePreviewData(req *model.UploadPreviewRequest) error {
	return s.datasetMongoDAO.SavePreviewData(req)
}

// 获取上传数据集预签名 url
func (s DatasetService) GetUploadPreviewURL(userID uint) (string, error) {
	return s.datasetMinioDAO.GetUploadPreviewURL(userID)
}

// 初始化分片上传 -- 1
func (s DatasetService) InitiateMultipartUpload(objectName string) (string, string, error) {
	uploadId, err := s.datasetMinioDAO.InitiateMultipartUpload(objectName)
	if err != nil {
		return "", "", err
	}
	return uploadId, objectName, nil
}

// 获取某个分片的上传 URL -- 2
func (s DatasetService) GetPresignedPartURL(objectName, uploadId string, partNumber int) (string, error) {
	return s.datasetMinioDAO.GetPresignedPartURL(objectName, uploadId, partNumber)
}

// 完成分片上传 -- 3
func (s DatasetService) CompleteMultipartUpload(objectName, uploadId string, parts []minio2.CompletePart) (string, error) {
	return s.datasetMinioDAO.CompleteMultipartUpload(objectName, uploadId, parts)
}

// 取消分片上传
func (s DatasetService) AbortMultipartUpload(objectName, uploadId string) error {
	return s.datasetMinioDAO.AbortMultipartUpload(objectName, uploadId)
}

// 上传数据集
func (s DatasetService) UploadDataset(m *model.UploadDatasetRequest, userID uint) (uint, error) {
	cfg := config.LoadConfig()
	bucket := cfg.MinIO.Buckets["datasets"]
	tx := s.db.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()
	datasetID, err := s.datasetDAO.UploadDataset(tx, m, bucket)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	if err = s.userStatsDAO.UpdateUserStatsTotalUploads(tx, userID); err != nil {
		tx.Rollback()
		return 0, err
	}

	if err = tx.Commit().Error; err != nil {
		tx.Rollback()
		return 0, err
	}
	// 1. 上传成功后写入最近上传排行榜（score=当前时间戳）
	// 2. 仅存最小字段，保持容量上限
	_ = s.rankRedisDAO.AppendLatest(map[string]interface{}{
		"id":       datasetID,
		"title":    m.Title,
		"category": m.Category,
		"isFree":   m.IsFree,
		"price":    m.Price,
	}, time.Now().Unix(), util.RANK_DEFAULT_LIMIT)
	return datasetID, nil
}

// 删除数据集和文件(minio、mongodb异步worker删除)
func (s DatasetService) DeleteDataset(m *model.DeleteDatasetRequest) error {
	tx := s.datasetDAO.DB().Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()
	// 删除数据集
	if err := s.datasetDAO.DeleteDataset(tx, m.DatasetID); err != nil {
		tx.Rollback()
		return err
	}

	// 删除预览数据
	if err := s.datasetMongoDAO.DeletePreviewData(m.ObjectName); err != nil {
		task := model.Outbox{
			EventType: "delete_mongo_preview",
			Payload:   fmt.Sprintf(`{"objectName": %s}`, m.ObjectName),
			Status:    "pending",
			CreatedAt: time.Now(),
		}

		if err = s.outboxDAO.InsertTask(tx, &task); err != nil {
			tx.Rollback()
			return err
		}
	}

	// 删除文件
	if err := s.datasetMinioDAO.DeleteObject(m.ObjectName); err != nil {
		task := model.Outbox{
			EventType: "delete_minio_object",
			Payload:   fmt.Sprintf(`{"objectName": "%s"}`, m.ObjectName),
			Status:    "pending",
			CreatedAt: time.Now(),
		}

		if err = s.outboxDAO.InsertTask(tx, &task); err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return err
	}
	return nil
}

// 获取数据集列表，支持分页、免费/付费、分类、搜索、文件大小等筛选
func (s *DatasetService) ListDatasets(page, limit, isFree int, category, search, fileSizeRange, priceRange string) ([]model.DatasetListResponse, int64, int, error) {
	filters := make(map[string]interface{})
	if isFree == 1 {
		filters["is_free"] = true
	} else if isFree == 0 {
		filters["is_free"] = false
	}
	if category != "" && category != "全部分类" {
		filters["category"] = category
	}
	if search != "" {
		filters["search"] = search
	}
	if fileSizeRange != "" && fileSizeRange != "all" {
		filters["fileSizeRange"] = fileSizeRange
	}
	if priceRange != "" && priceRange != "all" {
		filters["priceRange"] = priceRange
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	return s.datasetDAO.ListDatasets(page, limit, filters)
}

// 获取数据集详情
func (s DatasetService) GetDatasetDetail(datasetId uint) (model.DatasetListResponse, error) {
	return s.datasetDAO.GetDatasetDetail(datasetId)
}

// 作者的付费数据集
func (s DatasetService) GetAuthorPaidDatasets(authorWalletAddress string, page, limit int) ([]model.DatasetListResponse, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 3
	}
	return s.datasetDAO.GetAuthorPaidDatasets(authorWalletAddress, page, limit)
}

// 获取预览数据
func (s DatasetService) GetPreviewData(name string) (model.PreviewResponse, error) {
	return s.datasetMongoDAO.GetPreviewData(name)
}

// 下载免费数据集
func (s DatasetService) GetDownloadURL(userID, datasetID uint) (string, error) {
	tx := s.datasetDAO.DB().Begin()
	if tx.Error != nil {
		return "", tx.Error
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()
	// 获取对象名
	objectName, err := s.datasetDAO.GetObjectNameByDatasetIDTX(tx, datasetID)
	if err != nil {
		tx.Rollback()
		return "", err
	}
	// 添加下载记录
	if err = s.datasetDAO.AddDownloadRecord(tx, userID, datasetID); err != nil {
		tx.Rollback()
		return "", err
	}

	// 更新下载次数
	if err = s.datasetDAO.UpdateDownloadCount(tx, datasetID); err != nil {
		tx.Rollback()
		return "", err
	}

	// 更新用户统计数据
	if err = s.userStatsDAO.UpdateUserStatsTotalDownloads(tx, userID); err != nil {
		tx.Rollback()
		return "", err
	}

	// 获取下载链接
	url, err := s.datasetMinioDAO.GetDownloadFreeDatasetURL(objectName)
	if err != nil {
		tx.Rollback()
		return "", err
	}
	if err = tx.Commit().Error; err != nil {
		tx.Rollback()
		return "", err
	}
	return url, nil
}

// 下载付费数据集
func (s DatasetService) DownloadPaidDataset(userId, datasetId uint) (string, error) {
	ctx := context.Background()
	tx := s.datasetDAO.DB().Begin()
	if tx.Error != nil {
		return "", tx.Error
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()
	// 添加下载记录
	if err := s.datasetDAO.AddDownloadRecord(tx, userId, datasetId); err != nil {
		tx.Rollback()
		return "", err
	}

	// 更新下载次数
	if err := s.datasetDAO.UpdateDownloadCount(tx, datasetId); err != nil {
		tx.Rollback()
		return "", err
	}

	// 更新用户统计数据
	if err := s.userStatsDAO.UpdateUserStatsTotalDownloads(tx, userId); err != nil {
		tx.Rollback()
		return "", err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return "", err
	}

	urlKey := fmt.Sprintf("%s:%d-%d:url", util.PAID_DOWNLOAD_TASK_ID, userId, datasetId)
	if url, err := s.datasetRedisDAO.GetDownloadURL(ctx, urlKey); err == nil {
		util.Info("已缓存下载链接", zap.String("url", url))
		return url, nil
	}

	// 获取源对象名和文件大小
	objectName, fileSize, err := s.datasetDAO.GetObjectNameAndFileSizeByDatasetID(datasetId)
	if err != nil {
		util.Error("获取对象名和文件大小失败", zap.Error(err))
		return "", err
	}

	// 获取交易时间戳
	timestamp, err := s.datasetDAO.GetTransactionTimestamp(userId, datasetId)
	if err != nil {
		util.Error("获取交易时间戳失败", zap.Error(err))
		return "", err
	}

	// 获取源文件 Reader
	srcReader, err := s.datasetMinioDAO.GetDatesetReader(ctx, objectName)
	if err != nil {
		util.Error("获取源文件失败", zap.Error(err))
		return "", err
	}
	key := fmt.Sprintf("%s:%d-%d", util.PAID_DOWNLOAD_TASK_ID, userId, datasetId)
	// 初始化进度
	if err = s.datasetRedisDAO.RecordDownloadTask(ctx, key, 0); err != nil {
		util.Error("初始化下载任务进度失败", zap.Error(err))
		return "", err
	}
	cr := &util.CountingReader{R: srcReader}

	// pipe 用于流式处理：producer -> pw 写入，uploader 从 pr 读取上传
	pr, pw := io.Pipe()

	// 计算每 1% 更新步长
	var updateStep int64
	if fileSize <= 0 {
		updateStep = 1
	} else {
		updateStep = fileSize / 100
		if updateStep == 0 {
			updateStep = 1
		}
	}

	// Producer：边读边插指纹，写入 pipe
	go func() {
		defer func() {
			_ = pw.Close()
			if closer, ok := srcReader.(io.Closer); ok {
				_ = closer.Close()
			}
		}()

		br := bufio.NewReader(cr)
		lineIndex := 0
		lastBytes := int64(0)
		var localProgress uint = 0 // 0-99

		for {
			line, err := br.ReadString('\n')
			if len(line) > 0 {
				// 插入指纹
				pos := lineIndex % util.FINGERPRINT_GROUP_SIZE
				processedLine, ierr := util.InsertFingerprint(line, strconv.FormatInt(timestamp, 10), pos)
				if ierr != nil {
					_ = pw.CloseWithError(ierr)
					_ = s.datasetRedisDAO.RecordDownloadTask(ctx, key, 0)
					util.Error("插入指纹失败，终止处理", zap.Error(ierr))
					return
				}

				// 写入 pipe
				if _, ierr = pw.Write([]byte(processedLine)); ierr != nil {
					_ = pw.CloseWithError(ierr)
					_ = s.datasetRedisDAO.RecordDownloadTask(ctx, key, 0)
					util.Error("写 pipe 失败，终止处理", zap.Error(ierr))
					return
				}
				lineIndex++

				// 按字节更新进度
				if cr.Count-lastBytes >= updateStep {
					lastBytes = cr.Count
					if localProgress < 99 { // 保留 100 给上传完成标识
						localProgress++
						if rerr := s.datasetRedisDAO.RecordDownloadTask(ctx, key, localProgress); rerr != nil {
							_ = pw.CloseWithError(rerr)
							util.Error("记录下载任务进度失败", zap.Error(rerr))
							return
						}
					}
				}
			}

			if err == io.EOF {
				return
			}
			if err != nil {
				_ = pw.CloseWithError(err)
				_ = s.datasetRedisDAO.RecordDownloadTask(ctx, key, 0)
				util.Error("读取源文件失败，终止处理", zap.Error(err))
				return
			}
		}
	}()
	// 上传到 minio 临时桶
	go func() {
		err := s.datasetMinioDAO.UploadDatasetToTempBucket(ctx, pr, objectName)
		if err != nil {
			util.Error("上传到 minio 临时桶失败", zap.Error(err))
			_ = s.datasetRedisDAO.RecordDownloadTask(ctx, key, 0)
			return
		}

		util.Info("数据集上传到临时桶完成", zap.String("objectName", objectName))
		if rerr := s.datasetRedisDAO.RecordDownloadTask(ctx, key, 100); rerr != nil {
			util.Error("记录下载任务进度(100)失败", zap.Error(rerr))
			return
		}

		util.Info("数据集上传到临时桶完成", zap.String("objectName", objectName))
	}()

	// 1. 热门排行榜由定时任务维护，不做实时更新
	// 2. 其余处理流程保持不变
	util.Info("已异步开始处理下载任务", zap.String("datasetId", fmt.Sprintf("%d", datasetId)), zap.String("objectName", objectName))
	return objectName, nil
}

// 获取下载进度
func (s DatasetService) GetDownloadStatus(userId, datasetId uint, objectName string) (string, string, error) {
	ctx := context.Background()
	key := fmt.Sprintf("%s:%d-%d", util.PAID_DOWNLOAD_TASK_ID, userId, datasetId)
	fmt.Println("获取去下载进度：GetDownloadStatus = ", key)
	progress, err := s.datasetRedisDAO.GetDownloadTask(ctx, key)
	fmt.Println("service progress = ", progress)
	if err != nil {
		return "", "", err
	}

	if progress == "" {
		return "", "", errors.New("progress 不存在")
	}

	if progress != "100" {
		return "", progress, nil
	}

	url, err := s.datasetMinioDAO.GetTempBucketPresignedURL(ctx, objectName)
	if err != nil {
		return "", progress, err
	}

	// 缓存url
	urlKey := fmt.Sprintf("%s:%d-%d:url", util.PAID_DOWNLOAD_TASK_ID, userId, datasetId)
	if err = s.datasetRedisDAO.SetDownloadURL(ctx, urlKey, url); err != nil {
		return "", progress, err
	}

	return url, progress, nil
}

// 获取作者的数据集
func (s DatasetService) GetAuthorDatasets(address string, page int, limit int) ([]model.DatasetListResponse, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 5
	}
	return s.datasetDAO.GetAuthorDatasets(address, page, limit)
}
