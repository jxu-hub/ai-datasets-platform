package mysql

import (
	"backend/internal/model"
	"strings"

	"gorm.io/gorm"
)

type DatasetDAO struct {
	db *gorm.DB
}

func NewDatasetDAO(db *gorm.DB) *DatasetDAO {
	return &DatasetDAO{
		db: db,
	}
}

// getter
func (d DatasetDAO) DB() *gorm.DB {
	return d.db
}

// 上传数据集
func (d DatasetDAO) UploadDataset(tx *gorm.DB, m *model.UploadDatasetRequest, bucket string) (uint, error) {
	dataset := model.Dataset{
		Title:               m.Title,
		Description:         m.Description,
		Category:            m.Category,
		Tags:                m.Tags,
		Price:               m.Price,
		IsFree:              m.IsFree,
		ObjectName:          m.ObjectName,
		FileSize:            m.FileSize,
		AuthorWalletAddress: m.AuthorWalletAddress,
		License:             m.License,
		BucketName:          bucket,
	}
	result := tx.Create(&dataset)
	if result.Error != nil {
		return 0, result.Error
	}
	return dataset.ID, nil
}

// 删除数据集
func (d DatasetDAO) DeleteDataset(tx *gorm.DB, id uint) error {
	return tx.Delete(&model.Dataset{}, id).Error
}

// 查询数据集列表，支持分页、免费/付费、分类、搜索、文件大小等筛选
func (d DatasetDAO) ListDatasets(page, limit int, filters map[string]interface{}) ([]model.DatasetListResponse, int64, int, error) {
	db := d.db.Model(&model.Dataset{})

	if v, ok := filters["is_free"]; ok {
		db = db.Where("is_free = ?", v)
	}
	if v, ok := filters["category"]; ok {
		db = db.Where("category = ?", v)
	}
	if v, ok := filters["search"]; ok {
		like := "%" + v.(string) + "%"
		db = db.Where("title LIKE ? OR description LIKE ? OR tags LIKE ?", like, like, like)
	}
	if v, ok := filters["fileSizeRange"]; ok {
		size := strings.Split(v.(string), "-")
		db = db.Where("file_size >= ? AND file_size <= ?", size[0], size[1])
	}
	if v, ok := filters["priceRange"]; ok {
		price := strings.Split(v.(string), "-")
		db = db.Where("price >= ? AND price <= ?", price[0], price[1])
	}

	var total int64
	db.Count(&total)
	offset := (page - 1) * limit

	var datasets []model.DatasetListResponse
	err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&datasets).Error
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return datasets, total, totalPages, err
}

// 获取数据集详情
func (d DatasetDAO) GetDatasetDetail(id uint) (model.DatasetListResponse, error) {
	var dataset model.DatasetListResponse
	err := d.db.Model(&model.Dataset{}).Where("id = ?", id).First(&dataset).Error
	return dataset, err
}

// 作者的付费数据集
func (d DatasetDAO) GetAuthorPaidDatasets(authorWalletAddress string, page, limit int) ([]model.DatasetListResponse, int64, int, error) {
	db := d.db.Model(&model.Dataset{}).Where("author_wallet_address = ? AND is_free = ?", authorWalletAddress, false)
	var total int64
	db.Count(&total)
	offset := (page - 1) * limit

	var datasets []model.DatasetListResponse
	err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&datasets).Error
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return datasets, total, totalPages, err
}

// 通过数据集ID获取对象名
func (d DatasetDAO) GetObjectNameByDatasetID(datasetId uint) (string, error) {
	var objectName string
	if err := d.db.Model(&model.Dataset{}).Where("id = ?", datasetId).Pluck("object_name", &objectName).Error; err != nil {
	}
	return objectName, nil
}

// 通过数据集ID获取对象名-tx
func (d DatasetDAO) GetObjectNameByDatasetIDTX(tx *gorm.DB, id uint) (string, error) {
	var objectName string
	if err := tx.Model(&model.Dataset{}).Where("id = ?", id).Pluck("object_name", &objectName).Error; err != nil {
		return "", err
	}
	return objectName, nil
}

// 添加下载记录
func (d DatasetDAO) AddDownloadRecord(tx *gorm.DB, userID uint, DatasetID uint) error {
	// 查询用户钱包地址
	var userWalletAddress string
	if err := tx.Model(&model.User{}).Where("id = ?", userID).Pluck("wallet_address", &userWalletAddress).Error; err != nil {
		return err
	}
	// 查询dataset是否免费
	var isFree uint
	if err := tx.Model(&model.Dataset{}).Where("id = ?", DatasetID).Pluck("is_free", &isFree).Error; err != nil {
		return err
	}
	var count int64
	if err := tx.Model(&model.DownloadRecord{}).Where("user_wallet_address = ? AND dataset_id = ?", userWalletAddress, DatasetID).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return tx.Model(&model.DownloadRecord{}).Where("user_wallet_address = ? AND dataset_id = ?", userWalletAddress, DatasetID).Update("download_count", gorm.Expr("download_count + ?", 1)).Error
	}
	record := model.DownloadRecord{
		UserWalletAddress: userWalletAddress,
		DatasetID:         DatasetID,
		Type:              isFree,
		DownloadCount:     1,
	}
	return tx.Create(&record).Error
}

// 更新下载次数
func (d DatasetDAO) UpdateDownloadCount(tx *gorm.DB, id uint) error {
	return tx.Model(&model.Dataset{}).Where("id = ?", id).UpdateColumn("download_count", gorm.Expr("download_count + ?", 1)).Error
}

// 通过数据集ID获取对象名和文件大小
func (d DatasetDAO) GetObjectNameAndFileSizeByDatasetID(id uint) (string, int64, error) {
	var ds model.Dataset
	err := d.db.Select("object_name, file_size").Where("id = ?", id).First(&ds, id).Error
	return ds.ObjectName, ds.FileSize, err
}

// 获取交易时间戳
func (d DatasetDAO) GetTransactionTimestamp(userId, datasetId uint) (int64, error) {
	// 获取用户钱包地址
	var walletAddress string
	err := d.db.Model(&model.User{}).Where("id = ?", userId).Pluck("wallet_address", &walletAddress).Error
	var timestamp int64
	err = d.db.Model(&model.Transaction{}).Where("buyer_wallet_address = ? AND dataset_id = ?", walletAddress, datasetId).Pluck("block_timestamp", &timestamp).Error
	return timestamp, err
}

// 获取作者的数据集
func (d DatasetDAO) GetAuthorDatasets(address string, page int, limit int) ([]model.DatasetListResponse, int64, int, error) {
	db := d.db.Model(&model.Dataset{}).Where("author_wallet_address = ?", address)
	var total int64
	db.Count(&total)
	offset := (page - 1) * limit

	var datasets []model.DatasetListResponse
	err := db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&datasets).Error
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return datasets, total, totalPages, err
}
