"use client"

import { getHomeStatsApi, getHotRankApi, getLatestRankApi } from '@/lib/api/home'
import type { Dataset } from '@/types'

export async function getHomeStats(): Promise<{ total_datasets: number; total_users: number; total_transactions: number }> {
  try {
    return await getHomeStatsApi()
  } catch (err: any) {
    throw new Error(err.message || '获取平台统计失败')
  }
}

export async function getHotRank(limit = 10): Promise<Dataset[]> {
  try {
    const d = await getHotRankApi(limit)
    return Array.isArray(d) ? d : ((d as any)?.items ?? [])
  } catch (err: any) {
    throw new Error(err.message || '获取热门排行失败')
  }
}

export async function getLatestRank(limit = 10): Promise<Dataset[]> {
  try {
    const d = await getLatestRankApi(limit)
    return Array.isArray(d) ? d : ((d as any)?.items ?? [])
  } catch (err: any) {
    throw new Error(err.message || '获取最近上传失败')
  }
}
