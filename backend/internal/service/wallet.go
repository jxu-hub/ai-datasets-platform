package service

import (
	"backend/internal/dao/mysql"
	"backend/internal/dao/redis"
	mysql2 "backend/internal/model"
	"backend/internal/util"
	"errors"
	"strconv"

	"go.uber.org/zap"
)

type WalletService struct {
	userDAO             *mysql.UserDAO
	userRedisDAO        *redis.UserRedisDAO
	changeWalletAddress *mysql.WalletChangeDAO
}

func NewWalletService(userDAO *mysql.UserDAO, userRedisDAO *redis.UserRedisDAO, changeWalletAddress *mysql.WalletChangeDAO) *WalletService {
	return &WalletService{
		userDAO:             userDAO,
		userRedisDAO:        userRedisDAO,
		changeWalletAddress: changeWalletAddress,
	}
}

// 判断账户是否了绑定钱包
func (w *WalletService) CheckWalletAddressExists(userID uint) (bool, error) {
	return w.userDAO.CheckWalletAddressExists(userID), nil
}

// 绑定钱包
func (w *WalletService) BindWallet(userID uint, req *mysql2.BindWalletRequest) error {
	_, err := w.userDAO.GetUserByID(userID)
	if err != nil {
		util.Error("用户不存在", zap.String("ID", strconv.Itoa(int(userID))))
		return errors.New(err.Error())
	}

	// 判断该钱包地址是否已绑定
	if w.userDAO.CheckWalletAddressIsBind(req.WalletAddress) {
		util.Error("该钱包地址已绑定", zap.String("walletAddress", req.WalletAddress))
		return errors.New("该钱包地址已绑定")
	}

	// 绑定钱包
	if err := w.userDAO.BindWallet(userID, req.WalletAddress, req.Role); err != nil {
		util.Error("绑定钱包失败", zap.Error(err))
		return errors.New(err.Error())
	}
	return nil
}

// 更换钱包地址
func (w *WalletService) ChangeWallet(userID uint, m *mysql2.ChangeWalletRequest) error {
	// 查询旧钱包地址
	currentAddress, err := w.userDAO.GetUserWalletAddress(userID)
	if err != nil {
		util.Error("查询旧钱包地址失败", zap.Error(err))
		return errors.New(err.Error())
	}

	// 判断新钱包地址是否已绑定
	if w.userDAO.CheckWalletAddressIsBind(m.NewWalletAddress) {
		util.Error("该钱包地址已绑定", zap.String("walletAddress", m.NewWalletAddress))
		return errors.New("该钱包地址已经被绑定")
	}

	// 更新钱包地址
	if err := w.userDAO.BindWallet(userID, m.NewWalletAddress, m.Role); err != nil {
		util.Error("更新钱包地址失败", zap.Error(err))
		return errors.New(err.Error())
	}

	// 创建钱包更换记录
	walletChanges := &mysql2.WalletChange{
		UserID:        userID,
		CurrentWallet: currentAddress,
		NewWallet:     m.NewWalletAddress,
		Reason:        m.Reason,
		Status:        "pending",
		ReviewedAt:    nil,
		Remark:        "",
	}

	// 记录更换钱包地址
	if err := w.changeWalletAddress.ChangeWalletRequest(walletChanges); err != nil {
		util.Error("记录更换钱包地址失败", zap.Error(err))
		return errors.New(err.Error())
	}

	// 清除旧用户信息的redis缓存
	if err := w.userRedisDAO.DelRedisUserInfo(userID); err != nil {
		return errors.New(err.Error())
	}

	util.Info("更换钱包地址成功", zap.String("userID", strconv.Itoa(int(userID))))
	return nil
}
