package model

import "time"

// Favorite 收藏记录表结构体
// 注意：使用钱包地址而不是用户ID，收藏与钱包地址绑定
// 用户更换钱包后，收藏列表将重置（因为是新的数字身份）
type Favorite struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	UserWalletAddress string    `gorm:"type:varchar(42);not null;index:idx_wallet_dataset,unique" json:"userWalletAddress"` // 用户钱包地址
	DatasetID         uint      `gorm:"not null;index:idx_wallet_dataset,unique" json:"datasetID"`
	CreatedAt         time.Time `gorm:"type:datetime(3);autoCreateTime(3);column:created_at" json:"createdAt"`
	UpdatedAt         time.Time `gorm:"type:datetime(3);autoUpdateTime(3);column:updated_at" json:"updatedAt"`
}

// FavoriteRequest 收藏请求体
type FavoriteRequest struct {
	UserId    uint `json:"userID" binding:"required"`
	DatasetID uint `json:"datasetID" binding:"required"`
}
