package model

import (
	"gorm.io/gorm"
)

// Dataset 数据集表结构体
// 对应MySQL表 datasets
// 字段含义详见 db/mysql_schema.md
// 注意：使用钱包地址而不是用户ID来标识作者，确保与区块链数据一致
type Dataset struct {
	gorm.Model
	Title               string  `gorm:"type:varchar(200);not null" json:"title"`
	Description         string  `gorm:"type:text" json:"description"`
	Category            string  `gorm:"type:varchar(50);not null;index:idx_category" json:"category"`
	Tags                string  `gorm:"type:varchar(200)" json:"tags"`
	Price               float64 `gorm:"type:decimal(10,2);default:0.00" json:"price"`
	IsFree              bool    `gorm:"type:boolean;default:false;index:idx_is_free" json:"isFree"`
	BucketName          string  `gorm:"type:varchar(100);not null" json:"-"`
	ObjectName          string  `gorm:"type:varchar(200);not null" json:"objectName"`
	FileSize            int64   `gorm:"type:bigint;not null;index:idx_file_size" json:"fileSize"`
	AuthorWalletAddress string  `gorm:"type:varchar(42);not null;index:idx_author_wallet" json:"authorWalletAddress"`
	DownloadCount       int     `gorm:"type:int;default:0" json:"download_count"`
	License             string  `gorm:"type:varchar(100);not null" json:"license"`
}

// 上传预览数据请求体
type UploadPreviewRequest struct {
	UserID       uint          `json:"userID" bson:"userID" binding:"required"`
	OwnerAddress string        `json:"ownerAddress" bson:"ownerAddress" binding:"required"`
	PreviewData  []interface{} `json:"previewData" bson:"previewData" binding:"required"`
	ObjectName   string        `json:"objectName" bson:"objectName" binding:"required"`
	FileSize     int64         `json:"fileSize" bson:"fileSize" binding:"required"`
}

// 预览数据响应体
type PreviewResponse struct {
	ObjectName  string   `json:"objectName" bson:"objectName"`
	FileSize    int64    `json:"fileSize" bson:"fileSize"`
	PreviewData []string `json:"preview" bson:"previewData"`
}

// 上传数据集请求体
type UploadDatasetRequest struct {
	Title               string  `json:"title" binding:"required"`
	Description         string  `json:"description" binding:"required"`
	Category            string  `json:"category" binding:"required"`
	Tags                string  `json:"tags" binding:"required"`
	Price               float64 `json:"price"`
	IsFree              bool    `json:"isFree"`
	ObjectName          string  `json:"objectName" binding:"required"`
	FileSize            int64   `json:"fileSize" binding:"required"`
	AuthorWalletAddress string  `json:"authorWalletAddress" binding:"required"`
	License             string  `json:"license" binding:"required"`
}

// 删除数据集和文件请求体
type DeleteDatasetRequest struct {
	DatasetID  uint   `json:"datasetId" binding:"required"`
	ObjectName string `json:"objectName" binding:"required"`
}

// 数据集列表响应体
type DatasetListResponse struct {
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
}
