# AI数据集交易平台 - API接口文档

## 接口状态说明
- ✅ 已实现
- 🔄 Mock状态
- ❌ 待实现

## 认证相关接口

### 用户注册
- **URL**: `POST /api/auth/register`
- **参数**: `{ username: string, email: string, password: string, verification_code: string }`
- **返回**: `{ user: User, token: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/register/page.tsx`
- **业务场景**: 用户注册，默认角色为普通用户

### 用户登录
- **URL**: `POST /api/auth/login`
- **参数**: `{ email: string, password: string }` 或 `{ username: string, password: string }`
- **返回**: `{ user: User, token: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/login/page.tsx`
- **业务场景**: 传统用户名密码登录

### 发送验证码
- **URL**: `POST /api/auth/send-code`
- **参数**: `{ email: string, type: 'register' | 'reset' }`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/register/page.tsx`, `app/forgot-password/page.tsx`
- **业务场景**: 注册和密码重置时发送邮箱验证码

### 重置密码
- **URL**: `POST /api/auth/reset-password`
- **参数**: `{ email: string, verification_code: string, new_password: string }`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/forgot-password/page.tsx`
- **业务场景**: 忘记密码重置

### 获取用户信息
- **URL**: `GET /api/auth/profile`
- **参数**: 无 (需要Authorization header)
- **返回**: `{ user: User }`
- **状态**: 🔄 Mock状态
- **调用位置**: `contexts/AuthContext.tsx`
- **业务场景**: 获取当前登录用户信息

### 更新用户信息
- **URL**: `PUT /api/auth/profile`
- **参数**: `{ username?: string, email?: string, avatar_url?: string }`
- **返回**: `{ user: User }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/profile/page.tsx`
- **业务场景**: 用户信息编辑

### 升级为商家
- **URL**: `POST /api/auth/upgrade-seller`
- **参数**: `{ business_name?: string, description?: string }`
- **返回**: `{ user: User, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/profile/page.tsx`
- **业务场景**: 普通用户升级为商家，升级后需要重新登录

## 角色权限相关接口

