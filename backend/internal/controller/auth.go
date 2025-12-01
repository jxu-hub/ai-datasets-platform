package controller

import (
	"backend/internal/model"
	"backend/internal/service"
	"backend/internal/util"
	"strconv"

	"mime/multipart"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type AuthController struct {
	authService *service.AuthService
}

func NewAuthController(authService *service.AuthService) *AuthController {
	return &AuthController{
		authService: authService,
	}
}

// 用户注册
func (ac *AuthController) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}
	// 校验邮箱验证码
	if err := ac.authService.VerifyEmailCode(req.Email, req.VerificationCode); err != nil {
		util.Error("验证码错误", zap.Error(err))
		util.BadRequest(c, err.Error())
		return
	}
	// 调用 service 层处理注册逻辑
	if err := ac.authService.Register(&req); err != nil {
		util.Error("用户注册失败", zap.Error(err))
		util.BadRequest(c, err.Error())
		return
	}

	util.Info("用户注册成功", zap.String("user", req.Username))
	util.Success(c, 200, gin.H{
		"message": "注册成功",
	})
}

// 用户登录
func (ac *AuthController) Login(c *gin.Context) {
	var req model.LoginRequest

	// 绑定请求参数
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	// 调用 service 层处理登录逻辑
	res, err := ac.authService.Login(&req)
	if err != nil {
		util.Unauthorized(c, err.Error())
		return
	}

	// 设置 cookie
	c.SetCookie("auth_token", res.Token, 3600*24*7, "/", "", false, true)

	// 返回成功响应
	util.Success(c, 200, gin.H{
		"token": res.Token,
		"user":  res.User.ToResponse(),
	})
}

// 获取用户信息
func (ac *AuthController) GetProfile(c *gin.Context) {
	// 从中间件获取用户 ID
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	// 调用服务层获取用户信息（只返回 UserResponse）
	user, err := ac.authService.GetUserInfo(userID)
	if err != nil {
		util.InternalServerError(c, err.Error())
		return
	}

	util.Success(c, 200, user)
}

// 更新用户信息
func (ac *AuthController) UpdateProfile(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}
	userID := userIdStr.(uint)
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		util.Error("表单解析失败", zap.Error(err))
		util.BadRequest(c, "表单解析失败: "+err.Error())
		return
	}
	username := c.PostForm("username")
	email := c.PostForm("email")
	avatarFile, avatarHeader, err := c.Request.FormFile("avatar")
	var avatarFilePtr multipart.File
	var avatarHeaderPtr *multipart.FileHeader
	if err == nil && avatarFile != nil {
		avatarFilePtr = avatarFile
		avatarHeaderPtr = avatarHeader
	}
	req := model.UpdateUserInfoRequest{
		Username: username,
		Email:    email,
	}
	err = ac.authService.UpdateUserInfoWithAvatar(userID, &req, avatarFilePtr, avatarHeaderPtr)
	if err != nil {
		util.Error("更新用户信息失败", zap.String("userID", strconv.Itoa(int(userID))))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("更新用户信息成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"message": "更新用户信息成功",
	})
}

// 用户登出
func (ac *AuthController) Logout(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true) // 清除cookie
	util.Info("用户登出成功")
	util.Success(c, 200, gin.H{
		"message": "登出成功",
	})
}

// 发送邮箱验证码
func (ac *AuthController) SendEmailCode(c *gin.Context) {
	type Req struct {
		Email string `json:"email" binding:"required,email"`
	}
	var req Req
	if err := c.ShouldBindJSON(&req); err != nil {
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}
	if err := ac.authService.SendEmailCode(req.Email); err != nil {
		util.BadRequest(c, err.Error())
		return
	}
	util.Success(c, 200, gin.H{"message": "验证码已发送"})
}

// 重置密码
func (ac *AuthController) ResetPassword(c *gin.Context) {
	var req util.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
	}
	if err := ac.authService.ResetPassword(&req); err != nil {
		util.Error("重置密码失败", zap.Error(err))
	}
	util.Info("重置密码成功")

	util.Success(c, 200, gin.H{"message": "重置密码成功"})
}

// 成为商家
func (ac *AuthController) UpgradeSeller(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}
	userID := userIdStr.(uint)
	err := ac.authService.UpgradeSeller(userID)
	if err != nil {
		util.Error("成为商家失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("成为商家成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"message": "恭喜你成为商家",
	})
}

// 成为商家失败回滚
func (ac *AuthController) DowngradeToUser(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	err := ac.authService.DowngradeToUser(userID)
	if err != nil {
		util.Error("状态回滚失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("状态回滚成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"message": "状态回滚成功",
	})
}

