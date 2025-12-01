package mysql

import (
	"backend/internal/model"
	"gorm.io/gorm"
)

type TransactionDAO struct {
	db *gorm.DB
}

func NewTransactionDAO(db *gorm.DB) *TransactionDAO {
	return &TransactionDAO{
		db: db,
	}
}

func (d TransactionDAO) DB() *gorm.DB {
	return d.db
}

// 创建交易记录
func (d TransactionDAO) CreateTransaction(tx *gorm.DB, userID uint, m *model.CreateTransactionRequest) (uint, error) {
	// 查询买家地址
	var userWalletAddress string
	if err := tx.Model(&model.User{}).Where("id = ?", userID).Pluck("wallet_address", &userWalletAddress).Error; err != nil {
		return 0, err
	}
	// 查询卖家地址
	var sellerWalletAddress string
	if err := tx.Model(&model.Dataset{}).Where("id = ?", m.DatasetID).Pluck("author_wallet_address", &sellerWalletAddress).Error; err != nil {
		return 0, err
	}
	transaction := model.Transaction{
		BuyerWalletAddress:  userWalletAddress,
		SellerWalletAddress: sellerWalletAddress,
		DatasetID:           m.DatasetID,
		Amount:              m.Amount,
	}
	return transaction.ID, tx.Create(&transaction).Error
}

// 根据ID获取交易记录
func (d TransactionDAO) GetTransactionById(id uint) error {
	return d.db.First(&model.Transaction{}, id).Error
}

// 确认交易记录
func (d TransactionDAO) ConfirmTransaction(m *model.TransactionConfirmRequest) error {
	return d.db.Model(&model.Transaction{}).Where("id = ?", m.ID).Updates(m).Error
}

// 获取交易金额
func (d TransactionDAO) GetTransactionAmountById(tx *gorm.DB, id int) (float64, error) {
	var amount float64
	if err := tx.Model(&model.Transaction{}).Where("id = ?", id).Pluck("amount", &amount).Error; err != nil {
		return 0, err
	}
	return amount, nil
}

// 删除交易记录
func (d TransactionDAO) DeleteTransaction(tx *gorm.DB, id int) error {
	return tx.Delete(&model.Transaction{}, id).Error
}
