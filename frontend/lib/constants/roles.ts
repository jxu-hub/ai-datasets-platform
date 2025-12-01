import type { RoleConfig } from "@/types"

/**
 * 角色映射
 */
export const ROLE_MAP: Record<number, string> = {
  0: "user",
  1: "seller",
  2: "admin",
}


/**
 * 角色权限配置
 */
export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  user: {
    name: "user",
    displayName: "普通用户",
    permissions: [
      { action: "read", resource: "dataset" },
      { action: "download", resource: "dataset", conditions: { is_free: true } },
      { action: "purchase", resource: "dataset", conditions: { has_wallet: true } },
      { action: "read", resource: "profile" },
      { action: "update", resource: "profile" },
      { action: "bind", resource: "wallet" },
    ],
    allowedRoutes: ["/", "/free-datasets", "/paid-datasets", "/datasets/*", "/profile", "/wallet"],
  },
  seller: {
    name: "seller",
    displayName: "商家", // Changed from "出售者" to "商家"
    permissions: [
      // 继承普通用户权限
      { action: "read", resource: "dataset" },
      { action: "download", resource: "dataset", conditions: { is_free: true } },
      { action: "purchase", resource: "dataset", conditions: { has_wallet: true } },
      { action: "read", resource: "profile" },
      { action: "update", resource: "profile" },
      { action: "bind", resource: "wallet" },
      // 商家特有权限
      { action: "create", resource: "dataset" },
      { action: "update", resource: "dataset", conditions: { is_owner: true } },
      { action: "delete", resource: "dataset", conditions: { is_owner: true } },
      { action: "read", resource: "sales_stats" },
    ],
    allowedRoutes: [
      "/",
      "/free-datasets",
      "/paid-datasets",
      "/datasets/*",
      "/profile",
      "/wallet",
      "/upload",
      "/my-datasets",
    ],
  },
  admin: {
    name: "admin",
    displayName: "管理员",
    permissions: [
      { action: "read", resource: "user" },
      { action: "read", resource: "dataset" },
      { action: "delete", resource: "dataset" },
      { action: "read", resource: "platform_stats" },
      { action: "manage", resource: "categories" },
      { action: "manage", resource: "reports" },
      { action: "read", resource: "profile" },
      { action: "update", resource: "profile" },
    ],
    allowedRoutes: ["/", "/admin", "/admin/*", "/profile"],
  },
}

/**
 * 检查用户是否有特定权限
 */
export function hasPermission(
  userRole: string,
  action: string,
  resource: string,
  conditions?: Record<string, any>,
): boolean {
  const roleConfig = ROLE_CONFIGS[userRole]
  if (!roleConfig) return false

  const permission = roleConfig.permissions.find((p) => p.action === action && p.resource === resource)

  if (!permission) return false

  // 检查条件
  if (permission.conditions && conditions) {
    return Object.entries(permission.conditions).every(([key, value]) => conditions[key] === value)
  }

  return true
}

/**
 * 检查用户是否可以访问路由
 */
export function canAccessRoute(userRole: string, path: string): boolean {
  const roleConfig = ROLE_CONFIGS[userRole]
  if (!roleConfig) return false

  return roleConfig.allowedRoutes.some((route) => {
    if (route.endsWith("/*")) {
      return path.startsWith(route.slice(0, -2))
    }
    return route === path
  })
}
