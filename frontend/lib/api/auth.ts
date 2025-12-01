import type { LoginForm, RegisterForm, User, ResetPasswordForm, UserUpdate } from '@/types'
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE

// 登录
export async function loginApi(data: LoginForm) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, data, { withCredentials: true })
    if (res.data.code === 200) {
      return res.data.data
    } else {
      throw new Error(res.data.msg || '登录失败')
    }
  } catch(error) {
    throw new Error('登录失败')
  }
}

// 注册
export async function registerApi(data: RegisterForm) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, data, { withCredentials: true })
    return res.data
  } catch (err: any) {
    throw new Error(err.response?.data?.error || '注册失败')
  }
}

// 重设密码
export async function resetPasswordApi(data: ResetPasswordForm) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/reset-password`, data)
    return res.data
  } catch (err: any) {
    throw new Error(err.response?.data?.error || '忘记密码失败')
  }
}

// 获取当前用户信息
export async function getProfile() {
    const res = await axios.get(`${BASE_URL}/auth/profile`, { withCredentials: true })
    console.log("lib/api/auth: getProfile: res = ", res)
    if (res.data.code === 200 && res.data.data) {
      return res.data.data as User
    } else {
      throw new Error(res.data.msg || '未登录')
    }

}

// 获取指定用户信息
export async function getProfileByWalletAddress(authorWalletAddress: string) {
  const res = await axios.get(`${BASE_URL}/auth/author-profile`, { params: { authorWalletAddress: authorWalletAddress } })
  if (res.data.code === 200 && res.data.data) {
    return res.data.data.data as User
  } else {
    throw new Error(res.data.msg || '获取用户信息失败')
  }
}

// 发送验证码
export async function sendVerificationCodeApi(email: string) {
  const res = await axios.post(`${BASE_URL}/auth/send-code`, { email }, { withCredentials: true })
  console.log("lib/api/auth: sendVerificationCodeApi: res = ", res)
  try {
    if (res.data.code === 200) {
      return { success: true, msg: res.data.data.message }
    } else {
      return { success: false, msg: res.data.msg }
    }
  } catch (err : any) {
    return { success: false, msg: res.data.msg }
  }
}

// 登出
export async function logoutApi() {
  try {
    await axios.post(`${BASE_URL}/auth/logout`, { }, { withCredentials: true })
  } catch(err: any) {
    throw new Error(err.response?.data?.error || '登出失败')
  }
}

// 更新用户基本信息
export async function updateUserApi(data: UserUpdate) {
  const formData = new FormData();
  formData.append("username", data.username);
  formData.append("email", data.email);
  if (data.avatarUrl && typeof data.avatarUrl !== "string") {
    formData.append("avatar", data.avatarUrl);
  }
  if (typeof data.avatarUrl === "string" && data.avatarUrl) {
    formData.append("avatarUrl", data.avatarUrl);
  }
  const res = await axios.put(`${BASE_URL}/auth/profile`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (res.data.code === 200) {
    return res.data.data;
  } else {
    throw new Error(res.data.msg || "更新用户信息失败");
  }
}

// 成为商家
export async function upgradeToSellerApi() {
  const res = await axios.post(`${BASE_URL}/auth/upgrade-seller`, {}, { withCredentials: true });
  if (res.data.code === 200) {
    return res.data;
  } else {
    throw new Error(res.data.msg || '升级为商家失败');
  }
}

export async function downgradeToUserApi() {
  const res = await axios.post(`${BASE_URL}/auth/downgradeToUser`, {}, { withCredentials: true });
  if (res.data.code === 200) {
    return res.data;
  } else {
    throw new Error(res.data.msg || '回滚为普通用户失败');
  }
}

// 收藏数据集
export async function favoriteDatasetApi(userId: number, datasetId: number) {
  const res = await axios.post(`${BASE_URL}/auth/favorites`, { userID: userId, datasetID: datasetId }, { withCredentials: true });
  if (res.data.code === 200) {
    return res.data.data;
  } else {
    throw new Error('收藏失败');
  }
}

// 取消收藏数据集
export async function unfavoriteDatasetApi(userId: number, datasetId: number) {
  const res = await axios.post(`${BASE_URL}/auth/unFavorites`, { userID: userId, datasetID: datasetId }, { withCredentials: true });
  if (res.data.code === 200) {
    return res.data.data;
  } else {
    throw new Error('取消收藏失败');
  }
}

// 查询收藏状态
export async function getFavoriteStatus(datasetId: number): Promise<boolean> {
  const res = await axios.get(`${BASE_URL}/auth/favorites-status`, {
    params: {datasetID: datasetId },
    withCredentials: true,
  });
  if (res.data.code === 200) {
    return !!res.data.data?.isFavorited;
  } else {
    throw new Error(res.data.msg || '获取收藏状态失败');
  }
}

export async function getUserFavoritesApi(userId: number) {
  const res = await axios.get(`${BASE_URL}/auth/favorites-list`, {
    params: { userID: userId },
    withCredentials: true,
  });
  console.log("getUserFavoritesApi res = ", res)
  if(res.data.code === 200) {
    return res.data.data.data || [];
  } else {
    throw new Error(res.data.msg || '获取用户收藏数据失败');
  }
}

// 获取作者数据集统计信息
export async function getAuthorDatasetStatsApi(authorWalletAddress: string) {
  const res = await axios.get(`${BASE_URL}/auth/author-stats`, {
    params: { authorWalletAddress },
    withCredentials: true,
  });
  if (res.data.code === 200) {
    return res.data.data.data;
  } else {
    throw new Error(res.data.msg || '获取作者数据集统计信息失败');
  }
}

// 获取用户统计数据（包括购买和下载的数据集分类列表）
export async function getUserStatsApi() {
  const res = await axios.get(`${BASE_URL}/auth/user-stats`, { withCredentials: true });
  if (res.data.code === 200 && res.data.data) {
    const statsData = res.data.data.data || res.data.data;
    return {
      total_spent: statsData.total_spent || statsData.totalSpent,
      total_uploads: statsData.total_uploads || statsData.totalUploads,
      total_purchases: statsData.total_purchases || statsData.totalPurchases,
      total_downloads: statsData.total_downloads || statsData.totalDownloads,
      purchased_datasets: statsData.purchased_datasets || statsData.purchasedDatasets || [],
      downloaded_datasets: statsData.downloaded_datasets || statsData.downloadedDatasets || [],
    };
  } else {
    throw new Error(res.data.msg || '获取用户统计数据失败');
  }
}

// 获取用户交易记录（购买记录）
export async function getUserTransactionsApi() {
  const res = await axios.get(`${BASE_URL}/auth/transactions`, { withCredentials: true });
  if (res.data.code === 200 && res.data.data) {
    return res.data.data.data || [];
  } else {
    throw new Error(res.data.msg || '获取交易记录失败');
  }
}

// 获取用户下载记录
export async function getUserDownloadRecordsApi() {
  const res = await axios.get(`${BASE_URL}/auth/download-records`, { withCredentials: true });
  if (res.data.code === 200 && res.data.data) {
    return res.data.data.data || [];
  } else {
    throw new Error(res.data.msg || '获取下载记录失败');
  }
}
