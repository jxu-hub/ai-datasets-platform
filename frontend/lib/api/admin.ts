import axios from 'axios'
import { DashboardAnalytics, AdminStats, User, PaginatedResponse, UserStats, AdminDataset, Dataset } from '@/types'
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE


// 获取管理员统计数据
export async function getAdminStatsApi(): Promise<AdminStats> {
  const res = await axios.get(`${BASE_URL}/admin/stats`, {
    withCredentials: true,
  })
  if (res.data.code === 200 && res.data.data) {
    const data = res.data.data
    return {
      totalUsers: data.total_users || data.totalUsers || 0,
      totalDatasets: data.total_datasets || data.totalDatasets || 0,
      totalTransactions: data.total_transactions || data.totalTransactions || 0,
    }
  }
  
  throw new Error(res.data.msg || '获取管理员统计数据失败')
}

// 获取仪表板分析数据
export async function getDashboardAnalyticsApi(): Promise<DashboardAnalytics> {
  const res = await axios.get(`${BASE_URL}/admin/dashboard-analytics`, {
    withCredentials: true,
  })
  
  if (res.data.code === 200 && res.data.data) {
    const data = res.data.data.data
    return {
      monthlyGrowth: {
        users: data.monthly_growth?.users || data.monthlyGrowth?.users || 0,
        datasets: data.monthly_growth?.datasets || data.monthlyGrowth?.datasets || 0,
        transactions: data.monthly_growth?.transactions || data.monthlyGrowth?.transactions || 0,
      },
      userGrowth: data.user_growth || data.userGrowth || [],
      transactionVolume: data.transaction_volume || data.transactionVolume || [],
      categoryDistribution: data.category_distribution || data.categoryDistribution || [],
    }
  }
  
  throw new Error(res.data.msg || '获取仪表板分析数据失败')
}

// 获取用户列表
export async function getUsersApi(params: {
  page?: number
  limit?: number
}): Promise<PaginatedResponse<User>> {
  const res = await axios.get(`${BASE_URL}/admin/users`, {
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
    },
    withCredentials: true,
  })
  if (res.data.code === 200 && res.data.data) {
    return res.data.data
  }
  throw new Error(res.data.msg || '获取用户列表失败')
}

// 获取用户详情（包含统计数据）
export async function getUserDetailApi(userId: number): Promise<{ user: User; stats: UserStats }> {
  const res = await axios.get(`${BASE_URL}/admin/users/${userId}`, {
    withCredentials: true,
  })
  if (res.data.code === 200 && res.data.data) {
    const rawStats = res.data.data.stats || {}
    
    // 将后端的下划线命名转换为前端的小驼峰命名
    const stats: UserStats = {
      total_spent: rawStats.totalSpent ?? rawStats.total_spent ?? 0,
      total_uploads: rawStats.totalUploads ?? rawStats.total_uploads ?? 0,
      total_purchases: rawStats.totalPurchases ?? rawStats.total_purchases ?? 0,
      total_downloads: rawStats.totalDownloads ?? rawStats.total_downloads ?? 0,
      purchased_datasets: rawStats.purchasedDatasets ?? rawStats.purchased_datasets ?? [],
      downloaded_datasets: rawStats.downloadedDatasets ?? rawStats.downloaded_datasets ?? [],
    }
    
    return {
      user: res.data.data.user,
      stats
    }
  }

  throw new Error(res.data.msg || '获取用户详情失败')
}

// 更新用户信息
export async function updateUserApi(userId: number, data: Partial<User>): Promise<void> {
  const res = await axios.put(`${BASE_URL}/admin/users/${userId}`, data, {
    withCredentials: true,
  })

  if (res.data.code !== 200) {
    throw new Error(res.data.msg || '更新用户信息失败')
  }
}

// 删除用户
export async function deleteUserApi(userId: number): Promise<void> {
  const res = await axios.delete(`${BASE_URL}/admin/users/${userId}`, {
    withCredentials: true,
  })

  if (res.data.code !== 204) {
    throw new Error(res.data.msg || '删除用户失败')
  }
}

// 添加用户
export async function addUserApi(data: { username: string; email: string; password: string }): Promise<void> {
  const res = await axios.post(`${BASE_URL}/admin/users`, data, {
    withCredentials: true,
  })

  if (res.data.code !== 200) {
    throw new Error(res.data.msg || '添加用户失败')
  }
}

