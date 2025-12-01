package redis

import (
	"backend/internal/model"
	"backend/internal/util"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
	"time"
)

type UserRedisDAO struct {
	redis *redis.Client
}

func NewUserRedisDAO(redis *redis.Client) *UserRedisDAO {
	return &UserRedisDAO{
		redis: redis,
	}
}

// 缓存验证码
func (a UserRedisDAO) RedisEmailCode(email string) (string, error) {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%s", util.EMAIL_VERIFY_CODE, email)
	redisSendKey := fmt.Sprintf("%s:%s", util.CODE_TTLS, email)

	// 60秒内只能发送一次
	if ttl, err := a.redis.TTL(ctx, redisSendKey).Result(); err == nil && ttl > 0 {
		util.Error("请勿频繁获取验证码", zap.String("email", email))
		return "", errors.New("请勿频繁获取验证码")
	}

	code := util.GenerateCode()
	// 缓存验证码，有限期 5 分钟
	err := a.redis.Set(ctx, redisKey, code, 5*time.Minute).Err()
	if err != nil {
		util.Error("验证码缓存失败", zap.Error(err))
		return "", errors.New("验证码缓存失败")
	}

	util.Info("验证码缓存成功", zap.String("code", code))
	// 设置 60 秒发送限制
	a.redis.Set(ctx, redisSendKey, "1", 60*time.Second)
	return code, nil
}

// 验证邮箱验证码
func (a UserRedisDAO) VerifyEmailCode(email, code string) error {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%s", util.EMAIL_VERIFY_CODE, email)
	val, err := a.redis.Get(ctx, redisKey).Result()
	if val != code {
		util.Info("验证码错误", zap.String("email", email))
		return errors.New("验证码错误")
	}

	if err != nil {
		util.Error("验证码已过期或不存在", zap.Error(err))
		return errors.New(err.Error())
	}

	// 验证通过后删除验证码
	a.redis.Del(ctx, redisKey)
	util.Info("验证码校验成功", zap.String("email", email))
	return nil
}

// 从 redis 中查询用户信息
func (a UserRedisDAO) FromRedisGetUserInfo(userID uint) (*model.UserResponse, error) {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%d", util.USER_PROFILE, userID)
	val, err := a.redis.Get(ctx, redisKey).Result()
	if err == nil && val != "" {
		util.Info("用户信息缓存中标， Redis返回用户信息", zap.String("redisKey", redisKey))
		var resp model.UserResponse
		if err := json.Unmarshal([]byte(val), &resp); err == nil {
			return &resp, nil
		}
	}
	util.Info("用户信息缓存未中标， sql查询", zap.String("redisKey", redisKey))
	return nil, errors.New(err.Error())
}

// 将用户信息缓存到 redis
func (a UserRedisDAO) ToRedisSetUserInfo(userID uint, user []byte) error {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%d", util.USER_PROFILE, userID)
	err := a.redis.Set(ctx, redisKey, user, time.Hour).Err()
	if err != nil {
		util.Error("用户信息缓存失败", zap.Error(err))
		return err
	}
	util.Info("用户信息缓存成功", zap.String("redisKey", redisKey))
	return nil
}

// 清除用户信息的redis缓存
func (a UserRedisDAO) DelRedisUserInfo(id uint) error {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%d", util.USER_PROFILE, id)
	err := a.redis.Del(ctx, redisKey).Err()
	if err != nil {
		util.Error("清除用户信息缓存失败", zap.Error(err))
		return err
	}
	util.Info("清除用户信息缓存成功", zap.String("redisKey", redisKey))
	return nil
}

// 从 redis 中查询作者信息 根据钱包地址
func (a UserRedisDAO) FromRedisGetUserInfoByAddress(address string) (*model.UserResponse, error) {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%s", util.A, address)
	val, err := a.redis.Get(ctx, redisKey).Result()
	if err == nil && val != "" {
		util.Info("用户信息缓存中标， Redis返回作者信息", zap.String("redisKey", redisKey))
		var resp model.UserResponse
		if err := json.Unmarshal([]byte(val), &resp); err == nil {
			return &resp, nil
		}
	}
	util.Info("用户信息缓存未中标， sql查询", zap.String("redisKey", redisKey))
	return nil, errors.New(err.Error())
}

// 将作者信息缓存到 redis 根据钱包地址
func (a UserRedisDAO) ToRedisSetUserInfoFromAddress(address string, b []byte) error {
	ctx := context.Background()
	redisKey := fmt.Sprintf("%s:%s", util.A, address)
	err := a.redis.Set(ctx, redisKey, b, time.Hour).Err()
	if err != nil {
		util.Error("用户信息缓存失败", zap.Error(err))
		return err
	}
	util.Info("用户信息缓存成功", zap.String("redisKey", redisKey))
	return nil
}
