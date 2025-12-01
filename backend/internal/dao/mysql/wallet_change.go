package mysql

import (
	"backend/internal/model"
	"gorm.io/gorm"
)

type WalletChangeDAO struct {
	db *gorm.DB
}

func NewWalletChangeDAO(db *gorm.DB) *WalletChangeDAO {
	return &WalletChangeDAO{db: db}
}

// 更换钱包地址
func (d *WalletChangeDAO) ChangeWalletRequest(changeWalletAddress *model.WalletChange) error {
	return d.db.Create(changeWalletAddress).Error
}
