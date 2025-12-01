"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { DatasetCard } from "@/components/datasets/DatasetCard"
import { DatasetFilters } from "@/components/datasets/DatasetFilters"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { useDataset } from "@/contexts/DatasetContext";
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole"
import ProgressLink from "@/components/system/ProgressLink"
import type { Dataset } from "@/types"
import { toast } from "sonner"

export default function PaidDatasetsPage() {
  const { isAuthenticated, hasWallet } = useAuth()
  const { isAdmin } = useRole()
  const { fetchPaidDatasets } = useDataset();
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    search: "",
    category: "全部分类",
    priceRange: "all",
    fileSizeRange: "all",
    sortBy: "latest",
  })

  const pageSize = 10

  // 加载数据集
  const loadDatasets = async (page = 1) => {
    setLoading(true)

    try {
      const response = await fetchPaidDatasets({
        page,
        limit: pageSize,
        category: filters.category !== "全部分类" ? filters.category : undefined,
        search: filters.search || undefined,
        fileSizeRange: filters.fileSizeRange !== "all" ? filters.fileSizeRange : undefined,
        priceRange: filters.priceRange !== "all" ? filters.priceRange : undefined,
      });
      setDatasets(response.items)
      setTotalPages(response.totalPages)
      setCurrentPage(response.page)
    } catch (err) {
      toast.error("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadDatasets(1)
  }, [filters])

  // 处理筛选器变化
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    loadDatasets(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="付费数据集" description="发现高质量的专业AI训练数据集，支持您的机器学习项目" />

      {/* 钱包提醒 - 仅对已登录但未绑定钱包的非管理员用户显示 */}
      {isAuthenticated && !hasWallet && !isAdmin() && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">需要绑定钱包</h3>
                <p className="text-sm text-blue-600">购买付费数据集前需要先绑定您的钱包地址</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                <ProgressLink href="/profile?tab=wallet">绑定钱包</ProgressLink>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 侧边栏筛选器 */}
        <div className="lg:col-span-1">
          <DatasetFilters onFiltersChange={handleFiltersChange} showPriceFilter={true} />
        </div>

        {/* 主内容区域 */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">没有找到符合条件的数据集</p>
              <Button
                variant="outline"
                onClick={() =>
                  handleFiltersChange({
                    search: "",
                    category: "全部分类",
                    priceRange: "all",
                    fileSizeRange: "all",
                    sortBy: "latest",
                  })
                }
                className="mt-4"
              >
                清除筛选条件
              </Button>
            </div>
          ) : (
            <>
              {/* 结果统计 */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">找到 {datasets.length} 个付费数据集</p>
              </div>

              {/* 数据集网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {datasets.map((dataset) => (
                  <DatasetCard key={dataset.id} dataset={dataset} />
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一页
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
