package util

import (
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Logger *zap.Logger

// InitLogger 初始化日志
// mode = "dev" → 控制台文本日志
// mode = "prod" → 文件 JSON 日志 + 日志切割
func InitLogger(mode string) {
	var core zapcore.Core

	if mode == "dev" {
		// 开发环境 → 控制台日志（带颜色）
		encoder := getConsoleEncoder()
		core = zapcore.NewCore(encoder, zapcore.AddSync(os.Stdout), zapcore.DebugLevel)
	} else {
		// 生产环境 → 文件 JSON 日志（带切割）
		encoder := getJSONEncoder()
		writeSyncer := getLogWriter()
		core = zapcore.NewCore(encoder, writeSyncer, zapcore.InfoLevel)
	}

	Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1)) // 显示调用文件和行号,跳过封装这一层
}

// 控制台输出编码器
func getConsoleEncoder() zapcore.Encoder {
	encoderConfig := zap.NewDevelopmentEncoderConfig()
	encoderConfig.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		enc.AppendString(t.Format("2006-01-02 15:04:05"))
	}
	encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	encoderConfig.EncodeCaller = zapcore.ShortCallerEncoder
	return zapcore.NewConsoleEncoder(encoderConfig)
}

// JSON 编码器（适合生产环境）
func getJSONEncoder() zapcore.Encoder {
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.TimeKey = "time"
	encoderConfig.LevelKey = "level"
	encoderConfig.CallerKey = "caller"
	encoderConfig.MessageKey = "msg"
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.LowercaseLevelEncoder
	encoderConfig.EncodeCaller = zapcore.ShortCallerEncoder
	return zapcore.NewJSONEncoder(encoderConfig)
}

// 日志文件写入器（带切割）
func getLogWriter() zapcore.WriteSyncer {
	lumberJackLogger := &lumberjack.Logger{
		Filename:   "./logs/app.log", // 日志文件路径
		MaxSize:    10,               // 单个日志文件最大 10 MB
		MaxBackups: 5,                // 最多保留 5 个旧日志
		MaxAge:     30,               // 最多保留 30 天
		Compress:   true,             // 是否压缩旧日志
	}
	return zapcore.AddSync(lumberJackLogger)
}

// 封装常用方法
func Info(msg string, fields ...zap.Field) {
	Logger.Info(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Logger.Error(msg, fields...)
}

func Debug(msg string, fields ...zap.Field) {
	Logger.Debug(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Logger.Warn(msg, fields...)
}
