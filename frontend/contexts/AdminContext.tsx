"use client"

import { 
  getAdminStatsApi, 
  getDashboardAnalyticsApi,
  getUsersApi,
  getUserDetailApi,
  updateUserApi,
  deleteUserApi,
  addUserApi,
  getDatasetsApi,
  deleteDatasetApi,
  restoreDatasetApi,
  detectFingerprintApi,
  getFingerprintHistoryApi,
  getMinIOBucketsApi,
  getMinIOObjectsApi,
  deleteMinIOObjectApi,
  processOutboxTasksApi,
} from '@/lib/api/admin'
import { getProfileByWalletAddress } from '@/lib/api/auth'
import { DashboardAnalytics as DashboardAnalyticsType, AdminStats as AdminStatsType, User, PaginatedResponse, UserStats, AdminDataset, Dataset, MinIOBucket, MinIOListResponse } from '@/types'

// 导出类型供其他组件使用
export type AdminStats = AdminStatsType
export type DashboardAnalytics = DashboardAnalyticsType

/**
 * 获取管理员统计数据（概览页面用）
 * @returns Promise<AdminStats>
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const stats = await getAdminStatsApi()
    return stats
  } catch (error: any) {
    console.error('获取管理员统计数据失败:', error)
    throw new Error(error.message || '获取管理员统计数据失败')
  }
}

/**
 * 获取仪表板分析数据（数据统计页面用）
 * @returns Promise<DashboardAnalytics>
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  try {
    const analytics = await getDashboardAnalyticsApi()
    return analytics
  } catch (error: any) {
    console.error('获取仪表板分析数据失败:', error)
    throw new Error(error.message || '获取仪表板分析数据失败')
  }
}

/**
 * 获取用户列表（用户管理页面用）
 */
export async function getUsers(params: {
  page?: number
  limit?: number
}): Promise<PaginatedResponse<User>> {
  try {
    return await getUsersApi(params)
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
    throw new Error(error.message || '获取用户列表失败')
  }
}

/**
 * 获取用户详情（包含统计数据）
 */
export async function getUserDetail(userId: number): Promise<{ user: User; stats: UserStats }> {
  try {
    return await getUserDetailApi(userId)
  } catch (error: any) {
    console.error('获取用户详情失败:', error)
    throw new Error(error.message || '获取用户详情失败')
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(userId: number, data: Partial<User>): Promise<void> {
  try {
    await updateUserApi(userId, data)
  } catch (error: any) {
    console.error('更新用户信息失败:', error)
    throw new Error(error.message || '更新用户信息失败')
  }
}

/**
 * 删除用户
 */
export async function deleteUser(userId: number): Promise<void> {
  try {
    await deleteUserApi(userId)
  } catch (error: any) {
    console.error('删除用户失败:', error)
    throw new Error(error.message || '删除用户失败')
  }
}

/**
 * 添加用户
 */
export async function addUser(data: { username: string; email: string; password: string }): Promise<void> {
  try {
    await addUserApi(data)
  } catch (error: any) {
    console.error('添加用户失败:', error)
    throw new Error(error.message || '添加用户失败')
  }
}

// ==================== 数据集管理相关 ====================

/**
 * 获取数据集列表（数据集管理页面用）
 */
export async function getDatasets(params: {
  page?: number
  limit?: number
}): Promise<PaginatedResponse<AdminDataset>> {
  try {
    return await getDatasetsApi(params)
  } catch (error: any) {
    console.error('获取数据集列表失败:', error)
    throw new Error(error.message || '获取数据集列表失败')
  }
}

/**
 * 删除数据集（后端软删除）
 */
export async function deleteDataset(datasetId: number): Promise<void> {
  try {
    await deleteDatasetApi(datasetId)
  } catch (error: any) {
    console.error('删除数据集失败:', error)
    throw new Error(error.message || '删除数据集失败')
  }
}

/**
 * 恢复数据集（撤销软删除）
 */
export async function restoreDataset(datasetId: number): Promise<void> {
  try {
    await restoreDatasetApi(datasetId)
  } catch (error: any) {
    console.error('恢复数据集失败:', error)
    throw new Error(error.message || '恢复数据集失败')
  }
}

/**
 * 根据钱包地址获取用户信息
 */
export async function getUserByWallet(walletAddress: string): Promise<User> {
  try {
    return await getProfileByWalletAddress(walletAddress)
  } catch (error: any) {
    console.error('根据钱包地址获取用户信息失败:', error)
    throw new Error(error.message || '获取用户信息失败')
  }
}

/**
 * 上传文件进行指纹检测
 */
export async function detectFingerprint(file: File): Promise<import('@/types').FingerprintDetectionResult> {
  try {
    return await detectFingerprintApi(file)
  } catch (error: any) {
    console.error('指纹检测失败:', error)
    throw new Error(error.message || '指纹检测失败')
  }
}

/**
 * 获取指纹检测历史记录
 */
export async function getFingerprintHistory(params: {
  page?: number
  limit?: number
}): Promise<import('@/types').PaginatedResponse<import('@/types').FingerprintHistoryItem>> {
  try {
    return await getFingerprintHistoryApi(params)
  } catch (error: any) {
    console.error('获取指纹检测历史失败:', error)
    throw new Error(error.message || '获取指纹检测历史失败')
  }
}

// ==================== MinIO存储管理相关 ====================

/**
 * 获取所有存储桶列表
 */
export async function getMinIOBuckets(): Promise<MinIOBucket[]> {
  try {
    return await getMinIOBucketsApi()
  } catch (error: any) {
    console.error('获取存储桶列表失败:', error)
    throw new Error(error.message || '获取存储桶列表失败')
  }
}

/**
 * 获取存储桶中的文件列表
 * 注意：后端只处理分页，返回所有文件，前端进行搜索和筛选
 */
export async function getMinIOObjects(params: {
  bucket: string
  page?: number
  limit?: number
}): Promise<MinIOListResponse> {
  try {
    return await getMinIOObjectsApi(params)
  } catch (error: any) {
    console.error('获取文件列表失败:', error)
    throw new Error(error.message || '获取文件列表失败')
  }
}

/**
 * 删除MinIO文件
 */
export async function deleteMinIOObject(bucket: string, objectName: string): Promise<void> {
  try {
    await deleteMinIOObjectApi(bucket, objectName)
  } catch (error: any) {
    console.error('删除文件失败:', error)
    throw new Error(error.message || '删除文件失败')
  }
}

export async function processOutboxTasks(): Promise<void> {
  try {
    await processOutboxTasksApi()
  } catch (error: any) {
    console.error('处理异步删除任务失败:', error)
    throw new Error(error.message || '处理异步删除任务失败')
  }
}

