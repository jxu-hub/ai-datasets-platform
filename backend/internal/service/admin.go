package service

import (
	"backend/internal/dao/minio"
	"backend/internal/dao/mongo"
	"backend/internal/dao/mysql"
	"backend/internal/model"
	"backend/internal/util"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type AdminService struct {
	adminDAO        *mysql.AdminDAO
	outboxDAO       *mysql.OutboxDAO
	datasetMongoDAO *mongo.DatasetsPreviewDAO
	adminMinioDAO   *minio.AdminMinioDAO
	db              *gorm.DB
}

func NewAdminService(adminDAO *mysql.AdminDAO, outboxDAO *mysql.OutboxDAO, datasetMongoDAO *mongo.DatasetsPreviewDAO, adminMinioDAO *minio.AdminMinioDAO, db *gorm.DB) *AdminService {
	return &AdminService{
		adminDAO:        adminDAO,
		outboxDAO:       outboxDAO,
		datasetMongoDAO: datasetMongoDAO,
		adminMinioDAO:   adminMinioDAO,
		db:              db,
	}
}

// 获取统计数据
func (s AdminService) GetStats() (int, int, int, error) {
	return s.adminDAO.GetStats()
}

// 获取仪表盘数据
func (s AdminService) GetDashboardAnalytics() (model.DashboardAnalytics, error) {
	// 计算月增长率
	monthlyGrowth, err := s.adminDAO.GetMonthlyGrowth()
	if err != nil {
		return model.DashboardAnalytics{}, err
	}
	// 计算用户增长趋势
	userGrowth, err := s.adminDAO.GetUserGrowth(util.USERS_GROWTH_MONTH)
	if err != nil {
		return model.DashboardAnalytics{}, err
	}
	// 计算本周交易量统计
	transactionVolume, err := s.adminDAO.GetTransactionVolume()
	if err != nil {
		return model.DashboardAnalytics{}, err
	}

	// 计算数据集分类分布
	categoryDistribution, err := s.adminDAO.GetCategoryDistribution()
	if err != nil {
		return model.DashboardAnalytics{}, err
	}

	return model.DashboardAnalytics{
		MonthlyGrowth:        monthlyGrowth,
		UserGrowth:           userGrowth,
		TransactionVolume:    transactionVolume,
		CategoryDistribution: categoryDistribution,
	}, nil
}

// 获取用户列表
func (s AdminService) GetUsers(page, limit int) (*[]model.UserResponse, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	return s.adminDAO.GetUsers(page, limit)
}

// 获取用户详情
func (s AdminService) GetUserInfo(userID int) (*model.UserResponse, *model.AdminUserStatsResponse, error) {
	return s.adminDAO.GetUserInfo(userID)
}

// 更新用户信息
func (s AdminService) UpdateUserInfo(userID int, m *model.AdminUpdateUserInfoRequest) error {
	return s.adminDAO.UpdateUserInfo(userID, m)
}

// 删除用户
func (s AdminService) DeleteUser(userID int) error {
	return s.adminDAO.DeleteUser(userID)
}

// 添加用户
func (s AdminService) AddUser(m *model.AdminAddUserRequest) error {
	// 加密密码
	passwordHash, err := util.HashPassword(m.Password)
	if err != nil {
		return err
	}
	m.Password = passwordHash
	// 添加用户
	if err := s.adminDAO.AddUser(m); err != nil {
		return err
	}
	return nil
}

// 获取数据集列表
func (s AdminService) GetDatasets(page int, limit int) ([]model.AdminDatasetListResponse, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	return s.adminDAO.GetDatasets(page, limit)
}

// 删除数据集
func (s AdminService) DeleteDataset(datasetID int) error {
	tx := s.db.Begin()
	if err := tx.Error; err != nil {
		return err
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 查询数据集文件名
	var objectName string
	if err := tx.Model(&model.Dataset{}).Where("id = ?", datasetID).Pluck("object_name", &objectName).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 删除数据集
	if err := s.adminDAO.DeleteDataset(tx, datasetID); err != nil {
		tx.Rollback()
		return err
	}

	task := &model.Outbox{
		EventType: "delete_minio_object",
		Payload:   fmt.Sprintf(`{"objectName": "%s"}`, objectName),
		Status:    "pending",
	}

	// 插入删除数据集文件任务
	if err := s.outboxDAO.InsertTask(tx, task); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return err
	}

	return nil
}

// 恢复删除的数据集
func (s AdminService) RestoreDataset(datasetID int) error {
	tx := s.db.Begin()
	if err := tx.Error; err != nil {
		return err
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 恢复数据集
	if err := s.adminDAO.RestoreDataset(tx, datasetID); err != nil {
		tx.Rollback()
		return err
	}

	// 查询数据集文件名
	var objectName string
	if err := tx.Model(&model.Dataset{}).Where("id = ?", datasetID).Pluck("object_name", &objectName).Error; err != nil {
		tx.Rollback()
		return err
	}
	fmt.Println("objectName = ", objectName)
	// 取消删除数据集文件任务
	if err := s.outboxDAO.CancelDeleteMinioObjectTask(tx, objectName); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return err
	}
	return nil
}

// 异步处理删除任务
func (s AdminService) ProcessOutboxTasks() {
	tasks, _ := s.outboxDAO.GetPendingTasks()
	var data struct {
		ObjectName string `json:"objectName"`
	}
	for _, task := range tasks {
		switch task.EventType {
		case "delete_mongo_preview":
			util.Info("删除预览数据")
			_ = json.Unmarshal([]byte(task.Payload), &data)
			if err := s.datasetMongoDAO.DeletePreviewData(data.ObjectName); err != nil {
				continue
			}
		case "delete_minio_object":
			util.Info("删除文件")
			_ = json.Unmarshal([]byte(task.Payload), &data)
			if err := s.adminMinioDAO.DeleteDatasetFile(data.ObjectName); err != nil {
				continue
			}
		}

		_ = s.outboxDAO.MarkTasksDone(task.ID)
	}
}

// 清理临时桶
func (s AdminService) CleanupTempBucket(bucket string, maxAgeHours int) error {
	objects, err := s.adminMinioDAO.GetObjects(bucket)
	if err != nil {
		return err
	}
	now := time.Now().Unix()
	for _, o := range objects {
		parts := strings.Split(o.Name, "_")
		if len(parts) < 2 {
			continue
		}
		tsPart := parts[1]
		idx := strings.Index(tsPart, ".")
		if idx != -1 {
			tsPart = tsPart[:idx]
		}
		ts, err := strconv.ParseInt(tsPart, 10, 64)
		if err != nil {
			continue
		}
		ageHours := (now - ts) / 3600
		if int(ageHours) >= maxAgeHours {
			_ = s.adminMinioDAO.DeleteMinioObject(bucket, o.Name)
		}
	}
	return nil
}

// 指纹检测
func (s AdminService) FingerprintDetect(file *multipart.FileHeader) (*model.AdminFingerprintDetectResponse, error) {
	start := time.Now()
	// 检测指纹
	detectionResult, err := util.VerifyFingerprint(file)
	if err != nil {
		return &model.AdminFingerprintDetectResponse{}, err
	}
	detectTime := time.Since(start).String()
	res := model.AdminFingerprintDetectResponse{
		MatchResult:   detectionResult,
		DetectionTime: detectTime,
	}
	// 添加指纹检测记录
	if err := s.adminDAO.CreateFingerprintDetectRecord(file.Filename, file.Size, detectionResult, detectTime); err != nil || detectionResult == "无指纹" {
		return &res, err
	}
	// 获取指纹地址
	fingerprintAddress, err := s.adminDAO.GetFingerprintAddressByTimeStamp(detectionResult)
	if err != nil {
		return &res, err
	}
	return &model.AdminFingerprintDetectResponse{
		MatchResult:   fingerprintAddress,
		DetectionTime: time.Since(start).String(),
	}, nil
}

// 获取指纹检测记录
func (s AdminService) GetDetectRecords(page int, limit int) ([]model.DetectRecordResponse, int64, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	return s.adminDAO.GetDetectRecords(page, limit)
}

// 获取minio buckets
func (s AdminService) GetMinioBuckets() ([]model.MinioBucketResponse, error) {
	return s.adminMinioDAO.GetBuckets()
}

// 获取minio objects
func (s AdminService) GetMinioObjects(bucket string) ([]model.MinioObjectResponse, error) {
	// 分页获取 使用ContinuationToken
	return s.adminMinioDAO.GetObjects(bucket)
}

// 删除minio object
func (s AdminService) DeleteMinioObject(bucket string, name string) error {
	return s.adminMinioDAO.DeleteMinioObject(bucket, name)
}
