package model

import "time"

type DetectRecord struct {
	ID              int       `json:"id" gorm:"primaryKey"`
	DatasetID       *int      `json:"datasetID" gorm:"size:255;index:idx_dataset_id"`
	Filename        string    `json:"filename" gorm:"size:255;index:idx_filename;not null"`
	FileSize        int64     `json:"fileSize" gorm:"size:255"`
	DetectionTime   string    `json:"detectionTime" gorm:"size:20"`
	Timestamp       *string   `json:"timestamp" gorm:"size:255"`
	DetectionResult string    `json:"detectionResult" gorm:"size:255;index:idx_detection_result;not null"`
	CreatedAt       time.Time `gorm:"autoCreateTime(3)" json:"createdAt"`
}

// 检测记录响应体
type DetectRecordResponse struct {
	DatasetID       int    `json:"datasetID"`
	Filename        string `json:"filename"`
	FileSize        uint64 `json:"fileSize"`
	Timestamp       string `json:"timestamp"`
	DetectionTime   string `json:"detectionTime"`
	DetectionResult string `json:"detectionResult"`
	CreatedAt       string `json:"createdAt"`
}
