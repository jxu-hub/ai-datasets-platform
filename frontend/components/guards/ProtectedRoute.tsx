"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useRole } from "@/hooks/useRole"
import { RoleGuard } from "./RoleGuard"

interface ProtectedRouteProps {
  children: ReactNode
  path?: string
  requireAuth?: boolean
  requireRole?: string
  allowedRoles?: string[]
}

/**
 * 路由保护组件
 * 根据用户角色和路由配置自动检查访问权限
 */
export function ProtectedRoute({
  children,
  path,
  requireAuth = false,
  requireRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const pathname = usePathname()
  const { checkRouteAccess, isAuthenticated } = useRole()

  const currentPath = path || pathname

  // 公开路由，无需权限检查
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"]
  if (publicRoutes.includes(currentPath)) {
    return <>{children}</>
  }

  if (requireRole || allowedRoles) {
    return (
      <RoleGuard requireAuth={true} requiredRole={requireRole} allowedRoles={allowedRoles}>
        {children}
      </RoleGuard>
    )
  }

  // 需要登录的路由
  const authRequiredRoutes = [
    "/profile",
    "/upload",
    "/wallet",
    "/dashboard",
    "/favorites",
    "/transactions",
    "/my-datasets",
  ]
  const needsAuth = requireAuth || authRequiredRoutes.some((route) => currentPath.startsWith(route))

  // 检查路由访问权限
  if (isAuthenticated && !checkRouteAccess(currentPath)) {
    return (
      <RoleGuard requireAuth={false} showLoginPrompt={false}>
        {children}
      </RoleGuard>
    )
  }

  return <RoleGuard requireAuth={needsAuth}>{children}</RoleGuard>
}