// ==================== 数据集管理相关 API ====================

// 获取数据集列表（前端筛选模式，只需要 page 和 limit）
export async function getDatasetsApi(params: {
  page?: number
  limit?: number
}): Promise<PaginatedResponse<AdminDataset>> {
  const res = await axios.get(`${BASE_URL}/admin/datasets`, {
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
    },
    withCredentials: true,
  })
  
  if (res.data.code === 200 && res.data.data) {
    return res.data.data
  }

  throw new Error(res.data.msg || '获取数据集列表失败')
}

// 删除数据集（后端软删除）
export async function deleteDatasetApi(datasetId: number): Promise<void> {
  const res = await axios.delete(`${BASE_URL}/admin/datasets/${datasetId}`, {
    withCredentials: true,
  })

  if (res.data.code !== 204) {
    throw new Error(res.data.msg || '删除数据集失败')
  }
}

// 恢复数据集（撤销软删除）
export async function restoreDatasetApi(datasetId: number): Promise<void> {
  const res = await axios.put(`${BASE_URL}/admin/datasets/restore/${datasetId}`, {}, {
    withCredentials: true,
  })

  if (res.data.code !== 200) {
    throw new Error(res.data.msg || '恢复数据集失败')
  }
}

// ==================== 指纹检测相关 API ====================

// 上传文件进行指纹检测
export async function detectFingerprintApi(file: File): Promise<import('@/types').FingerprintDetectionResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await axios.post(`${BASE_URL}/admin/fingerprint/detect`, formData, {
    withCredentials: true,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  if (res.data.code === 200 && res.data.data) {
    return res.data.data.result
  }

  throw new Error(res.data.msg || '指纹检测失败')
}

// 获取指纹检测历史记录
export async function getFingerprintHistoryApi(params: {
  page?: number
  limit?: number
}): Promise<import('@/types').PaginatedResponse<import('@/types').FingerprintHistoryItem>> {
  const res = await axios.get(`${BASE_URL}/admin/fingerprint/records`, {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
    withCredentials: true,
  })
  console.info("res.data.data = ", res.data.data)
  if (res.data.code === 200 && res.data.data) {
    return res.data.data
  }

  throw new Error(res.data.msg || '获取指纹检测历史失败')
}

// ==================== MinIO存储管理相关 API ====================

// 获取所有存储桶列表
export async function getMinIOBucketsApi(): Promise<import('@/types').MinIOBucket[]> {
  const res = await axios.get(`${BASE_URL}/admin/minio/buckets`, {
    withCredentials: true,
  })
  
  if (res.data.code === 200 && res.data.data) {
    const d = res.data.data
    return d.buckets || d
  }

  throw new Error(res.data.msg || '获取存储桶列表失败')
}

// 获取存储桶中的文件列表
// 注意：后端只处理分页，返回所有文件（通过设置大的limit），前端进行搜索和筛选
export async function getMinIOObjectsApi(params: {
  bucket: string
  page?: number
  limit?: number
}): Promise<import('@/types').MinIOListResponse> {
  const res = await axios.get(`${BASE_URL}/admin/minio/objects`, {
    params: {
      bucket: params.bucket,
      page: params.page || 1,
      limit: params.limit || 10000, // 设置大的limit来获取所有文件，前端进行筛选和分页
    },
    withCredentials: true,
  })
  
  if (res.data.code === 200 && res.data.data) {
    const d = res.data.data
    return d.objects ? d : { objects: d }
  }

  throw new Error(res.data.msg || '获取文件列表失败')
}

// 删除MinIO文件
export async function deleteMinIOObjectApi(bucket: string, objectName: string): Promise<void> {
  const res = await axios.delete(`${BASE_URL}/admin/minio/object`, {
    params: {
      bucket,
      objectName,
    },
    withCredentials: true,
  })

  if (res.data.code !== 200 && res.data.code !== 204) {
    throw new Error(res.data.msg || '删除文件失败')
  }
}

export async function processOutboxTasksApi(): Promise<void> {
  const res = await axios.post(`${BASE_URL}/admin/outbox/process`, {}, {
    withCredentials: true,
  })
  if (res.data.code !== 200) {
    throw new Error(res.data.msg || '处理异步删除任务失败')
  }
}

