package model

import (
	"time"
)

// WalletChangeRequest 用户申请更换钱包记录表
// 对应表 wallet_change_requests
// user_id 外键关联 User.ID
// status: pending, approved, rejected

type WalletChange struct {
	ID            uint       `gorm:"primaryKey;autoIncrement;column:id" json:"id"`
	UserID        uint       `gorm:"not null;index:idx_user_id;column:user_id" json:"userID"`
	CurrentWallet string     `gorm:"type:varchar(64);not null;column:current_wallet" json:"currentWallet"`
	NewWallet     string     `gorm:"type:varchar(64);not null;column:new_wallet" json:"newWallet"`
	Reason        string     `gorm:"type:varchar(255);column:reason" json:"reason"`
	Status        string     `gorm:"type:enum('pending','approved','rejected');default:'pending';index:idx_status;column:status" json:"status"`
	ReviewedAt    *time.Time `gorm:"column:reviewed_at" json:"reviewedAt"`
	CreatedAt     time.Time  `gorm:"type:datetime(3);autoCreateTime(3);column:created_at" json:"createdAt"`
	UpdatedAt     time.Time  `gorm:"type:datetime(3);autoUpdateTime(3);column:updated_at" json:"updatedAt"`
	Remark        string     `gorm:"type:varchar(255);column:remark" json:"remark"`

	User User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user"`
}

type ChangeWalletRequest struct {
	NewWalletAddress string `json:"newWalletAddress" binding:"required,len=42"`
	Reason           string `json:"reason" binding:"required,max=255"`
	Role             string `json:"role" binding:"required,oneof=user seller admin"`
}

// 钱包变更列表响应体
type WalletChangeResponse struct {
	ID            uint       `json:"id"`
	UserID        uint       `json:"userID"`
	CurrentWallet string     `json:"currentWallet"`
	NewWallet     string     `json:"newWallet"`
	Reason        string     `json:"reason"`
	Status        string     `json:"status"`
	ReviewedAt    *time.Time `json:"reviewedAt"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	Remark        string     `json:"remark"`
	Username      string     `json:"username"`
	Email         string     `json:"email"`
}
