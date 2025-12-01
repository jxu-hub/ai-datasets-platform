package main

import (
	"backend/internal/config"
	"backend/internal/dao"
	"backend/internal/model"
	"backend/internal/router"
	"backend/internal/util"
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 初始化日志
	util.InitLogger("dev")
	// 结束前将日志刻盘
	defer util.Logger.Sync()

	// 加载配置文件
	cfg := config.LoadConfig()
	util.Info("配置文件加载成功", zap.String("config", "config.yaml"))

	// 初始化数据库
	repo, err := dao.InitRepositories()
	if err != nil {
		util.Error("数据库初始化失败", zap.Error(err))
	}
	util.Info("数据库初始化成功")

	// 自动迁移数据库
	err = repo.MySQL.AutoMigrate(&model.User{}, &model.UserStats{}, &model.WalletChange{},
		&model.Dataset{}, &model.Outbox{}, &model.Favorite{}, &model.Transaction{}, &model.DownloadRecord{}, &model.DetectRecord{})
	if err != nil {
		util.Error("AutoMigrate failed", zap.Error(err))
	} else {
		util.Info("AutoMigrate success")
	}

	r := gin.New()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	})) // 跨域

	// 初始化路由
	router.InitRouter(r, repo, cfg)

	addr := fmt.Sprintf(":%s", cfg.Server.Port)
	if err := r.Run(addr); err != nil {
		util.Error("服务启动失败", zap.Error(err))
	}
	util.Info("服务启动成功", zap.String("port", addr))
}
