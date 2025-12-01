package service

import (
	"backend/internal/config"
	"backend/internal/dao/minio"
	"backend/internal/dao/mysql"
	"backend/internal/dao/redis"
	mysql2 "backend/internal/model"
	"backend/internal/util"
	"encoding/json"
	"errors"
	"fmt"
	"gorm.io/gorm"
	"strconv"

	"mime/multipart"

	"go.uber.org/zap"
)

type AuthService struct {
	userDAO      *mysql.UserDAO
	userRedisDAO *redis.UserRedisDAO
	userMinioDAO *minio.UserMinioDAO
	db           *gorm.DB
}

func NewAuthService(userDAO *mysql.UserDAO, userRedisDAO *redis.UserRedisDAO, userMinioDAO *minio.UserMinioDAO, db *gorm.DB) *AuthService {
	return &AuthService{
		userDAO:      userDAO,
		userRedisDAO: userRedisDAO,
		userMinioDAO: userMinioDAO,
		db:           db,
	}
}

// 用户注册
func (s *AuthService) Register(req *mysql2.RegisterRequest) error {
	util.Info("开始处理用户注册", zap.String("username ", req.Username))

	// 检查用户是否已存在
	if s.userDAO.CheckUsernameExists(req.Username) {
		util.Error("用户名已存在", zap.String("username", req.Username))
		return errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在
	if s.userDAO.CheckEmailExists(req.Email) {
		util.Error("邮箱已存在", zap.String("email", req.Email))
		return errors.New("邮箱已存在")
	}

	// 密码加密
	passwordHash, err := util.HashPassword(req.Password)
	if err != nil {
		util.Error("密码加密失败", zap.Error(err))
		return errors.New("密码加密失败")
	}

	// 创建用户
	user := &mysql2.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: passwordHash,
	}

	if err := s.userDAO.CreateUser(user); err != nil {
		util.Error("用户注册失败", zap.Error(err))
		return errors.New("用户注册失败")
	}

	util.Info("用户注册成功", zap.String("username", req.Username))
	return nil
}

// 用户登录
func (s *AuthService) Login(req *mysql2.LoginRequest) (*mysql2.LoginResponse, error) {
	util.Info("开始处理用户登录", zap.String("email", req.EmailOrUsername))

	// 获取用户信息(用户名或邮箱登录)
	var user *mysql2.User
	var err error

	// 判断邮箱还是用户名
	if util.IsEmailed(req.EmailOrUsername) {
		// 邮箱
		user, err = s.userDAO.GetUserByEmail(req.EmailOrUsername)
	} else {
		// 用户名
		user, err = s.userDAO.GetUserByUsername(req.EmailOrUsername)
	}

	if err != nil {
		util.Error("邮箱或用户名不存在", zap.Error(err))
		return nil, errors.New("邮箱或密码错误")
	}

	// 验证密码
	if !util.CheckPassword(req.Password, user.PasswordHash) {
		util.Error("密码错误", zap.String("username", user.Username))
		return nil, errors.New("用户名或密码错误")
	}

	// 生成 JWT token
	token, err := util.GenerateToken(user.ID, user.Username)
	if err != nil {
		util.Error("生成token失败", zap.Error(err))
		return nil, errors.New("登录失败")
	}

	util.Info("用户登录成功", zap.String("username", user.Username))

	return &mysql2.LoginResponse{
		Token: token,
		User:  *user,
	}, nil
}

// 发送验证码
func (s *AuthService) SendEmailCode(email string) error {
	// 缓存验证码
	code, err := s.userRedisDAO.RedisEmailCode(email)
	if err != nil {
		util.Error("验证码存储失败", zap.Error(err))
		return errors.New(err.Error())
	}
	// 发送邮件
	cfg := config.LoadConfig()
	smtpHost := cfg.Email.SMTP.Host
	smtpPort := fmt.Sprintf("%d", cfg.Email.SMTP.Port)
	smtpUser := cfg.Email.SMTP.Username
	smtpPass := cfg.Email.SMTP.Password
	if err := util.SendEmailCode(smtpHost, smtpPort, smtpUser, smtpPass, email, code); err != nil {
		util.Error("邮件发送失败", zap.Error(err))
		return errors.New("邮件发送失败")
	}
	util.Info("邮件发送成功", zap.String("email", email))
	return nil
}

// 校验邮箱验证码
func (s *AuthService) VerifyEmailCode(email, code string) error {
	if err := s.userRedisDAO.VerifyEmailCode(email, code); err != nil {
		util.Error("验证码错误", zap.Error(err))
		return errors.New("验证码错误")
	}
	return nil
}

// 获取用户信息
func (s *AuthService) GetUserInfo(userID uint) (*mysql2.UserResponse, error) {
	// 1. 从 Redis 中查询
	userInfo, err := s.userRedisDAO.FromRedisGetUserInfo(userID)
	if err == nil && userInfo != nil {
		return userInfo, nil
	}

	// 2. 未命中查 MySQL
	user, err := s.userDAO.GetUserByID(userID)
	if err != nil {
		util.Error("用户信息查询失败", zap.Error(err))
		return nil, err
	}

	// 3. 设置 Redis 缓存
	resp := user.ToResponse()
	b, _ := json.Marshal(resp)
	err = s.userRedisDAO.ToRedisSetUserInfo(userID, b)
	return &resp, err
}

