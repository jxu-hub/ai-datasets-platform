package controller

import (
	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/util"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"strconv"
)

type AdminController struct {
	adminService *service.AdminService
}

func NewAdminController(adminService *service.AdminService) *AdminController {
	return &AdminController{adminService: adminService}
}

// 获取统计数据
func (ad AdminController) GetStats(c *gin.Context) {

	totalUsers, totalDatasets, totalTransactions, err := ad.adminService.GetStats()
	if err != nil {
		util.Error("获取统计数据失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("获取统计数据成功", zap.Int("total_users", totalUsers), zap.Int("total_datasets", totalDatasets), zap.Int("total_transactions", totalTransactions))
	util.Success(c, 200, gin.H{
		"total_users":        totalUsers,
		"total_datasets":     totalDatasets,
		"total_transactions": totalTransactions,
	})
}

// 获取仪表盘数据
func (ad AdminController) GetDashboardAnalytics(c *gin.Context) {
	data, err := ad.adminService.GetDashboardAnalytics()
	if err != nil {
		util.Error("获取仪表盘数据失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取仪表盘数据成功")
	util.Success(c, 200, gin.H{
		"data": data,
	})
}

// 获取用户列表
func (ad AdminController) GetUsers(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	users, total, totalPages, err := ad.adminService.GetUsers(page, limit)
	if err != nil {
		util.Error("获取用户列表失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取用户列表成功", zap.Int("用户总数:", len(*users)))
	util.Success(c, 200, gin.H{
		"items":      users,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// 获取用户详情
func (ad AdminController) GetUserInfo(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		util.Error("参数错误", zap.String("userID", userIDStr))
		util.BadRequest(c, "参数错误")
		return
	}
	user, stats, err := ad.adminService.GetUserInfo(userID)
	if err != nil {
		util.Error("获取用户详情失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("获取用户详情成功", zap.String("userID", userIDStr))
	util.Success(c, 200, gin.H{
		"user":  user,
		"stats": stats,
	})
}

// 更新用户信息
func (ad AdminController) UpdateUserInfo(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		util.Error("参数错误", zap.String("userID", userIDStr))
		util.BadRequest(c, "参数错误")
		return
	}
	var req model.AdminUpdateUserInfoRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		util.Error("参数错误", zap.String("userID", userIDStr))
		util.BadRequest(c, "参数错误")
		return
	}

	if err = ad.adminService.UpdateUserInfo(userID, &req); err != nil {
		util.Error("更新用户信息失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("更新用户信息成功", zap.String("userID", userIDStr))
	util.Success(c, 200, gin.H{
		"message": "更新用户信息成功",
	})
}

// 删除用户
func (ad AdminController) DeleteUser(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		util.Error("参数错误", zap.String("userID", userIDStr))
		util.BadRequest(c, "参数错误")
		return
	}

	if err = ad.adminService.DeleteUser(userID); err != nil {
		util.Error("删除用户失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("删除用户成功", zap.String("userID", userIDStr))
	util.Success(c, 204, gin.H{
		"message": "删除用户成功",
	})
}

// 添加用户
func (ad AdminController) AddUser(c *gin.Context) {
	var req model.AdminAddUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数错误", zap.Error(err))
		util.BadRequest(c, "参数错误")
		return
	}

	if err := ad.adminService.AddUser(&req); err != nil {
		util.Error("添加用户失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("添加用户成功", zap.String("username", req.Username), zap.String("email", req.Email))
	util.Success(c, 200, gin.H{
		"message": "添加用户成功",
	})
}

// 获取数据集列表
func (ad AdminController) GetDatasets(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	datasets, total, totalPages, err := ad.adminService.GetDatasets(page, limit)
	if err != nil {
		util.Error("获取数据集列表失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取数据集列表成功", zap.Int("数据集总数", len(datasets)))
	util.Success(c, 200, gin.H{
		"items":      datasets,
		"total":      total,
		"totalPages": totalPages,
		"page":       page,
		"limit":      limit,
	})
}

// 删除数据集
func (ad AdminController) DeleteDataset(c *gin.Context) {
	datasetIDStr := c.Param("datasetId")
	datasetID, err := strconv.Atoi(datasetIDStr)
	if err != nil {
		util.Error("参数错误", zap.String("datasetID", datasetIDStr))
		util.BadRequest(c, "参数错误")
		return
	}

	if err = ad.adminService.DeleteDataset(datasetID); err != nil {
		util.Error("删除数据集失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("删除数据集成功", zap.String("datasetID", datasetIDStr))
	util.Success(c, 204, gin.H{
		"message": "删除数据集成功",
	})
}

// 恢复删除的数据集
func (ad AdminController) RestoreDataset(c *gin.Context) {
	datasetIDStr := c.Param("datasetId")
	datasetID, err := strconv.Atoi(datasetIDStr)
	if err != nil {
		util.Error("参数错误", zap.String("datasetID", datasetIDStr))
		util.BadRequest(c, "参数错误")
		return
	}

	if err = ad.adminService.RestoreDataset(datasetID); err != nil {
		util.Error("恢复数据集失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("恢复数据集成功", zap.String("datasetID", datasetIDStr))
	util.Success(c, 200, gin.H{
		"message": "恢复数据集成功",
	})
}

// 指纹检测
func (ad AdminController) FingerprintDetect(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		util.Error("参数错误", zap.Error(err))
		util.BadRequest(c, "参数错误")
		return
	}

	// 检测指纹
	fingerprint, err := ad.adminService.FingerprintDetect(file)
	if err != nil {
		util.Error("指纹检测失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("指纹检测成功", zap.String("fingerprint", fingerprint.MatchResult))
	util.Success(c, 200, gin.H{
		"result": fingerprint,
	})
}

// 获取指纹检测记录
func (ad AdminController) GetDetectRecords(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	detectionRecords, total, totalPages, err := ad.adminService.GetDetectRecords(page, limit)
	if err != nil {
		util.Error("获取指纹检测记录失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取指纹检测记录成功", zap.Int("指纹检测记录总数", len(detectionRecords)))
	util.Success(c, 200, gin.H{
		"items":      detectionRecords,
		"total":      total,
		"totalPages": totalPages,
		"page":       page,
		"limit":      limit,
	})
}

// 获取minio buckets
func (ad AdminController) GetMinioBuckets(c *gin.Context) {
	buckets, err := ad.adminService.GetMinioBuckets()
	if err != nil {
		util.Error("获取minio buckets失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取minio buckets成功", zap.Int("buckets数量", len(buckets)))
	util.Success(c, 200, gin.H{
		"buckets": buckets,
	})
}

// 获取minio objects
func (ad AdminController) GetMinioObjects(c *gin.Context) {
	bucket := c.Query("bucket")
	objects, err := ad.adminService.GetMinioObjects(bucket)
	if err != nil {
		util.Error("获取minio objects失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取minio objects成功", zap.String("bucket", bucket), zap.Int("objects数量", len(objects)))
	util.Success(c, 200, gin.H{
		"objects": objects,
	})
}

// 删除minio objects
func (ad AdminController) DeleteMinioObject(c *gin.Context) {
	bucket := c.Query("bucket")
	objectName := c.Query("objectName")

	if err := ad.adminService.DeleteMinioObject(bucket, objectName); err != nil {
		util.Error("删除minio objects失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("删除minio objects成功", zap.String("bucket", bucket), zap.String("objectName", objectName))
	util.Success(c, 204, gin.H{
		"message": "删除minio objects成功",
	})
}

// 处理异步删除任务
func (ad AdminController) ProcessOutboxTasks(c *gin.Context) {
	ad.adminService.ProcessOutboxTasks()

	util.Info("处理异步删除任务成功")
	util.Success(c, 200, gin.H{
		"message": "处理异步删除任务成功",
	})
}
