"use client"

import { useAuth } from "@/contexts/AuthContext"
import { hasPermission, canAccessRoute, ROLE_CONFIGS } from "@/lib/constants/roles"
import contract from '@/contract/contractConnect'
import { useEffect, useState } from 'react'

/**
 * 角色权限管理Hook
 */
export function useRole() {
  const { user, isAuthenticated } = useAuth()
  const [chainRole, setChainRole] = useState<string | null>(null)

  // 链上获取角色
  useEffect(() => {
    async function fetchRole() {
      if (user?.walletAddress) {
        try {
          const roleNum = await contract.roles(user.walletAddress)
          // 0: user, 1: seller, 2: admin
          let role = 'user'
          if (roleNum === BigInt(1)) role = 'seller'
          if (roleNum === BigInt(2)) role = 'admin'
          console.log("role = " +  role)
          setChainRole(role)
        } catch {
          setChainRole(null)
        }
      } else {
        setChainRole(null)
      }
    }
    fetchRole()
  }, [user?.walletAddress])

  // 获取当前用户角色配置（链上优先）
  const getRoleConfig = () => {
    if (!user) return null
    const role = chainRole || user.role
    return ROLE_CONFIGS[role] || null
  }

  // 检查是否有特定权限
  const checkPermission = (action: string, resource: string, conditions?: Record<string, any>) => {
    if (!user || !isAuthenticated) return false
    return hasPermission(chainRole || user.role, action, resource, conditions)
  }

  // 检查是否可以访问路由
  const checkRouteAccess = (path: string) => {
    if (!user || !isAuthenticated) return false
    return canAccessRoute(chainRole || user.role, path)
  }

  // 检查是否是特定角色（链上优先）
  const isRole = (role: "user" | "seller" | "admin") => {
    return (chainRole || user?.role) === role
  }

  // 检查是否是普通用户
  const isRegularUser = () => isRole("user")

  // 检查是否是商家
  const isSeller = () => isRole("seller")

  // 检查是否是管理员
  const isAdmin = () => isRole("admin")

  // 检查是否可以上传数据集
  const canUploadDataset = () => {
    return checkPermission("create", "dataset")
  }

  // 检查是否可以购买数据集
  const canPurchaseDataset = () => {
    return checkPermission("purchase", "dataset", { has_wallet: !!user?.walletAddress })
  }

  // 检查是否可以管理特定数据集
  const canManageDataset = (datasetOwnerId?: number) => {
    if (!user) return false

    // 管理员可以管理所有数据集
    if (isAdmin()) return true

    // 商家只能管理自己的数据集
    if (isSeller() && datasetOwnerId) {
      return checkPermission("update", "dataset", { is_owner: user.id === datasetOwnerId })
    }

    return false
  }

  // 获取角色显示名称
  const getRoleDisplayName = () => {
    const roleConfig = getRoleConfig()
    return roleConfig?.displayName || "未知角色"
  }

  // 获取允许访问的路由列表
  const getAllowedRoutes = () => {
    const roleConfig = getRoleConfig()
    return roleConfig?.allowedRoutes || []
  }

  return {
    user,
    isAuthenticated,
    roleConfig: getRoleConfig(),
    checkPermission,
    checkRouteAccess,
    isRole,
    isRegularUser, // Changed from isUser to isRegularUser
    isUser: isRegularUser, // Keep backward compatibility alias
    isSeller,
    isAdmin,
    canUploadDataset,
    canPurchaseDataset,
    canManageDataset,
    getRoleDisplayName,
    getAllowedRoutes,
  }
}