### 检查权限
- **URL**: `POST /api/roles/check-permission`
- **参数**: `{ action: string, resource: string }`
- **返回**: `{ allowed: boolean, reason?: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `hooks/useRole.ts`
- **业务场景**: 权限验证

### 获取用户角色信息
- **URL**: `GET /api/roles/info`
- **参数**: 无 (需要Authorization header)
- **返回**: `{ role: RoleConfig, permissions: Permission[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `hooks/useRole.ts`
- **业务场景**: 获取用户角色和权限信息

## 钱包相关接口

### 绑定钱包
- **URL**: `POST /api/wallet/bind`
- **参数**: `{ address: string, wallet_type: string, signature: string }`
- **返回**: `{ wallet: WalletInfo, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/wallet/WalletConnect.tsx`
- **业务场景**: 用户绑定钱包地址

### 解绑钱包
- **URL**: `DELETE /api/wallet/unbind`
- **参数**: 无 (需要Authorization header)
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/profile/page.tsx`
- **业务场景**: 用户解绑钱包

### 获取钱包信息
- **URL**: `GET /api/wallet/info`
- **参数**: 无 (需要Authorization header)
- **返回**: `{ wallet: WalletInfo | null }`
- **状态**: 🔄 Mock状态
- **调用位置**: `contexts/WalletContext.tsx`
- **业务场景**: 获取用户绑定的钱包信息

### 获取钱包余额
- **URL**: `GET /api/wallet/balance`
- **参数**: 无 (需要Authorization header)
- **返回**: `{ balance: string, symbol: string, usdValue: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/wallet/page.tsx`
- **业务场景**: 获取钱包余额信息

### 获取钱包交易历史
- **URL**: `GET /api/wallet/transactions`
- **参数**: `{ page?: number, limit?: number }`
- **返回**: `{ transactions: WalletTransaction[], total: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/wallet/page.tsx`
- **业务场景**: 查看钱包交易记录

### 验证钱包签名
- **URL**: `POST /api/wallet/verify-signature`
- **参数**: `{ address: string, message: string, signature: string }`
- **返回**: `{ valid: boolean }`
- **状态**: 🔄 Mock状态
- **调用位置**: `hooks/useBlockchain.ts`
- **业务场景**: 验证钱包签名有效性

### 请求更换钱包地址
- **URL**: `POST /api/wallet/request-change`
- **参数**: `{ newAddress: string, reason: string }`
- **返回**: `{ requestId: string, status: string, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/wallet/WalletChangeRequest.tsx`
- **业务场景**: 用户提交更换钱包地址申请，需要管理员审核

### 获取钱包更换请求状态
- **URL**: `GET /api/wallet/change-request-status`
- **参数**: 无 (需要Authorization header)
- **返回**: `{ hasRequest: boolean, request?: WalletChangeRequest }`
- **状态**: 🔄 Mock状态
- **调用位置**: `contexts/WalletContext.tsx`
- **业务场景**: 检查用户是否有待处理的钱包更换请求

### 获取所有钱包更换请求 (管理员)
- **URL**: `GET /api/admin/wallet-change-requests`
- **参数**: `{ page?: number, limit?: number, status?: string }`
- **返回**: `{ requests: WalletChangeRequest[], total: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/wallets/page.tsx`
- **业务场景**: 管理员查看所有用户的钱包更换申请

### 审批钱包更换请求 (管理员)
- **URL**: `POST /api/admin/wallet-change-requests/:id/approve`
- **参数**: 路径参数 `id`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/wallets/page.tsx`
- **业务场景**: 管理员批准用户的钱包更换申请

### 拒绝钱包更换请求 (管理员)
- **URL**: `POST /api/admin/wallet-change-requests/:id/reject`
- **参数**: 路径参数 `id`, `{ reason: string }`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/wallets/page.tsx`
- **业务场景**: 管理员拒绝用户的钱包更换申请

### 验证钱包地址一致性
- **URL**: `POST /api/wallet/validate-consistency`
- **参数**: `{ currentAddress: string }`
- **返回**: `{ isConsistent: boolean, boundAddress: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/wallet/WalletValidation.tsx`
- **业务场景**: 在区块链操作前验证当前连接的钱包地址与绑定地址是否一致

## 数据集相关接口

### 获取数据集列表
- **URL**: `GET /api/datasets`
- **参数**: `{ page?: number, limit?: number, category?: string, is_free?: boolean, search?: string }`
- **返回**: `{ datasets: Dataset[], total: number, page: number, limit: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/free-datasets/page.tsx`, `app/paid-datasets/page.tsx`
- **业务场景**: 数据集列表展示和搜索

### 高级搜索数据集
- **URL**: `GET /api/datasets/search`
- **参数**: `{ query: string, searchIn?: string[], exactMatch?: boolean, excludeWords?: string, fileFormat?: string, dateRange?: string, categories?: string[], priceRange?: [number, number], fileSizeRange?: [number, number], ratings?: number[], downloadRange?: [number, number], authors?: string[], sortBy?: string, page?: number, limit?: number }`
- **返回**: `{ datasets: Dataset[], total: number, page: number, limit: number, facets: SearchFacets }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/search/AdvancedSearchBar.tsx`, `components/search/AdvancedFilterSidebar.tsx`
- **业务场景**: 高级搜索和筛选数据集

### 获取数据集详情
- **URL**: `GET /api/datasets/:id`
- **参数**: 路径参数 `id`
- **返回**: `{ dataset: Dataset }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/datasets/[id]/page.tsx`
- **业务场景**: 数据集详情页展示

### 上传数据集
- **URL**: `POST /api/datasets`
- **参数**: `FormData` (包含文件和元数据)
- **返回**: `{ dataset: Dataset, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/upload/page.tsx`
- **业务场景**: 商家上传数据集

### 更新数据集
- **URL**: `PUT /api/datasets/:id`
- **参数**: `{ title?: string, description?: string, price?: number, category?: string }`
- **返回**: `{ dataset: Dataset }`
- **状态**: ❌ 待实现
- **调用位置**: `app/upload/page.tsx`
- **业务场景**: 商家编辑自己的数据集

### 删除数据集
- **URL**: `DELETE /api/datasets/:id`
- **参数**: 路径参数 `id`
- **返回**: `{ success: boolean, message: string }`
- **状态**: ❌ 待实现
- **调用位置**: 管理界面
- **业务场景**: 商家删除自己的数据集，管理员删除违规数据集

### 购买数据集
- **URL**: `POST /api/datasets/:id/purchase`
- **参数**: 路径参数 `id`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/datasets/[id]/page.tsx`
- **业务场景**: 用户购买付费数据集

### 检查购买状态
- **URL**: `GET /api/datasets/:id/purchase-status`
- **参数**: 路径参数 `id`
- **返回**: `{ hasPurchased: boolean }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/datasets/[id]/page.tsx`
- **业务场景**: 检查用户是否已购买某个数据集

### 下载数据集
- **URL**: `GET /api/datasets/:id/download`
- **参数**: 路径参数 `id`
- **返回**: 文件流或下载链接
- **状态**: ❌ 待实现
- **调用位置**: `app/datasets/[id]/page.tsx`
- **业务场景**: 下载免费数据集或已购买的付费数据集

### 获取我的数据集
- **URL**: `GET /api/datasets/my`
- **参数**: `{ page?: number, limit?: number, status?: string }`
- **返回**: `{ datasets: Dataset[], total: number, stats: DatasetStats }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/my-datasets/page.tsx`
- **业务场景**: 商家查看自己上传的数据集

### 获取数据集统计
- **URL**: `GET /api/datasets/:id/stats`
- **参数**: 路径参数 `id`
- **返回**: `{ downloads: number, revenue: number, views: number, ratings: RatingStats }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/my-datasets/page.tsx`
- **业务场景**: 获取数据集详细统计信息

### 获取相关数据集推荐
- **URL**: `GET /api/datasets/:id/related`
- **参数**: 路径参数 `id`, `{ limit?: number }`
- **返回**: `{ datasets: Dataset[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/datasets/[id]/page.tsx`
- **业务场景**: 数据集详情页显示相关推荐

### 获取商家其他数据集
- **URL**: `GET /api/datasets/seller/:sellerId`
- **参数**: 路径参数 `sellerId`, `{ exclude?: number, limit?: number }`
- **返回**: `{ datasets: Dataset[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/datasets/[id]/page.tsx`
- **业务场景**: 商家引流区域显示其他数据集

## 交易相关接口

### 创建购买订单
- **URL**: `POST /api/transactions/create`
- **参数**: `{ datasetId: number, paymentMethod: string }`
- **返回**: `{ transaction: Transaction, paymentInfo: PaymentInfo }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/transaction/PurchaseModal.tsx`
- **业务场景**: 创建数据集购买订单

### 确认支付
- **URL**: `POST /api/transactions/:id/confirm`
- **参数**: 路径参数 `id`, `{ txHash?: string, signature?: string }`
- **返回**: `{ transaction: Transaction, success: boolean }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/transaction/PurchaseModal.tsx`
- **业务场景**: 确认区块链支付完成

### 获取交易记录
- **URL**: `GET /api/transactions`
- **参数**: `{ page?: number, limit?: number, type?: string, status?: string }`
- **返回**: `{ transactions: Transaction[], total: number, stats: TransactionStats }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/transactions/page.tsx`
- **业务场景**: 用户查看交易历史

### 获取交易详情
- **URL**: `GET /api/transactions/:id`
- **参数**: 路径参数 `id`
- **返回**: `{ transaction: Transaction }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/transactions/page.tsx`
- **业务场景**: 查看交易详细信息

## 收藏相关接口

### 添加收藏
- **URL**: `POST /api/favorites`
- **参数**: `{ datasetId: number }`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/datasets/DatasetCard.tsx`
- **业务场景**: 用户收藏数据集

### 取消收藏
- **URL**: `DELETE /api/favorites/:datasetId`
- **参数**: 路径参数 `datasetId`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `components/datasets/DatasetCard.tsx`
- **业务场景**: 用户取消收藏数据集

### 获取收藏列表
- **URL**: `GET /api/favorites`
- **参数**: `{ page?: number, limit?: number, category?: string }`
- **返回**: `{ favorites: FavoriteDataset[], total: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/favorites/page.tsx`
- **业务场景**: 查看用户收藏的数据集


### 检查收藏状态
- **URL**: `GET /api/favorites/check/:datasetId`
- **参数**: 路径参数 `datasetId`
- **返回**: `{ isFavorited: boolean }`
- **状态**: 🔄 Mock状态
- **调用位置**: `hooks/useFavorites.ts`
- **业务场景**: 检查数据集是否已收藏

## 仪表板相关接口

### 获取用户仪表板数据
- **URL**: `GET /api/dashboard/stats`
- **参数**: 无 (需要Authorization header)
- **返回**: `{ stats: DashboardStats, recentActivity: Activity[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/dashboard/page.tsx`
- **业务场景**: 用户仪表板数据展示

### 获取销售统计
- **URL**: `GET /api/dashboard/sales`
- **参数**: `{ period?: string, startDate?: string, endDate?: string }`
- **返回**: `{ revenue: RevenueData[], downloads: DownloadData[], topDatasets: Dataset[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/dashboard/page.tsx`
- **业务场景**: 商家销售数据分析

### 获取平台管理数据
- **URL**: `GET /api/dashboard/admin`
- **参数**: 无 (需要管理员权限)
- **返回**: `{ platformStats: PlatformStats, userGrowth: GrowthData[], contentStats: ContentStats }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/dashboard/page.tsx`
- **业务场景**: 管理员平台数据概览


## 管理员相关接口 (第三阶段新增)

### 获取管理员仪表板统计
- **URL**: `GET /api/admin/dashboard`
- **参数**: 无 (需要管理员权限)
- **返回**: `{ platformStats: AdminPlatformStats, systemHealth: SystemHealth, recentActivity: AdminActivity[], pendingTasks: PendingTask[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/dashboard/page.tsx`
- **业务场景**: 管理员仪表板数据展示，包含平台统计、系统健康状态、最近活动和待处理任务

### 获取用户列表 (管理员)
- **URL**: `GET /api/admin/users`
- **参数**: `{ page?: number, limit?: number, search?: string, role?: string }`
- **返回**: `{ users: User[], total: number, page: number, limit: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/users/page.tsx`
- **业务场景**: 管理员查看和搜索平台所有用户

### 获取用户详情 (管理员)
- **URL**: `GET /api/admin/users/:id`
- **参数**: 路径参数 `id`
- **返回**: `{ user: User, purchaseHistory: PurchaseHistory[], activityLog: ActivityLog[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/users/page.tsx`
- **业务场景**: 管理员查看用户详细信息、购买历史和活动记录

### 获取所有数据集 (管理员)
- **URL**: `GET /api/admin/datasets`
- **参数**: `{ page?: number, limit?: number, search?: string, category?: string, status?: string }`
- **返回**: `{ datasets: Dataset[], total: number, page: number, limit: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/datasets/page.tsx`
- **业务场景**: 管理员查看和管理平台所有数据集

### 删除数据集 (管理员)
- **URL**: `DELETE /api/admin/datasets/:id`
- **参数**: 路径参数 `id`
- **返回**: `{ success: boolean, message: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/datasets/page.tsx`
- **业务场景**: 管理员删除违规或问题数据集

### 指纹检测
- **URL**: `POST /api/admin/fingerprint/detect`
- **参数**: `FormData` (包含待检测文件)
- **返回**: `{ detectionId: string, fileHash: string, matches: FingerprintMatch[], analysisTime: string }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/fingerprint/page.tsx`
- **业务场景**: 管理员上传文件进行指纹检测，识别潜在盗版内容

### 获取指纹检测历史
- **URL**: `GET /api/admin/fingerprint/history`
- **参数**: `{ page?: number, limit?: number }`
- **返回**: `{ detections: DetectionHistory[], total: number, page: number, limit: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/fingerprint/page.tsx`
- **业务场景**: 管理员查看所有指纹检测历史记录

### 获取指纹检测详情
- **URL**: `GET /api/admin/fingerprint/:detectionId`
- **参数**: 路径参数 `detectionId`
- **返回**: `{ detection: DetectionResult, matches: DetailedMatch[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/fingerprint/page.tsx`
- **业务场景**: 管理员查看特定检测的详细结果

### 用户管理操作
- **URL**: `POST /api/admin/users/:id/action`
- **参数**: 路径参数 `id`, `{ action: 'suspend' | 'activate' | 'delete', reason?: string }`
- **返回**: `{ success: boolean, message: string }`
- **状态**: ❌ 待实现
- **调用位置**: `app/admin/users/page.tsx`
- **业务场景**: 管理员对用户进行管理操作（暂停、激活、删除）

### 系统配置管理
- **URL**: `GET /api/admin/settings`
- **参数**: 无 (需要管理员权限)
- **返回**: `{ settings: SystemSettings }`
- **状态**: ❌ 待实现
- **调用位置**: `app/admin/settings/page.tsx`
- **业务场景**: 管理员查看和修改系统配置

### 更新系统配置
- **URL**: `PUT /api/admin/settings`
- **参数**: `{ settings: Partial<SystemSettings> }`
- **返回**: `{ settings: SystemSettings, message: string }`
- **状态**: ❌ 待实现
- **调用位置**: `app/admin/settings/page.tsx`
- **业务场景**: 管理员更新系统配置参数

### 管理员下载数据集 (原始文件)
- **URL**: `GET /api/admin/datasets/:id/download`
- **参数**: 路径参数 `id`
- **返回**: 原始文件流 (无指纹处理)
- **状态**: ❌ 待实现
- **调用位置**: `app/admin/datasets/page.tsx`
- **业务场景**: 管理员下载原始数据集文件，不经过指纹植入处理，用于管理和审核目的

### 钱包管理 (管理员)
- **URL**: `GET /api/admin/wallets`
- **参数**: `{ page?: number, limit?: number, search?: string }`
- **返回**: `{ wallets: WalletInfo[], changeRequests: WalletChangeRequest[], total: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/admin/wallets/page.tsx`
- **业务场景**: 管理员查看所有用户钱包绑定情况和更换申请


## 平台统计接口

### 获取平台统计数据
- **URL**: `GET /api/stats/platform`
- **参数**: 无
- **返回**: `{ total_datasets: number, total_users: number, total_transactions: number }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/page.tsx`
- **业务场景**: 首页统计数据展示

### 获取分类统计
- **URL**: `GET /api/stats/categories`
- **参数**: 无
- **返回**: `{ categories: CategoryStats[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/dashboard/page.tsx`
- **业务场景**: 数据集分类分布统计

### 获取用户增长数据
- **URL**: `GET /api/stats/user-growth`
- **参数**: `{ period?: string }`
- **返回**: `{ growth: GrowthData[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/dashboard/page.tsx`
- **业务场景**: 用户增长趋势分析

### 获取收入趋势
- **URL**: `GET /api/stats/revenue-trend`
- **参数**: `{ period?: string, sellerId?: number }`
- **返回**: `{ revenue: RevenueData[] }`
- **状态**: 🔄 Mock状态
- **调用位置**: `app/dashboard/page.tsx`
- **业务场景**: 收入趋势分析

