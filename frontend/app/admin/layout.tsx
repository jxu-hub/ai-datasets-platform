"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ProgressLink from "@/components/system/ProgressLink"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { BarChart3, Users, Database, Shield, Menu, Home, ChevronLeft, Settings, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"
import TopProgressBar from "@/components/system/TopProgressBar";

const adminNavItems = [
  {
    title: "概览",
    href: "/admin",
    icon: Home,
  },
  {
    title: "数据统计",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "用户管理",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "数据集管理",
    href: "/admin/datasets",
    icon: Database,
  },
  {
    title: "指纹检测",
    href: "/admin/fingerprint",
    icon: Shield,
  },
  {
    title: "存储管理",
    href: "/admin/storage",
    icon: HardDrive,
  },
  {
    title: "系统配置",
    href: "/admin/config",
    icon: Settings,
  },
]

/**
 * 管理员后台布局组件
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const isActivePath = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <ProtectedRoute requireRole="admin">
      <TopProgressBar />
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-muted/30 border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <ProgressLink href="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-medium">返回前台</span>
              </ProgressLink>
            </div>
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <ProgressLink
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActivePath(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {item.title}
                    </ProgressLink>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40">
              <Menu className="h-5 w-5" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full pt-5 overflow-y-auto bg-muted/30">
              <div className="flex items-center flex-shrink-0 px-4">
                <ProgressLink href="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">返回前台</span>
                </ProgressLink>
              </div>
              <div className="mt-8 flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <ProgressLink
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                          isActivePath(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                        {item.title}
                      </ProgressLink>
                    )
                  })}
                </nav>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
