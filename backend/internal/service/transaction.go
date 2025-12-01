package service

import (
	"backend/internal/dao/mysql"
	"backend/internal/model"
	"gorm.io/gorm"
)

type TransactionService struct {
	transactionDAO *mysql.TransactionDAO
	userStats      *mysql.UserStatsDAO
	db             *gorm.DB
}

func NewTransactionService(transactionDAO *mysql.TransactionDAO, userStats *mysql.UserStatsDAO, db *gorm.DB) *TransactionService {
	return &TransactionService{
		transactionDAO: transactionDAO,
		userStats:      userStats,
		db:             db,
	}
}

// 创建交易记录
func (s TransactionService) CreateTransaction(userID uint, req *model.CreateTransactionRequest) (uint, error) {
	tx := s.db.Begin()
	if err := tx.Error; err != nil {
		return 0, err
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	transactionId, err := s.transactionDAO.CreateTransaction(tx, userID, req)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := s.userStats.UpdateUserStatsTotalSpent(tx, userID, req.Amount); err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return 0, err
	}
	return transactionId, nil
}

// 确认交易记录
func (s TransactionService) ConfirmTransaction(m *model.TransactionConfirmRequest) error {
	if err := s.transactionDAO.GetTransactionById(m.ID); err != nil {
		return err
	}
	return s.transactionDAO.ConfirmTransaction(m)
}

// 删除交易记录
func (s TransactionService) DeleteTransaction(id int, userId uint) error {
	tx := s.db.Begin()
	if err := tx.Error; err != nil {
		return err
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	// 获取交易金额
	amount, err := s.transactionDAO.GetTransactionAmountById(tx, id)
	if err != nil {
		tx.Rollback()
		return err
	}
	// 删除交易记录
	if err := s.transactionDAO.DeleteTransaction(tx, id); err != nil {
		tx.Rollback()
		return err
	}
	// 更新用户统计数据
	if err := s.userStats.UpdateUserStatsTotalSpentRollback(tx, userId, amount); err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return err
	}
	return nil
}
