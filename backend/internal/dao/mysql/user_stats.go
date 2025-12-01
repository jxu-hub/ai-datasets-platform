package mysql

import (
	"backend/internal/model"
	"fmt"
	"gorm.io/gorm"
)

type UserStatsDAO struct {
	db *gorm.DB
}

func NewUserStatsDAO(db *gorm.DB) *UserStatsDAO {
	return &UserStatsDAO{db: db}
}

// 更新用户总上传
func (d UserStatsDAO) UpdateUserStatsTotalUploads(tx *gorm.DB, userId uint) error {
	// 查询用户钱包地址
	var walletAddress string
	tx.Model(&model.User{}).Where("id = ?", userId).Pluck("wallet_address", &walletAddress)
	fmt.Println("walletAddress = ", len(walletAddress))
	// 查询用户是否存在
	var count int64
	tx.Model(&model.UserStats{}).Where("wallet_address = ?", walletAddress).Count(&count)
	if count == 0 {
		return tx.Create(&model.UserStats{
			WalletAddress: &walletAddress,
			TotalUploads:  1,
		}).Error
	}
	return tx.Model(&model.UserStats{}).Where("wallet_address = ?", walletAddress).Update("total_uploads", gorm.Expr("total_uploads + ?", 1)).Error
}

// 更新用户总花费
func (d UserStatsDAO) UpdateUserStatsTotalSpent(tx *gorm.DB, userID uint, amount float64) error {
	// 查询用户钱包地址
	var walletAddress string
	tx.Model(&model.User{}).Where("id = ?", userID).Pluck("wallet_address", &walletAddress)
	// 查询用户是否存在
	var count int64
	tx.Model(&model.UserStats{}).Where("wallet_address = ?", walletAddress).Count(&count)
	if count == 0 {
		return tx.Create(&model.UserStats{
			WalletAddress: &walletAddress,
			TotalSpent:    amount,
		}).Error
	}
	return tx.Model(&model.UserStats{}).Where("wallet_address = ?", walletAddress).
		Updates(map[string]interface{}{
			"total_spent":     gorm.Expr("total_spent + ?", amount),
			"total_purchases": gorm.Expr("total_purchases + ?", 1),
		}).Error
}

// 更新用户总下载
func (d UserStatsDAO) UpdateUserStatsTotalDownloads(tx *gorm.DB, userID uint) error {
	// 查询用户钱包地址
	var walletAddress string
	tx.Model(&model.User{}).Where("id = ?", userID).Pluck("wallet_address", &walletAddress)
	// 查询用户是否存在
	var count int64
	tx.Model(&model.UserStats{}).Where("wallet_address = ?", walletAddress).Count(&count)
	if count == 0 {
		return tx.Create(&model.UserStats{
			WalletAddress:  &walletAddress,
			TotalDownloads: 1,
		}).Error
	}
	return tx.Model(&model.UserStats{}).Where("wallet_address = ?", walletAddress).Update("total_downloads", gorm.Expr("total_downloads + ?", 1)).Error
}

// 更新用户总花费回滚
func (d UserStatsDAO) UpdateUserStatsTotalSpentRollback(tx *gorm.DB, id uint, amount float64) error {
	// 查询用户钱包地址
	var walletAddress string
	tx.Model(&model.User{}).Where("id = ?", id).Pluck("wallet_address", &walletAddress)
	return tx.Model(&model.UserStats{}).Where("wallet_address = ?", walletAddress).
		Updates(map[string]interface{}{
			"total_spent":     gorm.Expr("total_spent - ?", amount),
			"total_purchases": gorm.Expr("IF(total_purchases > 0, total_purchases - 1, 0)"),
		}).Error
}
