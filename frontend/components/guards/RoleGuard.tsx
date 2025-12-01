"use client"

import type { ReactNode } from "react"
import { useRole } from "@/hooks/useRole"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldX, LogIn } from "lucide-react"
import Link from "next/link"

interface RoleGuardProps {
  children: ReactNode
  requiredRole?: "user" | "seller" | "admin"
  requiredPermission?: {
    action: string
    resource: string
    conditions?: Record<string, any>
  }
  requireAuth?: boolean
  fallback?: ReactNode
  showLoginPrompt?: boolean
  allowedRoles?: string[]
}

/**
 * 角色权限守卫组件
 * PERMISSION: 需要权限验证
 */
export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  requireAuth = false,
  fallback,
  showLoginPrompt = true,
  allowedRoles,
}: RoleGuardProps) {
  const { user, isAuthenticated, checkPermission, isRole } = useRole()

  console.log(
    "[v0] RoleGuard - user:",
    user?.username,
    "role:",
    user?.role,
    "requiredRole:",
    requiredRole,
    "allowedRoles:",
    allowedRoles,
    "isAuthenticated:",
    isAuthenticated,
  )

  // Ensure admin role is properly verified
  if (requiredRole === "admin") {
    if (!isAuthenticated || !user || user.role !== "admin") {
      console.log(
        "[v0] Admin access DENIED - user:",
        user?.username,
        "role:",
        user?.role,
        "authenticated:",
        isAuthenticated,
      )
      if (fallback) return <>{fallback}</>

      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
              <AlertDescription className="mt-2">访问被拒绝：您没有管理员权限。</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild>
                <Link href="/">返回首页</Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }
    console.log("[v0] Admin access GRANTED for user:", user.username)
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some((role) => isRole(role as "user" | "seller" | "admin"))
    if (!hasAllowedRole) {
      console.log("[v0] Access denied - user role not in allowed roles:", user?.role, "allowed:", allowedRoles)
      if (fallback) return <>{fallback}</>

      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
              <AlertDescription className="mt-2">您没有权限访问此功能。</AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }
  }

  // 检查是否需要登录
  if (requireAuth && !isAuthenticated) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Alert>
            <LogIn className="h-4 w-4" />
            <AlertDescription className="mt-2">
              {showLoginPrompt ? "请先登录以访问此功能" : "需要登录权限"}
            </AlertDescription>
          </Alert>
          {showLoginPrompt && (
            <div className="mt-4 space-x-2">
              <Button asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 检查角色权限
  if (requiredRole && !isRole(requiredRole)) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Alert variant="destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription className="mt-2">
              您没有权限访问此功能。需要{" "}
              {requiredRole === "user" ? "普通用户" : requiredRole === "seller" ? "商家" : "管理员"} 角色。
            </AlertDescription>
          </Alert>
          {requiredRole === "seller" && user?.role === "user" && (
            <div className="mt-4">
              <Button asChild>
                <Link href="/profile">升级为商家</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 检查特定权限
  if (requiredPermission) {
    const hasRequiredPermission = checkPermission(
      requiredPermission.action,
      requiredPermission.resource,
      requiredPermission.conditions,
    )

    if (!hasRequiredPermission) {
      if (fallback) return <>{fallback}</>

      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
              <AlertDescription className="mt-2">您没有权限执行此操作。</AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }
  }

  // 权限检查通过，渲染子组件
  return <>{children}</>
}
