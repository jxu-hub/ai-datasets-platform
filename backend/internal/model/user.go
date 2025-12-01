package model

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username      string `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email         string `gorm:"uniqueIndex;size:100;not null" json:"email"`
	WalletAddress string `gorm:"uniqueIndex;size:42;default:null" json:"walletAddress"`
	PasswordHash  string `gorm:"size:255;not null" json:"-"`
	Role          string `gorm:"type:enum('user','seller','admin');default:'user'" json:"role"`
	AvatarURL     string `gorm:"size:500;default:user-avatars/默认头像.png" json:"avatarUrl"`

	UserStats UserStats      `gorm:"foreignKey:WalletAddress;references:WalletAddress;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"userStats"`
	Requests  []WalletChange `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"requests"`
}

// 注册请求体
type RegisterRequest struct {
	Username         string `json:"username" binding:"required,min=4,max=16"`
	Email            string `json:"email" binding:"required,email"`
	Password         string `json:"password" binding:"required,min=6,max=20"`
	VerificationCode string `json:"verificationCode" binding:"required,len=6"`
}

// 登录请求体
type LoginRequest struct {
	EmailOrUsername string `json:"emailOrUsername" binding:"required"`
	Password        string `json:"password" binding:"required,min=6,max=20"`
}

// 登录响应体
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// 更改用户基本信息请求体
type UpdateUserInfoRequest struct {
	Username  string `json:"username" binding:"required,min=4,max=16"`
	AvatarURL string `json:"avatarUrl" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
}

// 绑定钱包请求体
type BindWalletRequest struct {
	WalletAddress string `json:"walletAddress" binding:"required,len=42"`
	Role          string `json:"role" binding:"required,oneof=user seller admin"`
}

// 用户信息响应
type UserResponse struct {
	ID            uint   `json:"id"`
	Username      string `json:"username"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	AvatarURL     string `json:"avatarUrl"`
	WalletAddress string `json:"walletAddress"`
	CreatedAt     string `json:"created_at"`
}

// 作者统计数据响应
type AuthorStatsResponse struct {
	TotalDatasets  int     `json:"totalDatasets"`
	TotalDownloads int     `json:"totalDownloads"`
	TotalRevenue   float64 `json:"totalRevenue"`
}

// 转换为响应格式
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:            u.ID,
		Username:      u.Username,
		Email:         u.Email,
		Role:          u.Role,
		AvatarURL:     u.AvatarURL,
		WalletAddress: u.WalletAddress,
		CreatedAt:     u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
