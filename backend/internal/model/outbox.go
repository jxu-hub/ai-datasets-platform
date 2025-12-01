package model

import "time"

type Outbox struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	EventType string    `json:"eventType" gorm:"type:varchar(100);index:idx_type_payload,not null"`
	Payload   string    `json:"payload" gorm:"type:varchar(255);index:idx_type_payload,not null"`
	Status    string    `json:"status" gorm:"type:enum('pending', 'done', 'failed');not null"`
	CreatedAt time.Time `json:"createdAt" gorm:"type:timestamp;not null"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"type:timestamp;not null"`
}
