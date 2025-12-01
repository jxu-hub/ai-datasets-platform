package model

import (
	"time"
)

// Transaction 交易记录表结构体
// 注意：使用钱包地址而不是用户ID，确保与区块链交易记录完全一致
type Transaction struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	BuyerWalletAddress  string    `gorm:"type:varchar(42);not null;index:idx_buyer_wallet" json:"buyerWalletAddress"`   // 买家钱包地址
	SellerWalletAddress string    `gorm:"type:varchar(42);not null;index:idx_seller_wallet" json:"sellerWalletAddress"` // 卖家钱包地址
	DatasetID           uint      `gorm:"not null;index:idx_dataset" json:"datasetId"`
	Type                string    `gorm:"type:varchar(20);not null" json:"type"`
	Amount              float64   `gorm:"type:decimal(18,8);not null" json:"amount"`
	Gas                 string    `gorm:"type:varchar(64)" json:"gas"`
	TxHash              string    `gorm:"type:varchar(100);index" json:"txHash"`
	BlockHash           string    `gorm:"type:varchar(100)" json:"blockHash"`
	Status              string    `gorm:"type:varchar(20);enum('pending','completed','failed')" json:"status"`
	Nonce               uint64    `gorm:"type:bigint" json:"nonce"`
	BlockNumber         uint64    `gorm:"type:bigint" json:"blockNumber"`
	BlockTimestamp      int64     `gorm:"type:bigint" json:"blockTimestamp"`
	CreatedAt           time.Time `gorm:"autoCreateTime(3)" json:"createdAt"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime(3)" json:"updatedAt"`
}

// 创建交易记录请求
type CreateTransactionRequest struct {
	DatasetID uint    `json:"datasetId" binding:"required"`
	Amount    float64 `json:"amount" binding:"required"`
}

// 交易确认请求
type TransactionConfirmRequest struct {
	ID             uint   `json:"id" binding:"required"`
	TxHash         string `json:"txHash" binding:"required"`
	BlockHash      string `json:"blockHash" binding:"required"`
	BlockNumber    uint64 `json:"blockNumber" binding:"required"`
	Gas            string `json:"gas" binding:"required"`
	Status         string `json:"status" binding:"required"`
	Nonce          uint64 `json:"nonce" binding:"required"`
	BlockTimestamp int64  `json:"blockTimestamp" binding:"required"`
}

// 交易记录列表响应
type TransactionListResponse struct {
	ID          uint    `json:"id"`
	DatasetID   uint    `json:"datasetId"`
	Title       string  `json:"datasetTitle"`
	FileSize    uint64  `json:"datasetSize"`
	Amount      float64 `json:"amount"`
	Status      string  `json:"status"`
	TxHash      string  `json:"txHash"`
	BlockNumber uint64  `json:"blockNumber"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}
