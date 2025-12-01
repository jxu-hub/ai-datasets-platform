package router

import (
	"backend/internal/config"
	"backend/internal/controller"
	"backend/internal/dao"
	"backend/internal/dao/minio"
	"backend/internal/dao/mongo"
	"backend/internal/dao/mysql"
	"backend/internal/dao/redis"
	"backend/internal/middleware"
	"backend/internal/service"
	"backend/internal/util"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func InitRouter(r *gin.Engine, repo *dao.Repository, cfg *config.Config) {

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 认证授权
	authService := service.NewAuthService(mysql.NewUserDAO(repo.MySQL), redis.NewUserRedisDAO(repo.Redis), minio.NewUserMinioDAO(repo.MinIO, cfg.MinIO.Buckets[util.USER_AVATAR_BUCKET]), repo.MySQL)
	authController := controller.NewAuthController(authService)

	// 钱包管理
	walletService := service.NewWalletService(mysql.NewUserDAO(repo.MySQL), redis.NewUserRedisDAO(repo.Redis), mysql.NewWalletChangeDAO(repo.MySQL))
	walletController := controller.NewWalletController(walletService)

	// 数据集管理
	datasetService := service.NewDatasetService(mysql.NewDatasetDAO(repo.MySQL), mysql.NewOutboxDAO(repo.MySQL), mongo.NewDatasetsPreviewDAO(repo.Mongo),
		redis.NewDatasetRedisDAO(repo.Redis), redis.NewRankRedisDAO(repo.Redis), minio.NewDatasetMinioDAO(repo.MinIO, repo.MinIOCore, cfg.MinIO.Buckets[util.DATASET_BUCKET], cfg.MinIO.Buckets[util.DATASET_TEMP_BUCKET]),
		mysql.NewUserStatsDAO(repo.MySQL), repo.MySQL)
	datasetController := controller.NewDatasetController(datasetService)

	// 交易记录管理
	transactionService := service.NewTransactionService(mysql.NewTransactionDAO(repo.MySQL), mysql.NewUserStatsDAO(repo.MySQL), repo.MySQL)
	transactionController := controller.NewTransactionController(transactionService)

	// 管理员
	adminService := service.NewAdminService(mysql.NewAdminDAO(repo.MySQL), mysql.NewOutboxDAO(repo.MySQL), mongo.NewDatasetsPreviewDAO(repo.Mongo), minio.NewAdminMinioDAO(repo.MinIO, cfg.MinIO.Buckets[util.DATASET_BUCKET]), repo.MySQL)
	adminController := controller.NewAdminController(adminService)

	// 首页公共路由（无需鉴权）
	homeService := service.NewHomeService(mysql.NewHomeDAO(repo.MySQL), redis.NewRankRedisDAO(repo.Redis))
	homeController := controller.NewHomeController(homeService)

	api := r.Group("/api")
	api.Use(middleware.InjectRepo(repo))
	{
		// 首页公共路由
		SetupHomeRouter(api, homeController)

		// 认证授权
		SetupAuthRouter(api, authController)

		// 钱包
		SetupWalletRouter(api, walletController)

		// 数据集管理
		SetupDatasetRouter(api, datasetController)

		// 交易记录管理
		SetupTransactionRouter(api, transactionController)

		// 管理员
		SetupAdminRouter(api, adminController)
	}

	// 定时清理临时桶
	go func() {
		t := time.NewTicker(24 * time.Hour)
		for {
			<-t.C
			_ = adminService.CleanupTempBucket(cfg.MinIO.Buckets[util.DATASET_TEMP_BUCKET], 24)
		}
	}()

	// 定时刷新首页排行榜（每5分钟）
	go func() {
		t := time.NewTicker(5 * time.Minute)
		for {
			<-t.C
			_ = homeService.RefreshHotRank(util.RANK_DEFAULT_LIMIT)
			_ = homeService.RefreshLatestRank(util.RANK_DEFAULT_LIMIT)
		}
	}()
}

func SetupHomeRouter(api *gin.RouterGroup, homeController *controller.HomeController) {
	// 公共首页数据，无需鉴权
	home := api.Group("/home")
	{
		home.GET("/stats", homeController.GetPlatformStats)
		home.GET("/rank/hot", homeController.GetHotRank)
		home.GET("/rank/latest", homeController.GetLatestRank)
	}
}

func SetupAuthRouter(api *gin.RouterGroup, authController *controller.AuthController) {

	// 认证相关路由
	auth := api.Group("/auth")
	{
		// 公开接口
		auth.POST("/register", authController.Register)              // 注册
		auth.POST("/login", authController.Login)                    // 登录
		auth.POST("/send-code", authController.SendEmailCode)        // 发送邮箱验证码
		auth.GET("/author-profile", authController.GetAuthorProfile) // 获取作者信息
		auth.POST("/reset-password", authController.ResetPassword)   // 重置密码
		auth.POST("/logout", authController.Logout)                  // 登出

		// 需要认证
		authGroup := auth.Group("").Use(middleware.AuthMiddleware())
		{
			authGroup.GET("/profile", authController.GetProfile)                  // 获取基本用户信息
			authGroup.PUT("/profile", authController.UpdateProfile)               // 更新基本用户信息
			authGroup.GET("/user-stats", authController.GetUserStats)             // 更新用户统计数据
			authGroup.POST("/favorites", authController.Favorites)                // 用户收藏数据集
			authGroup.POST("/unFavorites", authController.UnFavorites)            // 用户取消收藏数据集
			authGroup.GET("/favorites-status", authController.FavoritesStatus)    // 查看用户收藏状态
			authGroup.POST("/upgrade-seller", authController.UpgradeSeller)       // 成为商家
			authGroup.POST("/downgradeToUser", authController.DowngradeToUser)    // 成为商家失败回滚
			authGroup.GET("/favorites-list", authController.FavoritesList)        // 用户收藏数据集
			authGroup.GET("/transactions", authController.GetTransactions)        // 获取用户交易记录
			authGroup.GET("/download-records", authController.GetDownloadRecords) // 获取用户下载记录
			authGroup.GET("/author-stats", authController.GetAuthorStats)         // 获取作者统计数据
		}
	}

	// 角色权限
	roles := api.Group("/roles").Use(middleware.AuthMiddleware())
	{
		roles.POST("/check-permission")
		roles.GET("/info")
	}
}

func SetupWalletRouter(api *gin.RouterGroup, walletController *controller.WalletController) {
	// 钱包相关路由
	wallet := api.Group("/wallet").Use(middleware.AuthMiddleware())
	{
		wallet.GET("/isHasWallet", walletController.CheckWalletAddressExists) // 判断是否绑定钱包
		wallet.POST("/bind-wallet", walletController.BindWallet)              // 绑定钱包
		wallet.POST("/change-wallet", walletController.ChangeWallet)          // 更换钱包
	}
}

func SetupDatasetRouter(api *gin.RouterGroup, datasetController *controller.DatasetController) {
	dataset := api.Group("/dataset")
	dataset.GET("/list", datasetController.ListDatasets)                    // 获取数据集列表
	dataset.GET("/detail", datasetController.GetDatasetDetail)              // 获取数据集详情
	dataset.GET("/preview", datasetController.GetPreviewData)               // 获取预览数据
	dataset.GET("/paid-by-author", datasetController.GetAuthorPaidDatasets) // 作者的付费数据集
	// 数据集相关路由
	datasetGroup := dataset.Group("").Use(middleware.AuthMiddleware())
	{
		datasetGroup.POST("/upload-preview", datasetController.UploadPreview)               // 上传预览数据
		datasetGroup.POST("/init-multipart", datasetController.InitMultipartUpload)         // 初始化分片上传
		datasetGroup.POST("/get-part-url", datasetController.GetPartUploadURL)              // 获取某个分片的上传 URL
		datasetGroup.POST("/complete-multipart", datasetController.CompleteMultipartUpload) // 完成分片上传
		datasetGroup.POST("/abort-multipart", datasetController.AbortMultipartUpload)       // 中断分片上传
		datasetGroup.POST("/upload-dataset", datasetController.UploadDataset)               // 上传数据集
		datasetGroup.POST("/delete-dataset", datasetController.DeleteDataset)               // 删除数据集和文件
		datasetGroup.GET("/download-free", datasetController.DownloadFreeDataset)           // 下载免费数据集
		datasetGroup.GET("/download-paid", datasetController.DownloadPaidDataset)           // 下载付费数据集
		datasetGroup.GET("/download-status", datasetController.GetDownloadStatus)           // 下载状态
		datasetGroup.GET("/datasets-by-author", datasetController.GetAuthorDatasets)        // 作者的数据集
	}
}

func SetupTransactionRouter(api *gin.RouterGroup, transactionController *controller.TransactionController) {
	// 交易记录相关路由
	transaction := api.Group("/transaction").Use(middleware.AuthMiddleware())
	{
		transaction.POST("/list")                                                              // 获取交易记录
		transaction.POST("/create", transactionController.CreateTransaction)                   // 购买数据集、创建交易记录
		transaction.POST("/confirm", transactionController.ConfirmTransaction)                 // 确认交易记录
		transaction.DELETE("/delete-transaction/:id", transactionController.DeleteTransaction) // 删除交易记录
	}
}

func SetupAdminRouter(api *gin.RouterGroup, adminController *controller.AdminController) {
	admin := api.Group("/admin").Use(middleware.AuthMiddleware())
	{
		admin.GET("/stats", adminController.GetStats)                            // 获取统计数据
		admin.GET("/dashboard-analytics", adminController.GetDashboardAnalytics) // 获取仪表盘数据
		admin.GET("/users", adminController.GetUsers)                            // 获取用户列表
		admin.GET("/users/:userId", adminController.GetUserInfo)                 // 获取用户详情
		admin.POST("/users", adminController.AddUser)                            // 添加用户
		admin.PUT("/users/:userId", adminController.UpdateUserInfo)              // 更新用户信息
		admin.DELETE("/users/:userId", adminController.DeleteUser)               // 删除用户

		admin.GET("/datasets", adminController.GetDatasets)                       // 获取数据集列表
		admin.DELETE("/datasets/:datasetId", adminController.DeleteDataset)       // 删除数据集
		admin.PUT("/datasets/restore/:datasetId", adminController.RestoreDataset) // 恢复删除的数据集

		admin.POST("/fingerprint/detect", adminController.FingerprintDetect) // 指纹检测
		admin.GET("/fingerprint/records", adminController.GetDetectRecords)  // 获取指纹检测记录

		admin.GET("/minio/buckets", adminController.GetMinioBuckets)      // 获取 MinIO 桶列表
		admin.GET("/minio/objects", adminController.GetMinioObjects)      // 获取 MinIO 桶中的对象列表
		admin.DELETE("/minio/object", adminController.DeleteMinioObject)  // 删除 MinIO 桶中的对象
		admin.POST("/outbox/process", adminController.ProcessOutboxTasks) // 处理异步删除任务
	}
}