// 获取作者信息
func (ac *AuthController) GetAuthorProfile(c *gin.Context) {
	authorWalletAddress := c.Query("authorWalletAddress")
	if authorWalletAddress == "" {
		util.Error("参数错误", zap.String("authorWalletAddress", authorWalletAddress))
		util.BadRequest(c, "参数错误: authorWalletAddress 不能为空")
		return
	}
	author, err := ac.authService.GetAuthorInfo(authorWalletAddress)
	if err != nil {
		util.Error("获取作者信息失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Success(c, 200, gin.H{
		"data": author,
	})
}

// 用户收藏数据集
func (ac *AuthController) Favorites(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.Uint("userID", userIdStr.(uint)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	var req model.FavoriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(c, "参数格式错误: "+err.Error())
		return
	}

	if err := ac.authService.Favorites(&req); err != nil {
		util.Error("获取收藏数据集失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("用户收藏数据集成功", zap.Uint("userID", userIdStr.(uint)))
	util.Success(c, 200, gin.H{
		"message": "已添加到收藏夹",
	})
}

// 用户取消收藏数据集
func (ac *AuthController) UnFavorites(context *gin.Context) {
	userIdStr, exists := context.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.Uint("userID", userIdStr.(uint)))
		util.Unauthorized(context, "用户未登录")
		return
	}

	var req model.FavoriteRequest
	if err := context.ShouldBindJSON(&req); err != nil {
		util.Error("参数格式错误", zap.Error(err))
		util.BadRequest(context, "参数格式错误: "+err.Error())
		return
	}

	if err := ac.authService.UnFavorites(&req); err != nil {
		util.Error("获取收藏数据集失败", zap.Error(err))
		util.InternalServerError(context, err.Error())
		return
	}

	util.Info("用户取消收藏数据集成功", zap.Uint("userID", userIdStr.(uint)))
	util.Success(context, 200, gin.H{
		"message": "已取消收藏",
	})
}

// 查看用户收藏状态
func (ac *AuthController) FavoritesStatus(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	datasetID, err := strconv.Atoi(c.Query("datasetID"))
	if err != nil {
		util.Error("参数错误", zap.Error(err))
		util.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	userID := userIdStr.(uint)

	isFavorited, err := ac.authService.FavoritesStatus(userID, uint(datasetID))
	if err != nil {
		util.Error("查询收藏状态失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("查询收藏状态成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"isFavorited": isFavorited,
	})
}

// 获取用户收藏列表
func (ac *AuthController) FavoritesList(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	favoritesList, err := ac.authService.FavoritesList(userID)
	if err != nil {
		util.Error("获取收藏数据集列表失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取收藏数据集列表成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"data": favoritesList,
	})
}

// 获取用户统计数据
func (ac *AuthController) GetUserStats(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	userStats, err := ac.authService.GetUserStats(userID)
	if err != nil {
		util.Error("获取用户统计数据失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取用户统计数据成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"data": userStats,
	})
}

// 获取用户交易记录
func (ac *AuthController) GetTransactions(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)

	transactions, err := ac.authService.GetTransactions(userID)
	if err != nil {
		util.Error("获取用户交易记录失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取用户交易记录成功", zap.String("userID", strconv.Itoa(int(userID))))
	util.Success(c, 200, gin.H{
		"data": transactions,
	})
}

// 获取用户下载记录
func (ac *AuthController) GetDownloadRecords(c *gin.Context) {
	userIdStr, exists := c.Get("userID")
	if !exists {
		util.Error("用户未登录", zap.String("userID", userIdStr.(string)))
		util.Unauthorized(c, "用户未登录")
		return
	}

	userID := userIdStr.(uint)
	downloadRecords, err := ac.authService.GetDownloadRecords(userID)
	if err != nil {
		util.Error("获取用户下载记录失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}
	util.Info("获取用户下载记录成功", zap.String("userID", strconv.Itoa(int(userID))))

	util.Success(c, 200, gin.H{
		"data": downloadRecords,
	})
}

// 获取作者统计数据
func (ac *AuthController) GetAuthorStats(c *gin.Context) {
	authorWalletAddress := c.Query("authorWalletAddress")
	if authorWalletAddress == "" {
		util.Error("参数错误", zap.String("authorWalletAddress", authorWalletAddress))
		util.BadRequest(c, "参数错误: authorWalletAddress 不能为空")
		return
	}

	authorStats, err := ac.authService.GetAuthorStats(authorWalletAddress)
	if err != nil {
		util.Error("获取作者统计数据失败", zap.Error(err))
		util.InternalServerError(c, err.Error())
		return
	}

	util.Info("获取作者统计数据成功", zap.String("authorWalletAddress", authorWalletAddress))
	util.Success(c, 200, gin.H{
		"data": authorStats,
	})
}
