package config

import (
	"backend/internal/util"
	"sync"

	"github.com/spf13/viper"
	"go.uber.org/zap"
)

type Config struct {
	Server struct {
		Port string
		Mode string
	} `json:"server"`

	MySQL struct {
		Host         string
		Port         int
		User         string
		Password     string
		DBName       string
		Charset      string
		MaxIdleConns int
		MaxOpenConns int
	} `json:"mysql"`

	MongoDB struct {
		Host       string
		Port       int
		Username   string
		Password   string
		Datasets   string
		AuthSource string
	} `json:"mongoDB"`

	Redis struct {
		Host     string
		Port     int
		Password string
		DB       int
	} `json:"redis"`

	MinIO struct {
		Endpoint  string
		AccessKey string
		SecretKey string
		UseSSL    bool
		Buckets   map[string]string
	} `json:"minio"`

	Email struct {
		SMTP struct {
			Host     string
			Port     int
			Username string
			Password string
		} `json:"smtp"`
		From             string `json:"from"`
		VerifyCodeExpire int    `json:"verify_code_expire"`
		SendLimit        int    `json:"send_limit"`
	} `json:"email"`
}

var cfg *Config
var once sync.Once

func LoadConfig() *Config {
	once.Do(func() {
		viper.SetConfigName("config")   // 文件名
		viper.SetConfigType("yaml")     // 文件类型
		viper.AddConfigPath("./config") // 文件路径
		err := viper.ReadInConfig()
		if err != nil {
			util.Error("配置文件读取失败", zap.Error(err))
		}
		cfg = &Config{}
		err = viper.Unmarshal(cfg)
		if err != nil {
			util.Error("配置文件解析失败", zap.Error(err))
		}
	})
	return cfg
}
