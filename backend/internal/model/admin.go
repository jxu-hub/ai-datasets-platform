package model

// 月度增长率
type MonthlyGrowth struct {
	Users        float64 `json:"users"`        // 用户增长率 (%)
	Datasets     float64 `json:"datasets"`     // 数据集增长率 (%)
	Transactions float64 `json:"transactions"` // 交易增长率 (%)
}

// 增长趋势数据（用于图表）
type GrowthData struct {
	Name  string `json:"name"`  // 月份名称，如 "1月", "2月"
	Users int    `json:"users"` // 截止该月的累计用户数
}

// 交易量数据（用于图表）
type TransactionVolumeData struct {
	Name    string  `json:"name"`    // 星期名称，如 "周一", "周二"
	Revenue float64 `json:"revenue"` // 当天的交易金额
}

// 分类分布数据（用于饼图）
type CategoryDistributionData struct {
	Name  string `json:"name"`  // 分类名称
	Value int    `json:"value"` // 该分类的数据集数量
}

// 仪表板分析数据（主结构体）
type DashboardAnalytics struct {
	MonthlyGrowth        MonthlyGrowth              `json:"monthly_growth"`        // 月度增长率
	UserGrowth           []GrowthData               `json:"user_growth"`           // 用户增长趋势（最近6个月）
	TransactionVolume    []TransactionVolumeData    `json:"transaction_volume"`    // 交易量统计（本周每日）
	CategoryDistribution []CategoryDistributionData `json:"category_distribution"` // 数据集分类分布
}

// 添加用户请求体
type AdminAddUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// 更新用户信息请求体
type AdminUpdateUserInfoRequest struct {
	Username      string `json:"username"`
	Email         string `json:"email"`
	WalletAddress string `json:"walletAddress"`
}

// 用户统计数据响应
type AdminUserStatsResponse struct {
	TotalSpent     float64 `json:"totalSpent"`
	TotalUploads   uint    `json:"totalUploads"`
	TotalDownloads uint    `json:"totalDownloads"`
	TotalPurchases uint    `json:"totalPurchases"`
}

// 指纹检测响应
type AdminFingerprintDetectResponse struct {
	MatchResult   string `json:"matchResult"`
	DetectionTime string `json:"detectionTime"`
}

// 管理员数据集列表响应体
type AdminDatasetListResponse struct {
	ID                  uint    `json:"id"`
	Title               string  `json:"title"`
	Description         string  `json:"description"`
	Category            string  `json:"category"`
	Tags                string  `json:"tags"`
	Price               float64 `json:"price"`
	IsFree              bool    `json:"isFree"`
	ObjectName          string  `json:"objectName"`
	FileSize            int64   `json:"fileSize"`
	AuthorWalletAddress string  `json:"authorWalletAddress"`
	DownloadCount       int     `json:"downloadCount"`
	License             string  `json:"license"`
	CreatedAt           string  `json:"createdAt"`
	UpdatedAt           string  `json:"updatedAt"`
	Username            string  `json:"username"`
}

// minio 存储桶列表响应体
type MinioBucketResponse struct {
	Name         string `json:"name"`
	CreationDate string `json:"creationDate"`
}

// minio 存储桶中的对象列表响应体
type MinioObjectResponse struct {
	Name         string `json:"name"`
	Size         int64  `json:"size"`
	ETag         string `json:"etag"`
	LastModified string `json:"lastModified"`
	ContentType  string `json:"contentType"`
}
