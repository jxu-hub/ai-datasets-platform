package mysql

import (
	"backend/internal/model"
	"errors"
	"gorm.io/gorm"
)

type UserDAO struct {
	db *gorm.DB
}

func NewUserDAO(db *gorm.DB) *UserDAO {
	return &UserDAO{db: db}
}

// 创建用户
func (d *UserDAO) CreateUser(user *model.User) error {
	return d.db.Create(user).Error
}

// 根据 ID 获取用户
func (d *UserDAO) GetUserByID(id uint) (*model.User, error) {
	var user model.User
	err := d.db.First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}
	return &user, nil
}

// 根据 walletAddress 获取用户
func (d *UserDAO) GetUserByWalletAddress(walletAddress string) (*model.User, error) {
	var user model.User
	err := d.db.Where("wallet_address = ?", walletAddress).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}
	return &user, nil
}

// 根据用户名获取用户
func (d *UserDAO) GetUserByUsername(username string) (*model.User, error) {
	var user model.User
	err := d.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}
	return &user, nil
}

// 根据邮箱获取用户
func (d *UserDAO) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	err := d.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("邮箱未注册")
		}
		return nil, err
	}
	return &user, nil
}

// 检查用户名是否存在
func (d *UserDAO) CheckUsernameExists(username string) bool {
	var count int64
	d.db.Model(&model.User{}).Where("username = ?", username).Count(&count) // count不是表对应的结构体，所以需要指定model
	return count > 0
}

