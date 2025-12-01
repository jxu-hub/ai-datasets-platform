package controller

import (
	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/util"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"go.uber.org/zap"
)

type DatasetController struct {
	datasetService *service.DatasetService
}

func NewDatasetController(datasetService *service.DatasetService) *DatasetController {
	return &DatasetController{
		datasetService: datasetService,
	}
}

// 上传预览数据
func (d *DatasetController) UploadPreview(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	var req model.UploadPreviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}
	// 预览数据存入mongodb
	if err := d.datasetService.SavePreviewData(&req); err != nil {
		util.Error("存入预览数据失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	// 获取上传 minio 预签名 url
	url, err := d.datasetService.GetUploadPreviewURL(userID)
	if err != nil {
		util.Error("获取上传预览数据预签名 url 失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("存入预览数据成功", zap.String("userID", strconv.Itoa((int)(userID))))
	util.Success(c, 200, gin.H{"url": url})
	return
}

// 初始化分片上传
func (d *DatasetController) InitMultipartUpload(c *gin.Context) {
	var req struct {
		FileName string `json:"fileName" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	uploadId, objectName, err := d.datasetService.InitiateMultipartUpload(req.FileName)
	if err != nil {
		util.Error("初始化分片上传失败", zap.Error(err))
		util.InternalServerError(c, "初始化分片上传失败: "+err.Error())
		return
	}

	util.Info("初始化分片上传成功", zap.String("uploadId", uploadId))

	util.Success(c, 200, gin.H{
		"uploadId":   uploadId,
		"objectName": objectName,
	})
}

// 获取某个分片的上传 URL
func (d *DatasetController) GetPartUploadURL(c *gin.Context) {
	var req struct {
		ObjectName string `json:"objectName" binding:"required"`
		UploadId   string `json:"uploadId" binding:"required"`
		PartNumber int    `json:"partNumber" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	url, err := d.datasetService.GetPresignedPartURL(req.ObjectName, req.UploadId, req.PartNumber)
	if err != nil {
		util.Error("获取分片URL失败", zap.Error(err))
		util.InternalServerError(c, "获取分片URL失败: "+err.Error())
		return
	}

	util.Info("获取分片URL成功", zap.String("url", url))
	util.Success(c, 200, gin.H{"url": url})
}

// 完成分片上传
func (d *DatasetController) CompleteMultipartUpload(c *gin.Context) {
	var req struct {
		ObjectName string `json:"objectName" binding:"required"`
		UploadId   string `json:"uploadId" binding:"required"`
		Parts      []struct {
			ETag       string `json:"ETag" binding:"required"`
			PartNumber int    `json:"PartNumber" binding:"required"`
		} `json:"parts" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	// 转换成 MinIO 的 CompletePart 结构
	var completeParts []minio.CompletePart
	for _, p := range req.Parts {
		completeParts = append(completeParts, minio.CompletePart{
			ETag:       strings.Trim(p.ETag, `"`), // 注意ETag可能带引号
			PartNumber: p.PartNumber,
		})
	}

	// 合并分片
	objectName, err := d.datasetService.CompleteMultipartUpload(req.ObjectName, req.UploadId, completeParts)
	if err != nil {
		util.Error("合并分片失败", zap.Error(err))
		util.InternalServerError(c, "合并分片失败: "+err.Error())
		return
	}

	util.Info("合并分片成功", zap.String("objectName", req.ObjectName))
	util.Success(c, 200, gin.H{
		"objectName": objectName,
		"message":    "文件上传完成",
	})
}

// 取消分片上传
func (d *DatasetController) AbortMultipartUpload(c *gin.Context) {
	var req struct {
		ObjectName string `json:"objectName" binding:"required"`
		UploadId   string `json:"uploadId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	// 取消分片上传
	if err := d.datasetService.AbortMultipartUpload(req.ObjectName, req.UploadId); err != nil {
		util.Error("取消分片上传", zap.Error(err))
		util.InternalServerError(c, "取消分片上传: "+err.Error())
		return
	}

	util.Info("取消分片上传", zap.String("objectName", req.ObjectName))
	util.Success(c, 200, gin.H{"message": "已取消上传"})
}

// 上传数据集
func (d *DatasetController) UploadDataset(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIDStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIDStr.(uint)
	var req model.UploadDatasetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}
	// 上传数据集
	datasetId, err := d.datasetService.UploadDataset(&req, userID)
	if err != nil {
		util.Error("上传数据集失败", zap.Error(err))
		util.InternalServerError(c, "上传数据集失败: "+err.Error())
		return
	}

	util.Info("上传数据集成功", zap.String("datasetId", strconv.Itoa(int(datasetId))))
	util.Success(c, 201, gin.H{
		"datasetId": datasetId,
		"message":   "上传数据集成功",
	})
}

// 删除数据集
func (d *DatasetController) DeleteDataset(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIDStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	var req model.DeleteDatasetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	if err := d.datasetService.DeleteDataset(&req); err != nil {
		util.Error("删除数据集和文件失败", zap.Error(err))
		util.InternalServerError(c, "删除数据集和文件失败: "+err.Error())
		return
	}

	util.Info("删除数据集和文件成功", zap.String("datasetId", strconv.Itoa(int(req.DatasetID))))
	util.Success(c, 204, gin.H{"message": "删除数据集和文件成功"})
}

// 获取数据集列表，支持分页、免费/付费、分类、搜索、文件大小等筛选
func (d *DatasetController) ListDatasets(c *gin.Context) {
	// 解析分页参数
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	category := c.Query("category")
	search := c.Query("search")
	fileSizeRange := c.Query("fileSizeRange")
	priceRange := c.Query("priceRange")
	isFreeStr := c.Query("is_free")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	isFree := -1 // -1: 不筛选, 0: 付费, 1: 免费
	if isFreeStr != "" {
		if isFreeStr == "true" || isFreeStr == "1" {
			isFree = 1
		} else if isFreeStr == "false" || isFreeStr == "0" {
			isFree = 0
		}
	}

	// 调用 service 层
	datasets, total, totalPages, err := d.datasetService.ListDatasets(page, limit, isFree, category, search, fileSizeRange, priceRange)
	if err != nil {
		util.Error("获取数据集列表失败", zap.Error(err))
		util.InternalServerError(c, "获取数据集列表失败: "+err.Error())
		return
	}

	util.Info("获取数据集列表成功", zap.String("page", pageStr), zap.String("limit", limitStr))
	util.Success(c, 200, gin.H{
		"items":      datasets,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// 获取数据集详情
func (d *DatasetController) GetDatasetDetail(c *gin.Context) {
	datasetIDStr := c.Query("datasetId")
	datasetID, err := strconv.Atoi(datasetIDStr)
	if err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}
	dataset, err := d.datasetService.GetDatasetDetail(uint(datasetID))
	if err != nil {
		util.Error("获取数据集详情失败", zap.Error(err))
		util.InternalServerError(c, "获取数据集详情失败: "+err.Error())
		return
	}

	util.Info("获取数据集详情成功", zap.String("datasetId", datasetIDStr))
	util.Success(c, 200, gin.H{
		"data": dataset,
	})
}

// 获取预览数据
func (d *DatasetController) GetPreviewData(c *gin.Context) {
	objectName := c.Query("objectName")
	if objectName == "" {
		util.Error("参数格式错误", zap.String("objectName", objectName))
		util.BadRequest(c, "参数格式错误: objectName 不能为空")
		return
	}
	previewData, err := d.datasetService.GetPreviewData(objectName)
	if err != nil {
		util.Error("获取预览数据失败", zap.Error(err))
		util.InternalServerError(c, "获取预览数据失败: "+err.Error())
		return
	}
	util.Info("获取预览数据成功", zap.String("objectName", objectName))
	util.Success(c, 200, gin.H{
		"data": previewData.PreviewData,
	})
}

// 获取作者的付费数据集
func (d *DatasetController) GetAuthorPaidDatasets(c *gin.Context) {
	authorWalletAddress := c.Query("authorWalletAddress")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "3")
	page, err := strconv.Atoi(pageStr)
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}
	datasets, total, totalPages, err := d.datasetService.GetAuthorPaidDatasets(authorWalletAddress, page, limit)
	if err != nil {
		util.Error("获取作者的付费数据集失败", zap.Error(err))
		util.InternalServerError(c, "获取作者的付费数据集失败: "+err.Error())
		return
	}

	util.Info("获取作者的付费数据集成功", zap.String("authorWalletAddress", authorWalletAddress))
	util.Success(c, 200, gin.H{
		"items":      datasets,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}

// 下载免费数据集
func (d *DatasetController) DownloadFreeDataset(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	fmt.Println("userIDStr = ", userIDStr)
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIDStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}
	userID := userIDStr.(uint)
	datasetIDStr := c.Query("datasetID")
	datasetID, err := strconv.Atoi(datasetIDStr)
	if err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	url, err := d.datasetService.GetDownloadURL(userID, uint(datasetID))
	if err != nil {
		util.Error("获取数据集详情失败", zap.Error(err))
		util.InternalServerError(c, "获取数据集详情失败: "+err.Error())
		return
	}

	util.Info("获取数据集详情成功", zap.String("datasetId", datasetIDStr))
	util.Success(c, 200, gin.H{
		"url": url,
	})
}

// 下载付费数据集
func (d *DatasetController) DownloadPaidDataset(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIDStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIDStr.(uint)

	datasetIDStr := c.Query("datasetID")
	datasetID, err := strconv.Atoi(datasetIDStr)
	if err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	start := time.Now()

	objectName, err := d.datasetService.DownloadPaidDataset(userID, uint(datasetID))
	util.Info("下载付费数据集耗时", zap.String("cost", time.Since(start).String()))
	if err != nil {
		util.Error("获取数据集详情失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("处理数据集结束了", zap.String("datasetId", datasetIDStr))
	util.Success(c, 200, gin.H{
		"objectName": objectName,
		"message":    "正在处理下载请求",
	})
}

// 获取下载状态
func (d *DatasetController) GetDownloadStatus(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIDStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIDStr.(uint)
	datasetIDStr := c.Query("datasetID")
	objectName := c.Query("objectName")
	datasetID, err := strconv.Atoi(datasetIDStr)
	if err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	url, progress, err := d.datasetService.GetDownloadStatus(userID, uint(datasetID), objectName)
	if err != nil && progress != "100" {
		util.Error("获取下载状态失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取下载状态成功", zap.String("datasetId", datasetIDStr))
	util.Success(c, 200, gin.H{
		"url":      url,
		"progress": progress,
	})
}

// 获取作者的数据集
func (d *DatasetController) GetAuthorDatasets(c *gin.Context) {
	authorWalletAddress := c.Query("authorWalletAddress")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "5")
	page, err := strconv.Atoi(pageStr)
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}
	datasets, total, totalPages, err := d.datasetService.GetAuthorDatasets(authorWalletAddress, page, limit)
	if err != nil {
		util.Error("获取作者的数据集失败", zap.Error(err))
		util.InternalServerError(c, "获取作者的数据集失败: "+err.Error())
		return
	}

	util.Info("获取作者的数据集成功", zap.String("authorWalletAddress", authorWalletAddress))
	util.Success(c, 200, gin.H{
		"items":      datasets,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": totalPages,
	})
}
