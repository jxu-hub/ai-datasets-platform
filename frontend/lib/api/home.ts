import axios from 'axios'
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE

export async function getHomeStatsApi(): Promise<{ total_datasets: number; total_users: number; total_transactions: number }> {
  const res = await axios.get(`${BASE_URL}/home/stats`, { withCredentials: true })
  if (res.data.code === 200 && res.data.data) {
    const d = res.data.data
    return {
      total_datasets: d.total_datasets ?? d.totalDatasets ?? 0,
      total_users: d.total_users ?? d.totalUsers ?? 0,
      total_transactions: d.total_transactions ?? d.totalTransactions ?? 0,
    }
  }
  throw new Error(res.data.msg || '获取平台统计失败')
}

export async function getHotRankApi(limit = 10): Promise<import('@/types').Dataset[]> {
  const res = await axios.get(`${BASE_URL}/home/rank/hot`, { params: { limit }, withCredentials: true })
  if (res.data.code === 200 && res.data.data) {
    const items = res.data.data.items || res.data.data
    return items
  }
  throw new Error(res.data.msg || '获取热门排行失败')
}

export async function getLatestRankApi(limit = 10): Promise<import('@/types').Dataset[]> {
  const res = await axios.get(`${BASE_URL}/home/rank/latest`, { params: { limit }, withCredentials: true })
  if (res.data.code === 200 && res.data.data) {
    const items = res.data.data.items || res.data.data
    return items
  }
  throw new Error(res.data.msg || '获取最近上传失败')
}