// 检查邮箱是否存在
func (d *UserDAO) CheckEmailExists(email string) bool {
	var count int64
	d.db.Model(&model.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}

// 更新用户信息
func (d *UserDAO) UpdateUser(user *model.User) error {
	updates := map[string]interface{}{
		"username":   user.Username,
		"email":      user.Email,
		"avatar_url": user.AvatarURL,
	}
	return d.db.Model(user).Updates(updates).Error
}

// 重置密码
func (d *UserDAO) ResetPassword(user *model.User) error {
	return d.db.Model(user).Update("password_hash", user.PasswordHash).Error
}

// 绑定钱包（单独更新钱包地址）
func (d *UserDAO) BindWallet(userID uint, newWalletAddress string, role string) error {
	updates := map[string]interface{}{
		"wallet_address": newWalletAddress,
		"role":           role,
	}
	return d.db.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error
}

// 查询用户钱包地址
func (d *UserDAO) GetUserWalletAddress(userID uint) (string, error) {
	var walletAddress string
	err := d.db.Model(&model.User{}).Where("id = ?", userID).Pluck("wallet_address", &walletAddress).Error
	return walletAddress, err
}

// 检查钱包地址是否存在
func (d *UserDAO) CheckWalletAddressExists(userID uint) bool {
	var count int64
	d.db.Model(&model.User{}).Where("id = ? AND wallet_address != ''", userID).Count(&count)
	return count > 0
}

// 检查钱包地址是否已绑定
func (d *UserDAO) CheckWalletAddressIsBind(walletAddress string) bool {
	var count int64
	d.db.Model(&model.User{}).Where("wallet_address = ?", walletAddress).Count(&count)
	return count > 0
}

// 成为商家
func (d *UserDAO) UpgradeSeller(id uint) error {
	// 更新角色为seller
	return d.db.Model(&model.User{}).Where("id = ?", id).Update("role", "seller").Error
}

// 成为商家失败回滚
func (d *UserDAO) DowngradeToUser(u uint) error {
	// 更新角色为user
	return d.db.Model(&model.User{}).Where("id = ?", u).Update("role", "user").Error
}

// 用户收藏数据集
func (d *UserDAO) Favorites(m *model.Favorite) error {
	return d.db.Create(m).Error
}

// 用户取消收藏数据集
func (d *UserDAO) UnFavorites(favorites *model.Favorite) error {
	return d.db.Where("user_wallet_address = ? AND dataset_id = ?", favorites.UserWalletAddress, favorites.DatasetID).Delete(&model.Favorite{}).Error
}

// 查询用户收藏状态
func (d *UserDAO) FavoritesStatus(userID uint, datasetID uint) (uint, error) {
	// 查询用户地址
	var walletAddress string
	d.db.Model(&model.User{}).Where("id = ?", userID).Pluck("wallet_address", &walletAddress)
	// 查询用户收藏状态
	var count int64
	err := d.db.Model(&model.Favorite{}).Where("user_wallet_address = ? AND dataset_id = ?", walletAddress, datasetID).Count(&count).Error
	return uint(count), err
}

// 获取用户收藏列表
func (d *UserDAO) FavoritesList(id uint) (*[]model.DatasetListResponse, error) {
	// 查询用户钱包地址
	var walletAddress string
	d.db.Model(&model.User{}).Where("id = ?", id).Pluck("wallet_address", &walletAddress)
	// 查询用户收藏列表
	var result []model.DatasetListResponse
	err := d.db.Table("favorites AS f").
		Select(`f.id, d.title, d.description, d.category, d.tags, d.price, d.is_free, d.object_name, d.file_size, d.author_wallet_address, d.download_count, d.license, d.created_at, d.updated_at`).
		Joins("JOIN datasets AS d ON f.dataset_id = d.id").
		Where("f.user_wallet_address = ?", walletAddress).
		Scan(&result).Error
	return &result, err
}

// 获取用户统计数据
func (d *UserDAO) GetUserStats(userId uint) (model.UserStatsResponse, error) {
	// 查询用户钱包地址
	var walletAddress string
	d.db.Model(&model.User{}).Where("id = ?", userId).Pluck("wallet_address", &walletAddress)

	// 查询用户统计数据
	var result model.UserStatsResponse
	var userStats model.UserStats
	err := d.db.Where("wallet_address = ?", walletAddress).First(&userStats).Error

	// 获取已购买数据集分类列表
	var purchasedDatasets []string
	err = d.db.Table("datasets AS d").
		Select("d.category").
		Joins("JOIN transactions AS t ON d.id = t.dataset_id").
		Where("t.buyer_wallet_address = ? AND t.status = 'completed'", walletAddress).
		Pluck("d.category", &purchasedDatasets).Error

	// 获取已下载数据集分类列表
	var downloadedDatasets []string
	err = d.db.Table("datasets AS d").
		Select("d.category").
		Joins("JOIN download_records AS dl ON d.id = dl.dataset_id").
		Where("dl.user_wallet_address = ?", walletAddress).
		Pluck("d.category", &downloadedDatasets).Error

	result = model.UserStatsResponse{
		TotalUploads:       userStats.TotalUploads,
		TotalSpent:         userStats.TotalSpent,
		TotalDownloads:     userStats.TotalDownloads,
		TotalPurchases:     userStats.TotalPurchases,
		PurchasedDatasets:  purchasedDatasets,
		DownloadedDatasets: downloadedDatasets,
	}
	return result, err
}

// 获取用户交易记录
func (d *UserDAO) GetTransactions(userId uint) ([]model.TransactionListResponse, error) {
	// 查询用户钱包地址
	var walletAddress string
	d.db.Model(&model.User{}).Where("id = ?", userId).Pluck("wallet_address", &walletAddress)

	// 查询用户交易记录
	var result []model.TransactionListResponse
	err := d.db.Table("transactions AS t").
		Select("t.id, t.dataset_id, d.title, d.file_size, t.amount, t.status, t.tx_hash, t.block_number, t.created_at, t.updated_at").
		Joins("JOIN datasets AS d ON t.dataset_id = d.id").
		Where("t.buyer_wallet_address = ?", walletAddress).
		Order("t.created_at DESC").
		Scan(&result).Error
	return result, err
}

// 获取用户下载记录
func (d *UserDAO) GetDownloadRecords(userId uint) ([]model.DownloadRecordResponse, error) {
	// 查询用户钱包地址
	var walletAddress string
	d.db.Model(&model.User{}).Where("id = ?", userId).Pluck("wallet_address", &walletAddress)

	// 查询用户下载记录
	var result []model.DownloadRecordResponse
	err := d.db.Table("download_records AS dl").
		Select("dl.id, dl.dataset_id, d.title, d.file_size, d.price, dl.type, dl.download_count, dl.created_at").
		Joins("JOIN datasets AS d ON dl.dataset_id = d.id").
		Where("dl.user_wallet_address = ?", walletAddress).
		Order("dl.created_at DESC").
		Scan(&result).Error
	return result, err
}

// 获取作者统计数据
func (d *UserDAO) GetAuthorStats(address string) (model.AuthorStatsResponse, error) {
	var result model.AuthorStatsResponse
	err := d.db.Table("datasets as d").
		Select("COUNT(*) as total_datasets, SUM(d.download_count) as total_downloads").
		Where("d.author_wallet_address = ?", address).
		Scan(&result).Error

	var totalRevenue float64
	err = d.db.Model(&model.Transaction{}).Select("COALESCE(SUM(amount), 0)").
		Where("seller_wallet_address = ? AND status = 'completed'", address).
		Scan(&totalRevenue).Error
	result.TotalRevenue = totalRevenue
	return result, err
}
