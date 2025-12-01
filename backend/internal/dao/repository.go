package dao

import (
	"backend/internal/config"
	_ "backend/internal/config"
	"backend/internal/util"
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Repository struct {
	MySQL     *gorm.DB
	Mongo     *mongo.Database
	Redis     *redis.Client
	MinIO     *minio.Client
	MinIOCore *minio.Core
}

// 初始化数据库
func InitRepositories() (*Repository, error) {
	repo := &Repository{}

	cfg := config.LoadConfig()

	// 初始化 MySQL "root:123456@tcp(127.0.0.1:3306)/datasets?charset=utf8mb4&parseTime=True&loc=Local"
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		cfg.MySQL.User, cfg.MySQL.Password, cfg.MySQL.Host, cfg.MySQL.Port, cfg.MySQL.DBName, cfg.MySQL.Charset)
	fmt.Println(dsn)
	mysqlDB, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	sqlDb, err := mysqlDB.DB()
	if err != nil {
		return nil, err
	}
	sqlDb.SetMaxOpenConns(cfg.MySQL.MaxOpenConns) // 最大连接数
	sqlDb.SetMaxIdleConns(cfg.MySQL.MaxIdleConns) // 最大空闲连接数
	sqlDb.SetConnMaxLifetime(time.Hour)           // 最大生命周期
	if err != nil {
		util.Error("MySQL连接失败", zap.Error(err))
		return nil, err
	}

	if err := sqlDb.Ping(); err != nil {
		util.Error("MySQL连接失败", zap.Error(err))
		return nil, err
	}
	repo.MySQL = mysqlDB
	util.Info("MySQL初始化成功", zap.String("db", "mysql"))

	// 初始化 MongoDB "mongodb://localhost:27017"
	mongoURL := fmt.Sprintf("mongodb://%s:%s@%s:%d/%s?authSource=%s",
		cfg.MongoDB.Username, cfg.MongoDB.Password, cfg.MongoDB.Host, cfg.MongoDB.Port, cfg.MongoDB.Datasets, cfg.MongoDB.AuthSource)
	fmt.Println(mongoURL)
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURL))
	if err != nil {
		util.Error("MongoDB连接失败", zap.Error(err))
		return nil, err
	}
	if err := client.Ping(context.Background(), nil); err != nil {
		util.Error("MongoDB连接失败", zap.Error(err))
		return nil, err
	}
	repo.Mongo = client.Database("datasets")
	util.Info("MongoDB初始化成功", zap.String("db", "mongoDB"))

	// 初始化 Redis
	redisAddr := fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port)
	fmt.Println(redisAddr)
	redisClient := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: cfg.Redis.Password,
		DB:       0,
	})
	if _, err := redisClient.Ping(context.Background()).Result(); err != nil {
		util.Error("Redis连接失败", zap.Error(err))
		return nil, err
	}
	repo.Redis = redisClient
	util.Info("Redis初始化成功", zap.String("db", "redis"))

	// 初始化 MinIO
	transport := &http.Transport{
		MaxIdleConns:        100,
		IdleConnTimeout:     30 * time.Minute, // 保证大文件上传过程中不会断
		TLSHandshakeTimeout: 10 * time.Second,
	}

	minioClient, err := minio.New(cfg.MinIO.Endpoint, &minio.Options{
		Creds:     credentials.NewStaticV4(cfg.MinIO.AccessKey, cfg.MinIO.SecretKey, ""),
		Secure:    cfg.MinIO.UseSSL, // 是否使用 SSL 证书
		Transport: transport,
	})

	if err != nil {
		util.Error("MinIO连接失败", zap.Error(err))
		return nil, err
	}
	if _, err := minioClient.ListBuckets(context.Background()); err != nil {
		util.Error("MinIO连接失败", zap.Error(err))
		return nil, err
	}
	repo.MinIO = minioClient

	minioCore, err := minio.NewCore(cfg.MinIO.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIO.AccessKey, cfg.MinIO.SecretKey, ""),
		Secure: cfg.MinIO.UseSSL, // 是否使用 SSL 证书
	})

	if err != nil {
		util.Error("MinIO Core连接失败", zap.Error(err))
		return nil, err
	}
	if _, err := minioCore.ListBuckets(context.Background()); err != nil {
		util.Error("MinIO Core连接失败", zap.Error(err))
		return nil, err
	}

	repo.MinIOCore = minioCore
	util.Info("MinIO初始化成功", zap.String("db", "minio"))

	return repo, nil
}
