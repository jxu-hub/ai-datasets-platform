// AI数据集交易平台 - 核心数据类型定义

/**
 * 用户基本信息类型
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: "user" | "seller" | "admin";
  avatarUrl?: string;
  walletAddress: string | null;
  created_at?: string;
}

/**
 * 用户统计数据类型（个人中心数据统计页面使用）
 */
export interface UserStats {
  total_spent?: number;
  total_uploads?: number;
  total_purchases?: number;
  total_downloads?: number;
  purchased_datasets?: string[];  // 只存储分类名称列表
  downloaded_datasets?: string[]; // 只存储分类名称列表
}

/**
 * 用户基本信息更新类型
 */
export interface UserUpdate {
  username: string;
  email: string;
  avatarUrl?: string | File;
}

/**
 * 更换钱包请求类型
 */
export interface WalletChangeRequest {
  newWalletAddress: string
  reason: string
  role: string
}

/**
 * 钱包信息类型
 */
export interface WalletInfo {
  id: number
  address: string
  bound_at: string
}

/**
 * 认证状态类型
 */
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hasWallet: boolean
  userStats: UserStats | null
}

/**
 * 权限类型
 */
export interface Permission {
  action: string // 'read', 'write', 'delete', 'upload'等
  resource: string // 'dataset', 'user', 'wallet'等
  conditions?: Record<string, any> // 权限条件
}

/**
 * 角色配置类型
 */
export interface RoleConfig {
  name: "user" | "seller" | "admin"
  displayName: string
  permissions: Permission[]
  allowedRoutes: string[]
}

/**
 * 数据集类型（与后端gorm结构体同步）
 * 注意：使用钱包地址而不是用户ID来标识作者，确保与区块链数据一致
 */
export interface Dataset {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  isFree: boolean;
  fileSize: number;
  authorWalletAddress: string;  
  downloadCount: number;
  license: string;
  createdAt: string;
  updatedAt: string;
  objectName: string;
}

/**
 * 数据集类型（与后端gorm结构体同步） -- 管理员获取
 * 注意：使用钱包地址而不是用户ID来标识作者，确保与区块链数据一致
 */
export interface AdminDataset {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  isFree: boolean;
  fileSize: number;
  authorWalletAddress: string;  
  downloadCount: number;
  license: string;
  createdAt: string;
  updatedAt: string;
  objectName: string;
  name: string
}

/**
 * 数据集统计信息类型
 */
export interface DatasetStats {
  totalDatasets: number;
  totalDownloads: number;
  totalRevenue: number;
}

/**
 * API响应基础类型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 分页响应类型
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 登录表单类型
 */
export interface LoginForm {
  emailOrUsername: string
  password: string
  remember?: boolean
}

/**
 * 注册表单类型
 */
export interface RegisterForm {
  username: string
  email: string
  password: string
  verificationCode: string
}

/** 
 * 重置密码表单类型
 */
export interface ResetPasswordForm {
  email: string
  verificationCode: string
  newPassword: string
}

/**
 * 数据集上传表单类型（与后端同步）
 * 注意：使用钱包地址而不是用户ID
 */
export interface DatasetUploadForm {
  title: string;
  description: string;
  category: string;
  tags: string; 
  price: number;
  isFree: boolean;
  objectName: string;
  fileSize: number;
  authorWalletAddress: string;  // ✅ 使用钱包地址替代 authorId
  license: string;
}

/**
 * 交易记录类型（与后端同步）
 * 注意：使用钱包地址记录买卖双方
 */
export interface Transaction {
  id: number;
  buyerWalletAddress: string;   // 买家钱包地址
  sellerWalletAddress: string;  // 卖家钱包地址
  datasetId: number;
  datasetTitle?: string;         // 冗余字段，前端显示用
  datasetSize?: number;          // 冗余字段，前端显示用
  type: string;
  amount: number;
  status: string;
  txHash: string;
  blockNumber: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 下载记录类型（与后端同步）
 * 注意：使用钱包地址标识用户
 */
export interface DownloadRecord {
  id: number;
  userWalletAddress: string;  // 用户钱包地址
  datasetID: number;
  datasetTitle?: string;      // 冗余字段，前端显示用
  datasetSize?: number;       // 冗余字段，前端显示用
  price?: number;             // 冗余字段，前端显示用
  type: number;               // 0=付费，1=免费
  downloadCount: number;
  createdAt: string;
}

/**
 * 收藏记录类型（与后端同步）
 * 注意：使用钱包地址标识用户
 */
export interface Favorite {
  id: number;
  userWalletAddress: string;  // 用户钱包地址
  datasetID: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 平台统计数据类型
 */
export interface PlatformStats {
  total_datasets: number
  total_users: number
  total_transactions: number
  total_revenue: number
}

/**
 * 钱包连接状态类型
 */
export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  isLoading: boolean
  error: string | null
}

/**
 * 路由权限配置类型
 */
export interface RouteConfig {
  path: string
  requiredRole?: "user" | "seller" | "admin"
  requireAuth?: boolean
  requireWallet?: boolean
}

export type DatasetUploadContextParams = {
  userId: number;
  ownerAddress: string;
  file: File;
  setUploadProgress?: (progress: number) => void;
};

export type UploadForm = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  is_free: boolean;
  price: number;
  file: File | null;
  license: string;
  file_url?: string;
  file_size?: number;
  file_format?: string;
  object_name?: string;
};


// 管理员统计数据接口
export interface AdminStats {
  totalUsers: number
  totalDatasets: number
  totalTransactions: number
}

// 月度增长率
export interface MonthlyGrowth {
  users: number
  datasets: number
  transactions: number
}

// 用户增长趋势数据（专用于用户增长图表）
export interface UserGrowthData {
  name: string
  users: number
}

// 交易量数据（交易金额统计）
export interface TransactionVolumeData {
  name: string
  revenue: number 
}

// 分类分布数据
export interface CategoryDistributionData {
  name: string
  value: number
}

// 仪表板分析数据
export interface DashboardAnalytics {
  monthlyGrowth: MonthlyGrowth
  userGrowth: UserGrowthData[]
  transactionVolume: TransactionVolumeData[]
  categoryDistribution: CategoryDistributionData[]
}

// 指纹检测结果
export interface FingerprintDetectionResult {
  matchResult: string
  detectionTime: string
}

// 指纹检测历史记录项
export interface FingerprintHistoryItem {
  filename: string
  fileSize: number
  timestamp: string
  detectionTime: string
  detectionResult: string
  datasetID?: number
  createdAt: string
}

export interface MinIOBucket {
  name: string
  creationDate: string
}

export interface MinIOObject {
  name: string
  size: number
  etag: string
  lastModified: string
  contentType: string
}

export interface MinIOListResponse {
  objects: MinIOObject[]
}