// 重置密码
func (s *AuthService) ResetPassword(req *util.ResetPasswordRequest) error {

	// 校验验证码
	if err := s.VerifyEmailCode(req.Email, req.VerificationCode); err != nil {
		util.Error("验证码错误", zap.String("email", req.Email))
		return errors.New("验证码错误")
	}

	// 获取用户信息
	user, err := s.userDAO.GetUserByEmail(req.Email)
	if err != nil {
		util.Error("邮箱不存在", zap.String("email", req.Email))
		return errors.New("用户不存在")
	}

	// 密码加密
	passwordHash, err := util.HashPassword(req.NewPassword)
	if err != nil {
		util.Error("密码加密失败", zap.Error(err))
		return errors.New("密码加密失败")
	}

	// 更新密码
	user.PasswordHash = passwordHash
	if err := s.userDAO.ResetPassword(user); err != nil {
		util.Error("密码更新失败", zap.Error(err))
		return errors.New("密码更新失败")
	}

	return nil
}

// 更新用户信息
func (s *AuthService) UpdateUserInfoWithAvatar(userID uint, req *mysql2.UpdateUserInfoRequest, avatarFile multipart.File, avatarHeader *multipart.FileHeader) error {
	// 获取用户信息
	user, err := s.userDAO.GetUserByID(userID)
	if err != nil {
		util.Error("用户不存在", zap.String("ID", strconv.Itoa(int(userID))))
		return errors.New("用户不存在")
	}
	user.Username = req.Username
	user.Email = req.Email
	if avatarFile != nil && avatarHeader != nil {
		avatarUrl, err := s.userMinioDAO.UploadAvatarToBucket(userID, avatarFile, avatarHeader.Size, avatarHeader.Header.Get("Content-Type"), avatarHeader.Filename)
		if err != nil {
			util.Error("头像上传失败", zap.Error(err))
			return errors.New("头像上传失败")
		}
		user.AvatarURL = avatarUrl
	}
	if err := s.userDAO.UpdateUser(user); err != nil {
		util.Error("更新失败", zap.Error(err))
		return errors.New("更新失败")
	}
	// 刷新 Redis 缓存
	resp := user.ToResponse()
	b, _ := json.Marshal(resp)
	err = s.userRedisDAO.ToRedisSetUserInfo(userID, b)
	return err
}

// 成为商家
func (s *AuthService) UpgradeSeller(u uint) error {
	return s.userDAO.UpgradeSeller(u)
}

// 成为商家失败回滚
func (s *AuthService) DowngradeToUser(u uint) error {
	return s.userDAO.DowngradeToUser(u)
}

// 获取作者信息
func (s *AuthService) GetAuthorInfo(authorWalletAddress string) (*mysql2.UserResponse, error) {
	// 从 Redis 中查询
	userInfo, err := s.userRedisDAO.FromRedisGetUserInfoByAddress(authorWalletAddress)
	if err == nil && userInfo != nil {
		return userInfo, nil
	}

	// 未命中查 MySQL
	user, err := s.userDAO.GetUserByWalletAddress(authorWalletAddress)
	if err != nil {
		util.Error("用户不存在", zap.Error(err))
		return nil, err
	}
	resp := user.ToResponse()
	// 设置 Redis 缓存
	b, _ := json.Marshal(resp)
	err = s.userRedisDAO.ToRedisSetUserInfoFromAddress(authorWalletAddress, b)
	return &resp, nil
}

// 用户收藏数据集
func (s *AuthService) Favorites(m *mysql2.FavoriteRequest) error {
	// 查询用户钱包地址
	var walletAddress string
	s.db.Model(&mysql2.User{}).Where("id = ?", m.UserId).Pluck("wallet_address", &walletAddress)
	favorites := &mysql2.Favorite{
		UserWalletAddress: walletAddress,
		DatasetID:         m.DatasetID,
	}
	return s.userDAO.Favorites(favorites)
}

// 用户取消收藏数据集
func (s *AuthService) UnFavorites(m *mysql2.FavoriteRequest) error {
	// 查询用户钱包地址
	var walletAddress string
	s.db.Model(&mysql2.User{}).Where("id = ?", m.UserId).Pluck("wallet_address", &walletAddress)
	favorites := &mysql2.Favorite{
		UserWalletAddress: walletAddress,
		DatasetID:         m.DatasetID,
	}
	return s.userDAO.UnFavorites(favorites)
}

// 查询用户收藏状态
func (s *AuthService) FavoritesStatus(userID uint, datasetID uint) (uint, error) {
	return s.userDAO.FavoritesStatus(userID, datasetID)
}

// 获取用户收藏列表
func (s *AuthService) FavoritesList(id uint) (*[]mysql2.DatasetListResponse, error) {
	return s.userDAO.FavoritesList(id)
}

// 获取用户统计数据
func (s *AuthService) GetUserStats(userId uint) (mysql2.UserStatsResponse, error) {
	return s.userDAO.GetUserStats(userId)
}

// 获取用户交易记录
func (s *AuthService) GetTransactions(userId uint) ([]mysql2.TransactionListResponse, error) {
	return s.userDAO.GetTransactions(userId)
}

// 获取用户下载记录
func (s *AuthService) GetDownloadRecords(userId uint) ([]mysql2.DownloadRecordResponse, error) {
	return s.userDAO.GetDownloadRecords(userId)
}

// 获取作者统计数据
func (s *AuthService) GetAuthorStats(address string) (mysql2.AuthorStatsResponse, error) {
	return s.userDAO.GetAuthorStats(address)
}
