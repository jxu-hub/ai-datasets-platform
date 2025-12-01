package model

type UserStats struct {
	ID             uint    `gorm:"primaryKey" json:"id"`
	WalletAddress  *string `gorm:"uniqueIndex;size:42;not null" json:"walletAddress"`
	TotalSpent     float64 `gorm:"default:0" json:"totalSpent"`
	TotalUploads   uint    `gorm:"default:0" json:"totalUploads"`
	TotalDownloads uint    `gorm:"default:0" json:"totalDownloads"`
	TotalPurchases uint    `gorm:"default:0" json:"totalPurchases"`
}

type UserStatsResponse struct {
	TotalSpent         float64  `json:"totalSpent"`
	TotalUploads       uint     `json:"totalUploads"`
	TotalDownloads     uint     `json:"totalDownloads"`
	TotalPurchases     uint     `json:"totalPurchases"`
	PurchasedDatasets  []string `json:"purchasedDatasets"`
	DownloadedDatasets []string `json:"downloadedDatasets"`
}
