"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut, Upload, BarChart3, Heart, CreditCard, Wallet, Database } from "lucide-react"
import { useRouter } from "next/navigation"
import ProgressLink from "@/components/system/ProgressLink"

/**
 * 用户认证状态显示组件
 */
export function AuthStatus() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { getRoleDisplayName, canUploadDataset, isAdmin } = useRole()

  const apiMinio = process.env.NEXT_PUBLIC_API_MINIO as string

  console.log("components/auth/AuthStatus: user = ", user)
  console.log("components/auth/AuthStatus: isAuthenticated = ", isAuthenticated)

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost">
          <ProgressLink href="/login">登录</ProgressLink>
        </Button>
        <Button asChild>
          <ProgressLink href="/register">注册</ProgressLink>
        </Button>
      </div>
    )
  }

  const handleLogout =() => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex items-center gap-3">
      {/* 用户下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={apiMinio + user.avatarUrl || "/placeholder.svg"} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="w-fit text-xs mt-1">
                {getRoleDisplayName()}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* 仪表板 */}
          <DropdownMenuItem asChild>
            <ProgressLink href="/dashboard" className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              仪表板
            </ProgressLink>
          </DropdownMenuItem>

          {/* 个人中心链接 */}
          <DropdownMenuItem asChild>
            <ProgressLink href="/profile" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              个人中心
            </ProgressLink>
          </DropdownMenuItem>

          {/* 收藏夹 */}
          <DropdownMenuItem asChild>
            <ProgressLink href="/favorites" className="cursor-pointer">
              <Heart className="mr-2 h-4 w-4" />
              收藏夹
            </ProgressLink>
          </DropdownMenuItem>

          {/* 交易记录 */}
          <DropdownMenuItem asChild>
            <ProgressLink href="/transactions" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              交易记录
            </ProgressLink>
          </DropdownMenuItem>

          {/* 钱包管理 */}
          {!isAdmin() && (
            <DropdownMenuItem asChild>
              <ProgressLink href="/wallet" className="cursor-pointer">
                <Wallet className="mr-2 h-4 w-4" />
                钱包管理
              </ProgressLink>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* 商家功能 */}
          {canUploadDataset() && (
            <>
              <DropdownMenuItem asChild>
                <ProgressLink href="/my-datasets" className="cursor-pointer">
                  <Database className="mr-2 h-4 w-4" />
                  我的数据集
                </ProgressLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <ProgressLink href="/upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  上传数据集
                </ProgressLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* 管理员功能 */}
          {isAdmin() && (
            <>
              <DropdownMenuItem asChild>
                <ProgressLink href="/admin" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  管理后台
                </ProgressLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
