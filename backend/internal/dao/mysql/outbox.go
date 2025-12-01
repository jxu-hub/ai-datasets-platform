package mysql

import (
	"backend/internal/model"
	"fmt"
	"gorm.io/gorm"
)

type OutboxDAO struct {
	db *gorm.DB
}

func NewOutboxDAO(db *gorm.DB) *OutboxDAO {
	return &OutboxDAO{db: db}
}

// 插入任务
func (d OutboxDAO) InsertTask(tx *gorm.DB, m *model.Outbox) error {
	return tx.Create(m).Error
}

// 获取待处理任务
func (d OutboxDAO) GetPendingTasks() ([]*model.Outbox, error) {
	var task []*model.Outbox
	err := d.db.Where("status = ?", "pending").Find(&task).Error
	return task, err
}

// 更新任务状态
func (d OutboxDAO) MarkTasksDone(id uint) error {
	return d.db.Model(&model.Outbox{}).Where("id = ?", id).Update("status", "done").Error
}

// 更新任务状态 TX
func (d OutboxDAO) MarkTasksDoneTX(tx *gorm.DB, u uint) error {
	return tx.Model(&model.Outbox{}).Where("id = ?", u).Update("status", "done").Error
}

// 取消删除数据集文件任务
func (d OutboxDAO) CancelDeleteMinioObjectTask(tx *gorm.DB, objectName string) error {
	payload := fmt.Sprintf(`{"objectName": "%s"}`, objectName)
	return tx.Where("event_type = ? AND payload = ?", "delete_minio_object", payload).Delete(&model.Outbox{}).Error
}
