package mysql

import (
	"backend/internal/model"
	"backend/internal/util"
	"gorm.io/gorm"
	"time"
)

type AdminDAO struct {
	db *gorm.DB
}

func NewAdminDAO(db *gorm.DB) *AdminDAO {
	return &AdminDAO{db: db}
}

// 获取统计数据
func (d AdminDAO) GetStats() (int, int, int, error) {
	var totalUsers, totalDatasets, totalTransactions int64
	err := d.db.Table("users").Count(&totalUsers).Error
	err = d.db.Table("datasets").Count(&totalDatasets).Error
	err = d.db.Table("transactions").Count(&totalTransactions).Error
	return int(totalUsers), int(totalDatasets), int(totalTransactions), err
}

// 获取月度增长率
func (d AdminDAO) GetMonthlyGrowth() (model.MonthlyGrowth, error) {
	now := time.Now()
	lastMonth := now.AddDate(0, -1, 0).Format("2006-01")
	thisMonth := now.Format("2006-01")

	// 本月用户数
	var thisMonthUsers, lastMonthUsers int64
	if err := d.db.Table("users").Where("created_at >= ?", thisMonth).Count(&thisMonthUsers).Error; err != nil {
		return model.MonthlyGrowth{}, err
	}
	if err := d.db.Table("users").Where("created_at >= ? AND created_at < ?", lastMonth, thisMonth).Count(&lastMonthUsers).Error; err != nil {
		return model.MonthlyGrowth{}, err
	}
	// 本月数据集数
	var thisMonthDatasets, lastMonthDatasets int64
	if err := d.db.Table("datasets").Where("created_at >= ?", thisMonth).Count(&thisMonthDatasets).Error; err != nil {
		return model.MonthlyGrowth{}, err
	}
	if err := d.db.Table("datasets").Where("created_at >= ? AND created_at < ?", lastMonth, thisMonth).Count(&lastMonthDatasets).Error; err != nil {
		return model.MonthlyGrowth{}, err
	}

	// 本月交易数
	var thisMonthTransactions, lastMonthTransactions int64
	if err := d.db.Table("transactions").Where("created_at >= ?", thisMonth).Count(&thisMonthTransactions).Error; err != nil {
		return model.MonthlyGrowth{}, err
	}
	if err := d.db.Table("transactions").Where("created_at >= ? AND created_at < ?", lastMonth, thisMonth).Count(&lastMonthTransactions).Error; err != nil {
		return model.MonthlyGrowth{}, err
	}

	return model.MonthlyGrowth{
		Users:        util.CalculateGrowthRate(int(thisMonthUsers), int(lastMonthUsers)),
		Datasets:     util.CalculateGrowthRate(int(thisMonthDatasets), int(lastMonthDatasets)),
		Transactions: util.CalculateGrowthRate(int(thisMonthTransactions), int(lastMonthTransactions)),
	}, nil
}

// 获取用户增长趋势
func (d AdminDAO) GetUserGrowth(months int) ([]model.GrowthData, error) {
	var growthData []model.GrowthData

	for i := months - 1; i >= 0; i-- {
		month := time.Now().AddDate(0, -i, 0)
		monthEnd := time.Date(month.Year(), month.Month()+1, 0, 23, 59, 59, 999999999, month.Location())
		monthName := month.Format("1月")
		var users int64

		// 累计用户数
		if err := d.db.Table("users").Where("created_at <= ?", monthEnd).Count(&users).Error; err != nil {
			return nil, err
		}

		growthData = append(growthData, model.GrowthData{
			Name:  monthName,
			Users: int(users),
		})
	}
	return growthData, nil
}

// 获取本周交易量统计
func (d AdminDAO) GetTransactionVolume() ([]model.TransactionVolumeData, error) {
	var transactionVolumeData []model.TransactionVolumeData
	weekdays := []string{"周一", "周二", "周三", "周四", "周五", "周六", "周日"}

	for i := 0; i < 7; i++ {
		date := time.Now().AddDate(0, 0, -7+i)
		dateStr := date.Format("2006-01-02")
		var revenue float64

		if err := d.db.Table("transactions").Where("DATE(created_at) = ?", dateStr).Select("COALESCE(sum(amount), 0)").Scan(&revenue).Error; err != nil {
			return nil, err
		}

		transactionVolumeData = append(transactionVolumeData, model.TransactionVolumeData{
			Name:    weekdays[i],
			Revenue: revenue,
		})
	}
	return transactionVolumeData, nil
}

// 获取数据集分类分布
func (d AdminDAO) GetCategoryDistribution() ([]model.CategoryDistributionData, error) {
	var categoryDistributionData []model.CategoryDistributionData
	if err := d.db.Table("datasets").Select("category as name, count(*) as value").Group("category").Order("value desc").Scan(&categoryDistributionData).Error; err != nil {
		return nil, err
	}
	return categoryDistributionData, nil
}

