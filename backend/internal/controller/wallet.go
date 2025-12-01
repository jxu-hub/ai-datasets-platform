package controller

import (
	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/util"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"strconv"
)

type WalletController struct {
	walletService *service.WalletService
}

func NewWalletController(walletService *service.WalletService) *WalletController {
	return &WalletController{walletService: walletService}
}

// 判断钱包地址是否存在
func (w *WalletController) CheckWalletAddressExists(c *gin.Context) {
	// 从中间件获取用户 ID
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("user", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	// 调用服务层判断钱包地址是否存在
	isExists, err := w.walletService.CheckWalletAddressExists(userID)
	if err != nil {
		util.Error("判断钱包地址是否存在失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("判断钱包地址是否存在成功", zap.Bool("isExists", isExists))
	util.Success(c, 200, gin.H{"message": isExists})
}

// 绑定钱包
func (w *WalletController) BindWallet(c *gin.Context) {
	// 从中间件获取用户 ID
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("user", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	// 绑定请求参数
	var req model.BindWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	// 调用服务层绑定钱包
	if err := w.walletService.BindWallet(userID, &req); err != nil {
		util.Error("绑定钱包失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("绑定钱包成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 201, gin.H{"message": "绑定钱包成功"})
}

// 更换钱包地址
func (w *WalletController) ChangeWallet(c *gin.Context) {
	// 从中间件获取用户 ID
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("user", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	// 绑定请求参数
	var req model.ChangeWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	// 调用服务层更换钱包地址
	if err := w.walletService.ChangeWallet(userID, &req); err != nil {
		util.Error("更换钱包地址失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("更换钱包地址成功", zap.String("walletAddress", req.NewWalletAddress))
	util.Success(c, 200, gin.H{"message": "更换钱包地址成功"})
}
