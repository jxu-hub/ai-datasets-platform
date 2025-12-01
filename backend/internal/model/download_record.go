package model

import "time"

// DownloadRecord 下载记录表结构体
// 注意：使用钱包地址而不是用户ID，下载权限与钱包地址绑定
type DownloadRecord struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	UserWalletAddress  string    `gorm:"type:varchar(42);not null;index:idx_wallet_dataset,unique" json:"userWalletAddress"` // 用户钱包地址
	DatasetID          uint      `gorm:"not null;index:idx_wallet_dataset,unique" json:"datasetID"`
	Type               uint      `gorm:"type:tinyint;enum('0','1');not null" json:"type"` // 0=付费，1=免费
	DownloadCount      int       `gorm:"type:int;default:0" json:"downloadCount"`
	CreatedAt          time.Time `gorm:"autoCreateTime(3)" json:"createdAt"`
}

type DownloadRecordResponse struct {
	ID            uint    `json:"id"`
	DatasetID     uint    `json:"datasetID"`
	Title         string  `json:"datasetTitle"`
	FileSize      uint64  `json:"datasetSize"`
	Price         float64 `json:"price"`
	Type          uint    `json:"type"`
	DownloadCount int     `json:"downloadCount"`
	CreatedAt     string  `json:"createdAt"`
}
