import type { User } from "@/types"
import { hasPermission } from "@/lib/constants/roles"

/**
 * 权限验证工具函数
 */

/**
 * 检查用户是否可以访问资源
 */
export function checkResourceAccess(
  user: User | null,
  action: string,
  resource: string,
  conditions?: Record<string, any>,
): boolean {
  if (!user) return false
  return hasPermission(user.role, action, resource, conditions)
}

/**
 * 检查用户是否可以管理数据集
 */
export function canManageDataset(user: User | null, datasetOwnerId: number): boolean {
  if (!user) return false

  // 管理员可以管理所有数据集
  if (user.role === "admin") return true

  // 商家只能管理自己的数据集
  if (user.role === "seller") {
    return user.id === datasetOwnerId
  }

  return false
}

/**
 * 检查用户是否可以购买数据集
 */
export function canPurchaseDataset(user: User | null): boolean {
  if (!user) return false

  // 管理员不能购买数据集
  if (user.role === "admin") return false

  // 需要绑定钱包才能购买
  return !!user.wallet
}

/**
 * 检查用户是否需要绑定钱包
 */
export function requiresWalletBinding(user: User | null, action: string): boolean {
  if (!user || user.role === "admin") return false

  const walletRequiredActions = ["purchase"]
  return walletRequiredActions.includes(action) && !user.wallet
}

/**
 * 获取权限错误消息
 */
export function getPermissionErrorMessage(user: User | null, action: string, resource: string): string {
  if (!user) return "请先登录"

  if (action === "purchase" && resource === "dataset") {
    if (user.role === "admin") return "管理员无法购买数据集"
    if (!user.wallet) return "购买前请先绑定钱包"
  }

  if (action === "create" && resource === "dataset") {
    if (user.role === "user") return "请升级为商家以上传数据集"
  }

  return "您没有权限执行此操作"
}
