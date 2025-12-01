"use client"

import ProgressLink from "@/components/system/ProgressLink"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  title: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

/**
 * 面包屑导航组件
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()

  // 如果没有提供items，根据路径自动生成
  const breadcrumbItems = items || generateBreadcrumbItems(pathname)

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <ProgressLink href="/" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
        <span className="sr-only">首页</span>
      </ProgressLink>

      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href && index < breadcrumbItems.length - 1 ? (
            <ProgressLink href={item.href} className="hover:text-foreground transition-colors">
              {item.title}
            </ProgressLink>
          ) : (
            <span className="text-foreground font-medium">{item.title}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

/**
 * 根据路径自动生成面包屑项
 */
function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  const items: BreadcrumbItem[] = []

  // 路径映射
  const pathMap: Record<string, string> = {
    "free-datasets": "免费数据集",
    "paid-datasets": "付费数据集",
    datasets: "数据集",
    upload: "上传数据集",
    profile: "个人中心",
    wallet: "钱包管理",
    admin: "管理后台",
    login: "登录",
    register: "注册",
    "forgot-password": "忘记密码",
  }

  segments.forEach((segment, index) => {
    const title = pathMap[segment] || segment
    const href = "/" + segments.slice(0, index + 1).join("/")

    items.push({
      title,
      href: index < segments.length - 1 ? href : undefined,
    })
  })

  return items
}