// 获取用户列表
func (d AdminDAO) GetUsers(page, limit int) (*[]model.UserResponse, int64, int, error) {
	db := d.db.Model(&model.User{})
	var total int64
	db.Count(&total)
	offset := (page - 1) * limit

	var users []model.User
	err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error
	resps := make([]model.UserResponse, len(users))
	for i, user := range users {
		resps[i] = user.ToResponse()
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return &resps, total, totalPages, err
}

// 获取用户详情
func (d AdminDAO) GetUserInfo(userID int) (*model.UserResponse, *model.AdminUserStatsResponse, error) {
	var user model.User
	// 获取用户基本信息
	if err := d.db.Where("id = ?", userID).Find(&user).Error; err != nil {
		return nil, nil, err
	}
	resp := user.ToResponse()

	// 获取用户统计数据
	var stats model.AdminUserStatsResponse
	if err := d.db.Table("user_stats").Where("wallet_address = ?", resp.WalletAddress).Find(&stats).Error; err != nil {
		return nil, nil, err
	}
	return &resp, &stats, nil
}

// 更新用户信息
func (d AdminDAO) UpdateUserInfo(userID int, m *model.AdminUpdateUserInfoRequest) error {
	return d.db.Model(&model.User{}).Where("id = ?", userID).Updates(m).Error
}

// 删除用户
func (d AdminDAO) DeleteUser(userID int) error {
	return d.db.Delete(&model.User{}, userID).Error
}

// 添加用户
func (d AdminDAO) AddUser(m *model.AdminAddUserRequest) error {
	user := model.User{
		Username:     m.Username,
		Email:        m.Email,
		PasswordHash: m.Password,
	}
	return d.db.Create(&user).Error
}

//// 不连表
//// 获取数据集列表
//func (d AdminDAO) GetDatasets(page int, limit int) ([]model.DatasetListResponse, int64, int, error) {
//	db := d.db.Model(&model.Dataset{})
//
//	var total int64
//	db.Count(&total)
//	offset := (page - 1) * limit
//
//	var datasets []model.DatasetListResponse
//	err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&datasets).Error
//	totalPages := int((total + int64(limit) - 1) / int64(limit))
//	return datasets, total, totalPages, err
//}

// 连表
// 获取数据集列表
func (d AdminDAO) GetDatasets(page int, limit int) ([]model.AdminDatasetListResponse, int64, int, error) {
	// 连表查询，查询数据集列表所有数据并根据其中的钱包地址查询user表中的用户名
	db := d.db.Table("datasets").
		Select("datasets.*, users.username").
		Joins("left join users on datasets.author_wallet_address = users.wallet_address").
		Order("datasets.created_at DESC")

	var total int64
	db.Count(&total)
	offset := (page - 1) * limit

	var datasets []model.AdminDatasetListResponse
	err := db.Limit(limit).Offset(offset).Find(&datasets).Error
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return datasets, total, totalPages, err
}

// 删除数据集
func (d AdminDAO) DeleteDataset(tx *gorm.DB, datasetID int) error {
	return tx.Model(&model.Dataset{}).Where("id = ?", datasetID).Update("deleted_at", time.Now()).Error
}

// 恢复删除的数据集
func (d AdminDAO) RestoreDataset(tx *gorm.DB, datasetID int) error {
	// Unscoped() 禁用deleted_at = NULL 的查询
	return tx.Model(&model.Dataset{}).Unscoped().Where("id = ?", datasetID).Update("deleted_at", gorm.Expr("NULL")).Error
}

// 添加指纹检测记录
func (d AdminDAO) CreateFingerprintDetectRecord(filename string, fileSize int64, detectionResult, detectTime string) error {
	record := model.DetectRecord{
		DatasetID:       nil,
		Filename:        filename,
		FileSize:        fileSize,
		Timestamp:       nil,
		DetectionTime:   detectTime,
		DetectionResult: detectionResult,
	}
	if detectionResult == "无指纹" {
		return d.db.Create(&record).Error
	}
	// 有指纹 => detectionResult是时间戳
	var result struct {
		BuyerWalletAddress string
		DatasetID          int
	}
	// 根据时间戳查询买家钱包地址和数据集id
	if err := d.db.Table("transactions").Where("block_timestamp = ?", detectionResult).Pluck("buyer_wallet_address, dataset_id", &result).Error; err != nil {
		return err
	}
	record.Timestamp = &detectionResult
	if result.BuyerWalletAddress == "" {
		record.DetectionResult = "未知指纹"
		return d.db.Create(&record).Error
	}
	record.DetectionResult = result.BuyerWalletAddress
	record.DatasetID = &result.DatasetID
	return d.db.Create(&record).Error
}

// 获取指纹检测记录
func (d AdminDAO) GetDetectRecords(page int, limit int) ([]model.DetectRecordResponse, int64, int, error) {
	db := d.db.Model(&model.DetectRecord{})

	var total int64
	db.Count(&total)
	offset := (page - 1) * limit

	var records []model.DetectRecordResponse
	err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&records).Error
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return records, total, totalPages, err
}

// 获取指纹地址
func (d AdminDAO) GetFingerprintAddressByTimeStamp(timestamp string) (string, error) {
	var buyerWalletAddress string
	if err := d.db.Table("transactions").Where("block_timestamp = ?", timestamp).Pluck("buyer_wallet_address", &buyerWalletAddress).Error; err != nil {
		return "", err
	}
	if buyerWalletAddress == "" {
		buyerWalletAddress = "未知指纹"
	}
	return buyerWalletAddress, nil
}
