"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { User, AuthState, RegisterForm, ResetPasswordForm, UserUpdate, UserStats } from "@/types"
import { loginApi, getProfile, sendVerificationCodeApi, registerApi, resetPasswordApi, logoutApi, updateUserApi, upgradeToSellerApi, downgradeToUserApi, favoriteDatasetApi, unfavoriteDatasetApi, getFavoriteStatus, getUserFavoritesApi, getUserStatsApi, getUserTransactionsApi, getUserDownloadRecordsApi } from "@/lib/api/auth"
import { checkHasWallet } from "@/lib/api/wallet"

// 认证状态管理
interface AuthAction {
  type: "SET_LOADING" | "LOGIN_SUCCESS" | "LOGOUT" | "UPDATE_USER" | "UPDATE_USER_STATS" | "SET_ERROR"
  payload?: any
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasWallet: false,
  userStats: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        hasWallet: !!action.payload.user.walletAddress,
      }

    case "LOGOUT":
      return {
        ...initialState,
        isLoading: false,
      }

    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
        hasWallet: !!action.payload.walletAddress,
      }

    case "UPDATE_USER_STATS":
      return {
        ...state,
        userStats: action.payload,
      }

    case "SET_ERROR":
      return {
        ...state,
        isLoading: false,
      }

    default:
      return state
  }
}

// 认证上下文接口
interface AuthContextType extends AuthState {
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string; user: any }>
  register: (userData: RegisterForm) => Promise<{ success: boolean; error?: string }>
  resetPassword: (data: ResetPasswordForm) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (user: UserUpdate) => void
  sendVerificationCode: (email: string) => Promise<{ success: boolean; msg?: string }>
  upgradeToSeller: () => Promise<{ success: boolean; error?: string }>
  downgradeToUser: () => Promise<{ success: boolean; error?: string }>
  checkWalletBind: () => Promise<{ bound: boolean }>
  favoriteDataset: (userId: number, datasetId: number) => Promise<any>;
  unfavoriteDataset: (userId: number, datasetId: number) => Promise<any>;
  fetchFavoriteStatus: (datasetId: number) => Promise<boolean>;
  fetchUserFavorites: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // 确保如果前面未自动检测身份，首次页面渲染后会把 isLoading =&gt; false
  useEffect(() => {
    if (state.isLoading) {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [])

  // 页面挂载时检测cookie中的auth_token并自动拉取用户信息，恢复登录状态
  useEffect(() => {
    // 若当前未鉴权且isLoading为true说明首次加载，需要尝试拉取profile
    if (!state.isAuthenticated && state.isLoading) {
      getProfile()
        .then((user) => {
          dispatch({ type: "LOGIN_SUCCESS", payload: { user } })
        })
        .catch(() => {
        dispatch({ type: "SET_LOADING", payload: false })
        })
    }
  }, [])

  // 注册函数
  const register = async (userData: RegisterForm) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const response = await registerApi(userData)
      if (response.code === 200) {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: true, user: response.data.user, token: response.data.token }
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
        return { success: false, error: response.msg || "注册失败" }
      }
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false })
      return { success: false, error: error?.message || "网络错误，请稍后重试" }
    }
  }

  // 登录函数
  const login = async (emailOrUsername: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const response = await loginApi({ emailOrUsername, password })
      console.log("authContext: login: response = ", response)
      if (response && response.user) {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: response.user, token: response.token },
        })
        return { success: true, user: response.user }
      } else {
        dispatch({ type: "SET_ERROR" })
        return { success: false, user: null, error: response}
      }
    } catch (error: any) {
      dispatch({ type: "SET_ERROR" })
      return { success: false, user: null, error: error?.message || "网络错误，请稍后重试" }
    }
  }

  // 登出函数
  const logout = async () => {
    await logoutApi()
    dispatch({ type: "LOGOUT" })
  }

  // 重设密码
  const resetPassword = async (data: ResetPasswordForm) => {
    try {
      const response = await resetPasswordApi(data)
      return { success: true, data: response }
    } catch (error) {
      console.error("[AuthProvider] Reset password error:", error)
      return { success: false, error: "重设密码失败" }
    }
  }

  // 更新用户信息
  const updateUser = async (user: UserUpdate) => {
    try {
      const response = await updateUserApi(user)
      // 更新后主动刷新全局 user
      await refreshUser()
      return { success: true, data: response }
    } catch (error) {
      dispatch({ type: "SET_ERROR" })
      return { success: false, error: "更新用户信息失败" }
    }
         
  }

  // 发送验证码
  const sendVerificationCode = async (email: string) => {
    try {
      const res = await sendVerificationCodeApi(email)
      console.log("authContext: sendVerificationCode: res = ", res)
      if (res && res.success) {
        return { success: true, msg: res.msg }
      } else {
        return { success: false, msg: res?.msg }
      }
    } catch (error) {
      return { success: false, msg: "发送验证码失败" }
    }
  }

  // 升级为商家
  const upgradeToSeller = async () => {
    try {
      const response = await upgradeToSellerApi();
      await refreshUser();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "升级失败" };
    }
  }

  // 回滚为普通用户
  const downgradeToUser = async () => {
    try {
      const response = await downgradeToUserApi();
      await refreshUser();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "回滚失败" };
    }
  }

  // 新增 refreshUser 方法
  const refreshUser = async () => {
    try {
      const freshUser = await getProfile();
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: freshUser } });
    } catch (error) {
      // 可选：处理刷新失败
    }
  }

  // 收藏数据集
  const favoriteDataset = async (userId: number, datasetId: number) => {
    return await favoriteDatasetApi(userId, datasetId);
  };

  // 取消收藏数据集
  const unfavoriteDataset = async (userId: number, datasetId: number) => {
    return await unfavoriteDatasetApi(userId, datasetId);
  };

  // 查询收藏状态
  const fetchFavoriteStatus = async (datasetId: number) => {
    return await getFavoriteStatus(datasetId);
  };

  const fetchUserFavorites = async () => {
    if (!state.user) return [];
    try {
      const result = await getUserFavoritesApi(state.user.id);
      return result || [];
    } catch (e) {
      return [];
    }
  };

  const checkWalletBind = async () => {
    try {
      const hasWallet = await checkHasWallet();
      return { bound: hasWallet };
    } catch (error: any) {
      return { bound: false };
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    resetPassword,
    logout,
    updateUser,
    sendVerificationCode,
    upgradeToSeller,
    downgradeToUser,
    checkWalletBind,
    favoriteDataset,
    unfavoriteDataset,
    fetchFavoriteStatus,
    fetchUserFavorites,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 使用认证上下文的Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// 获取用户统计数据
export async function getUserStats() {
  return await getUserStatsApi();
}

// 获取用户交易记录
export async function getUserTransactions() {
  return await getUserTransactionsApi();
}

// 获取用户下载记录
export async function getUserDownloadRecords() {
  return await getUserDownloadRecordsApi();
}

// 获取作者的所有数据集（需要钱包地址）
export async function getAuthorDatasets(authorWalletAddress: string, page = 1, limit = 1000) {
  const { getDatasetsByAuthorApi } = await import('@/lib/api/dataset');
  return await getDatasetsByAuthorApi(authorWalletAddress, page, limit);
}

// 获取作者数据集统计信息（需要钱包地址）
export async function getAuthorDatasetStats(authorWalletAddress: string) {
  const { getAuthorDatasetStatsApi } = await import('@/lib/api/auth');
  return await getAuthorDatasetStatsApi(authorWalletAddress);
}
