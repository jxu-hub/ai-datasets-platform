package mysql

import (
    "backend/internal/model"
    "gorm.io/gorm"
)

type HomeDAO struct {
    db *gorm.DB
}

func NewHomeDAO(db *gorm.DB) *HomeDAO {
    return &HomeDAO{db: db}
}

func (d HomeDAO) GetPlatformStats() (int, int, int, error) {
    // 1. 统计用户总数
    var totalUsers int64
    if err := d.db.Table("users").Count(&totalUsers).Error; err != nil {
        return 0, 0, 0, err
    }
    // 2. 统计数据集总数
    var totalDatasets int64
    if err := d.db.Table("datasets").Count(&totalDatasets).Error; err != nil {
        return 0, 0, 0, err
    }
    // 3. 统计交易记录总数
    var totalTransactions int64
    if err := d.db.Table("transactions").Count(&totalTransactions).Error; err != nil {
        return 0, 0, 0, err
    }
    return int(totalUsers), int(totalDatasets), int(totalTransactions), nil
}

func (d HomeDAO) GetDatasetsByIDs(ids []uint) ([]model.DatasetListResponse, error) {
    // 1. 批量查询数据集列表信息
    var datasets []model.DatasetListResponse
    if len(ids) == 0 {
        return datasets, nil
    }
    if err := d.db.Model(&model.Dataset{}).Where("id IN ?", ids).Find(&datasets).Error; err != nil {
        return nil, err
    }
    return datasets, nil
}

func (d HomeDAO) GetTopByDownloads(limit int) ([]model.DatasetListResponse, error) {
    // 1. TopN 按下载量排序
    var datasets []model.DatasetListResponse
    if err := d.db.Model(&model.Dataset{}).Order("download_count DESC").Limit(limit).Find(&datasets).Error; err != nil {
        return nil, err
    }
    return datasets, nil
}

func (d HomeDAO) GetLatestByCreatedAt(limit int) ([]model.DatasetListResponse, error) {
    // 1. TopN 按创建时间排序
    var datasets []model.DatasetListResponse
    if err := d.db.Model(&model.Dataset{}).Order("created_at DESC").Limit(limit).Find(&datasets).Error; err != nil {
        return nil, err
    }
    return datasets, nil
}
