package controller

import (
    "backend/internal/service"
    "backend/internal/util"
    "github.com/gin-gonic/gin"
    "strconv"
)

type HomeController struct {
    homeService *service.HomeService
}

func NewHomeController(homeService *service.HomeService) *HomeController {
    return &HomeController{homeService: homeService}
}

func (h HomeController) GetPlatformStats(c *gin.Context) {
    // 1. 调用service获取平台统计数据
    // 2. 统一响应结构
    users, datasets, transactions, err := h.homeService.GetPlatformStats()
    if err != nil {
        util.InternalServerError(c, err.Error())
        return
    }
    util.Success(c, 200, gin.H{
        "total_users":        users,
        "total_datasets":    datasets,
        "total_transactions": transactions,
    })
}

func (h HomeController) GetHotRank(c *gin.Context) {
    // 1. 解析limit参数
    // 2. 调用service查询热门排行榜
    // 3. 返回列表数据
    limitStr := c.DefaultQuery("limit", "10")
    limit, _ := strconv.Atoi(limitStr)
    items, err := h.homeService.GetHotRank(limit)
    if err != nil {
        util.InternalServerError(c, err.Error())
        return
    }
    util.Success(c, 200, gin.H{"items": items})
}

func (h HomeController) GetLatestRank(c *gin.Context) {
    // 1. 解析limit参数
    // 2. 调用service查询最近上传排行榜
    // 3. 返回列表数据
    limitStr := c.DefaultQuery("limit", "10")
    limit, _ := strconv.Atoi(limitStr)
    items, err := h.homeService.GetLatestRank(limit)
    if err != nil {
        util.InternalServerError(c, err.Error())
        return
    }
    util.Success(c, 200, gin.H{"items": items})
}

