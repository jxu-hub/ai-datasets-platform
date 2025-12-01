"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/layout/PageHeader"
import { DatasetCard } from "@/components/datasets/DatasetCard"
import { DatasetFilters } from "@/components/datasets/DatasetFilters"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useDataset } from "@/contexts/DatasetContext";
import type { Dataset } from "@/types"

export default function FreeDatasetsPage() {
  const searchParams = useSearchParams()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "全部分类",
    priceRange: "all",
    fileSizeRange: "all",
    sortBy: "latest",
  })

  const pageSize = 10
  const { fetchFreeDatasets } = useDataset();

  // 加载数据集
  const loadDatasets = async (page = 1) => {
    setLoading(true)

    try {

      const response = await fetchFreeDatasets({
        page,
        limit: pageSize,
        category: filters.category !== "全部分类" ? filters.category : undefined,
        search: filters.search || undefined,
        fileSizeRange: filters.fileSizeRange !== "all" ? filters.fileSizeRange : undefined,
      })
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
      <PageHeader title="免费数据集" description="探索我们精选的免费AI训练数据集，无需付费即可下载使用" />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 侧边栏筛选器 */}
        <div className="lg:col-span-1">
          <DatasetFilters onFiltersChange={handleFiltersChange} showPriceFilter={false} />
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
                <p className="text-sm text-muted-foreground">找到 {datasets.length} 个免费数据集</p>
              </div>

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
