"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useSystemConfig } from "@/contexts/SystemConfigContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function MaintenanceMode() {
  const { user } = useAuth()
  const { config } = useSystemConfig()

  // Show maintenance page for non-admin users when maintenance mode is enabled
  if (!config?.platform.maintenanceMode) {
    return null
  }

  // Allow admins to access the platform during maintenance
  if (user?.role === "admin") {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl">系统维护中</CardTitle>
          <CardDescription>平台正在进行系统维护，暂时无法访问。请稍后再试。</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">我们正在努力提升用户体验，预计很快就能恢复正常服务。</p>
          {user && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">已登录用户：{user.username}</p>
              {user.role === "admin" && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    管理后台
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
