package controller

import (
	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/util"
	"fmt"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"strconv"
)

type TransactionController struct {
	transactionService *service.TransactionService
}

func NewTransactionController(transactionService *service.TransactionService) *TransactionController {
	return &TransactionController{
		transactionService: transactionService,
	}
}

// 购买数据集(创建交易记录)
func (t TransactionController) CreateTransaction(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}
	userID := userIdStr.(uint)
	var req model.CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数错误", zap.Error(err))
		util.BadRequest(c, "参数错误")
		return
	}
	transactionId, err := t.transactionService.CreateTransaction(userID, &req)
	if err != nil {
		util.Error("创建交易记录失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("创建交易记录成功", zap.String("transactionId", strconv.Itoa(int(transactionId))), zap.String("datasetID", strconv.Itoa(int(req.DatasetID))))
	util.Success(c, 201, gin.H{
		"transactionId": transactionId,
		"message":       "创建交易记录成功",
	})
}

// 确认交易记录
func (t TransactionController) ConfirmTransaction(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}
	userID := userIdStr.(uint)
	var req model.TransactionConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数错误", zap.Error(err))
		util.BadRequest(c, "参数错误")
		return
	}
	if err := t.transactionService.ConfirmTransaction(&req); err != nil {
		util.Error("确认交易记录失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("确认交易记录成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"message": "确认交易记录成功",
	})
}

// 删除交易记录
func (t TransactionController) DeleteTransaction(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}
	userId := userIdStr.(uint)
	transactionIdStr := c.Param("id")
	transactionId, err := strconv.Atoi(transactionIdStr)
	fmt.Println("transactionId = ", transactionId)
	if err != nil {
		util.Error("参数错误", zap.Error(err))
		util.BadRequest(c, "参数错误")
		return
	}
	if err := t.transactionService.DeleteTransaction(transactionId, userId); err != nil {
		util.Error("删除交易记录失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("删除交易记录成功", zap.String("transactionID", transactionIdStr))
	util.Success(c, 204, gin.H{
		"message": "删除交易记录成功",
	})
}
