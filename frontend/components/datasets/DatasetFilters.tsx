"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, X } from "lucide-react"
import { useRef } from "react"

interface DatasetFiltersProps {
  onFiltersChange: (filters: {
    search: string
    category: string
    priceRange: string
    fileSizeRange: string
    sortBy: string
  }) => void
  showPriceFilter?: boolean
}

const categories = [
  "全部分类",
  "自然语言处理",
  "文本分类",
  "推荐系统",
  "金融数据",
  "问答系统",
  "情感分析",
  "对话系统",
  "信息抽取",
]

const sortOptions = [
  { value: "latest", label: "最新发布" },
  { value: "popular", label: "最受欢迎" },
  { value: "rating", label: "评分最高" },
  { value: "downloads", label: "下载最多" },
  { value: "price_low", label: "价格从低到高" },
  { value: "price_high", label: "价格从高到低" },
]

const fileSizeSteps = [
  0, // 0B
  100 * 1024 * 1024, // 100MB
  500 * 1024 * 1024, // 500MB
  1 * 1024 * 1024 * 1024, // 1GB
  2 * 1024 * 1024 * 1024, // 2GB
  3 * 1024 * 1024 * 1024, // 3GB
  5 * 1024 * 1024 * 1024, // 5GB
  8 * 1024 * 1024 * 1024, // 8GB
  10 * 1024 * 1024 * 1024, // 10GB
]

export function DatasetFilters({ onFiltersChange, showPriceFilter = true }: DatasetFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    category: "全部分类",
    priceRange: "all",
    fileSizeRange: "all",
    sortBy: "latest",
  })
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  const [fileSizeIndices, setFileSizeIndices] = useState([0, fileSizeSteps.length - 1])
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
    // 更新活跃筛选器
    const newActiveFilters = []
    if (newFilters.search) newActiveFilters.push(`搜索: ${newFilters.search}`)
    if (newFilters.category !== "全部分类") newActiveFilters.push(`分类: ${newFilters.category}`)
    setActiveFilters(newActiveFilters)
  }

  const handlePriceInputChange = (type: "min" | "max", value: string) => {
    let newMin = minPrice, newMax = maxPrice
    if (type === "min") {
      setMinPrice(value)
      newMin = value
    } else {
      setMaxPrice(value)
      newMax = value
    }
    let priceRange = "all"
    if (newMin && newMax) {
      priceRange = `${newMin}-${newMax}`
      const newFilters = { ...filters, priceRange }
      setFilters(newFilters)
      onFiltersChange(newFilters)
    } else {
      const newFilters = { ...filters, priceRange: "all" }
      setFilters(newFilters)
    }
  }

  const handleFileSizeChange = useCallback(
    (indices: number[]) => {
      setFileSizeIndices(indices)
      const minSize = fileSizeSteps[indices[0]]
      const maxSize = fileSizeSteps[indices[1]]
      const sizeFilter = minSize === 0 && maxSize === fileSizeSteps[fileSizeSteps.length-1] ? "all" : `${minSize}-${maxSize}`
      const newFilters = { ...filters, fileSizeRange: sizeFilter }
      setFilters(newFilters)
      onFiltersChange(newFilters)
    },
    [filters],
  )

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0MB"
    if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))}MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
  }

  const clearFilters = () => {
    const defaultFilters = {
      search: "",
      category: "全部分类",
      priceRange: "all",
      fileSizeRange: "all",
      sortBy: "latest",
    }
    setFilters(defaultFilters)
    setFileSizeIndices([0, fileSizeSteps.length - 1])
    setActiveFilters([])
    onFiltersChange(defaultFilters)
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索数据集..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选条件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 分类筛选 */}
          <div className="space-y-2">
            <Label>数据集分类</Label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 价格筛选 */}
          {showPriceFilter && (
            <div className="space-y-2">
              <Label>价格范围 (ETH)</Label>
              <div className="flex gap-4 items-center w-full">
                <Input
                  type="number"
                  min="0"
                  placeholder="最低价"
                  value={minPrice}
                  onChange={e => handlePriceInputChange("min", e.target.value)}
                  className="w-32 h-10 text-sm rounded-md border border-input focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ minWidth: 0 }}
                />
                <span className="mx-2 text-muted-foreground text-base">-</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="最高价"
                  value={maxPrice}
                  onChange={e => handlePriceInputChange("max", e.target.value)}
                  className="w-32 h-10 text-sm rounded-md border border-input focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ minWidth: 0 }}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label>文件大小</Label>
            <div className="px-2">
              <Slider
                value={fileSizeIndices}
                onValueChange={handleFileSizeChange}
                max={fileSizeSteps.length - 1}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatFileSize(fileSizeSteps[fileSizeIndices[0]])}</span>
                <span>{formatFileSize(fileSizeSteps[fileSizeIndices[1]])}</span>
              </div>
            </div>
          </div>

          {/* 排序 */}
          <div className="space-y-2">
            <Label>排序方式</Label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 清除筛选器 */}
          {activeFilters.length > 0 && (
            <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
              <X className="mr-2 h-4 w-4" />
              清除筛选器
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 活跃筛选器显示 */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary">
              {filter}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
