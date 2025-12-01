package mongo

import (
	"backend/internal/model"
	"context"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DatasetsPreviewDAO struct {
	mongoClient *mongo.Database
}

func NewDatasetsPreviewDAO(mongoClient *mongo.Database) *DatasetsPreviewDAO {
	return &DatasetsPreviewDAO{
		mongoClient: mongoClient,
	}
}

// getter
func (d DatasetsPreviewDAO) Client() *mongo.Database {
	return d.mongoClient
}

// 存入预览数据
func (d DatasetsPreviewDAO) SavePreviewData(req *model.UploadPreviewRequest) error {
	collection := d.mongoClient.Collection("datasets_preview")
	_, err := collection.InsertOne(context.Background(), req, options.InsertOne())
	if err != nil {
		return err
	}
	return nil
}

// 删除预览数据
func (d DatasetsPreviewDAO) DeletePreviewData(objectName string) error {
	collection := d.mongoClient.Collection("datasets_preview")
	filter := bson.M{"objectName": objectName}
	_, err := collection.DeleteOne(context.Background(), filter)
	return err
}

// 获取预览数据
func (d DatasetsPreviewDAO) GetPreviewData(name string) (model.PreviewResponse, error) {
	collection := d.mongoClient.Collection("datasets_preview")
	filter := bson.M{"objectName": name}
	var res model.PreviewResponse
	err := collection.FindOne(context.Background(), filter).Decode(&res)
	if err != nil {
		return model.PreviewResponse{}, err
	}
	return res, nil
}
