"use client"

import type { ReactNode } from "react"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { Breadcrumb } from "./Breadcrumb"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { AnnouncementBanner } from "@/components/system/AnnouncementBanner"
import { usePathname } from "next/navigation"

interface MainLayoutProps {
  children: ReactNode
  showBreadcrumb?: boolean
  breadcrumbItems?: Array<{ title: string; href?: string }>
}

/**
 * 主布局组件
 */
export function MainLayout({ children, showBreadcrumb = true, breadcrumbItems }: MainLayoutProps) {
  const pathname = usePathname()

  // 不显示面包屑的页面
  const hideBreadcrumbPages = ["/", "/login", "/register", "/forgot-password"]
  const shouldShowBreadcrumb = showBreadcrumb && !hideBreadcrumbPages.includes(pathname)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {pathname === "/" && (
        <div className="container mx-auto px-4 py-2">
          <AnnouncementBanner />
        </div>
      )}

      {shouldShowBreadcrumb && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>
      )}

      <main className="flex-1">
        <ProtectedRoute path={pathname}>{children}</ProtectedRoute>
      </main>

      <Footer />
    </div>
  )
}
