"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Filter, X, ChevronDown, ChevronUp, Star, Download, Calendar, FileText, DollarSign } from "lucide-react"

interface AdvancedFilterSidebarProps {
  onFiltersChange: (filters: AdvancedFilters) => void
  showPriceFilter?: boolean
  className?: string
}

interface AdvancedFilters {
  categories: string[]
  priceRange: [number, number]
  fileSizeRange: [number, number]
  fileFormats: string[]
  ratings: number[]
  downloadRange: [number, number]
  dateRange: string
  sortBy: string
  authors: string[]
}

const categories = [
  "自然语言处理",
  "文本分类",
  "推荐系统",
  "金融数据",
  "问答系统",
  "情感分析",
  "对话系统",
  "信息抽取",
]

const fileFormats = ["JSONL", "CSV", "JSON", "TXT", "Parquet", "Excel", "XML", "HDF5"]

const sortOptions = [
  { value: "latest", label: "最新发布" },
  { value: "rating", label: "评分最高" },
  { value: "downloads", label: "下载最多" },
  { value: "price_low", label: "价格从低到高" },
  { value: "price_high", label: "价格从高到低" },
  { value: "size_small", label: "文件大小从小到大" },
  { value: "size_large", label: "文件大小从大到小" },
]

const mockAuthors = ["nlp_researcher", "data_scientist", "ai_researcher", "ml_engineer", "vision_expert"]

export function AdvancedFilterSidebar({
  onFiltersChange,
  showPriceFilter = true,
  className,
}: AdvancedFilterSidebarProps) {
  const [filters, setFilters] = useState<AdvancedFilters>({
    categories: [],
    priceRange: [0, 1000],
    fileSizeRange: [0, 10000], // MB
    fileFormats: [],
    ratings: [],
    downloadRange: [0, 10000],
    dateRange: "all",
    sortBy: "latest",
    authors: [],
  })

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    fileSize: false,
    formats: false,
    ratings: false,
    downloads: false,
    date: false,
    authors: false,
  })

  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<AdvancedFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Handle category selection
  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked ? [...filters.categories, category] : filters.categories.filter((c) => c !== category)
    updateFilters({ categories: newCategories })
  }

  // Handle file format selection
  const handleFormatChange = (format: string, checked: boolean) => {
    const newFormats = checked ? [...filters.fileFormats, format] : filters.fileFormats.filter((f) => f !== format)
    updateFilters({ fileFormats: newFormats })
  }

  // Handle rating selection
  const handleRatingChange = (rating: number, checked: boolean) => {
    const newRatings = checked ? [...filters.ratings, rating] : filters.ratings.filter((r) => r !== rating)
    updateFilters({ ratings: newRatings })
  }

  // Handle author selection
  const handleAuthorChange = (author: string, checked: boolean) => {
    const newAuthors = checked ? [...filters.authors, author] : filters.authors.filter((a) => a !== author)
    updateFilters({ authors: newAuthors })
  }

  // Clear all filters
  const clearAllFilters = () => {
    const defaultFilters: AdvancedFilters = {
      categories: [],
      priceRange: [0, 1000],
      fileSizeRange: [0, 10000],
      fileFormats: [],
      ratings: [],
      downloadRange: [0, 10000],
      dateRange: "all",
      sortBy: "latest",
      authors: [],
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  // Count active filters
  useEffect(() => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++
    if (filters.fileSizeRange[0] > 0 || filters.fileSizeRange[1] < 10000) count++
    if (filters.fileFormats.length > 0) count++
    if (filters.ratings.length > 0) count++
    if (filters.downloadRange[0] > 0 || filters.downloadRange[1] < 10000) count++
    if (filters.dateRange !== "all") count++
    if (filters.authors.length > 0) count++
    setActiveFiltersCount(count)
  }, [filters])

  // Format file size
  const formatFileSize = (mb: number) => {
    if (mb < 1024) return `${mb}MB`
    return `${(mb / 1024).toFixed(1)}GB`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              筛选器
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                清除
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Sort Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>排序方式</Label>
            <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
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
        </CardContent>
      </Card>

      {/* Categories Filter */}
      <Card>
        <Collapsible open={expandedSections.categories} onOpenChange={() => toggleSection("categories")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  数据集分类
                  {filters.categories.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.categories.length}
                    </Badge>
                  )}
                </CardTitle>
                {expandedSections.categories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Price Range Filter */}
      {showPriceFilter && (
        <Card>
          <Collapsible open={expandedSections.price} onOpenChange={() => toggleSection("price")}>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    价格范围
                  </CardTitle>
                  {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>¥{filters.priceRange[0]}</span>
                    <span>¥{filters.priceRange[1]}</span>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* File Size Filter */}
      <Card>
        <Collapsible open={expandedSections.fileSize} onOpenChange={() => toggleSection("fileSize")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  文件大小
                </CardTitle>
                {expandedSections.fileSize ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <Slider
                  value={filters.fileSizeRange}
                  onValueChange={(value) => updateFilters({ fileSizeRange: value as [number, number] })}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatFileSize(filters.fileSizeRange[0])}</span>
                  <span>{formatFileSize(filters.fileSizeRange[1])}</span>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* File Formats Filter */}
      <Card>
        <Collapsible open={expandedSections.formats} onOpenChange={() => toggleSection("formats")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  文件格式
                  {filters.fileFormats.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.fileFormats.length}
                    </Badge>
                  )}
                </CardTitle>
                {expandedSections.formats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {fileFormats.map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={`format-${format}`}
                      checked={filters.fileFormats.includes(format)}
                      onCheckedChange={(checked) => handleFormatChange(format, !!checked)}
                    />
                    <Label htmlFor={`format-${format}`} className="text-sm cursor-pointer">
                      {format}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Ratings Filter */}
      <Card>
        <Collapsible open={expandedSections.ratings} onOpenChange={() => toggleSection("ratings")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  评分筛选
                  {filters.ratings.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.ratings.length}
                    </Badge>
                  )}
                </CardTitle>
                {expandedSections.ratings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rating-${rating}`}
                      checked={filters.ratings.includes(rating)}
                      onCheckedChange={(checked) => handleRatingChange(rating, !!checked)}
                    />
                    <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex items-center gap-1">
                      {rating}
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      及以上
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Download Range Filter */}
      <Card>
        <Collapsible open={expandedSections.downloads} onOpenChange={() => toggleSection("downloads")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  下载量
                </CardTitle>
                {expandedSections.downloads ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <Slider
                  value={filters.downloadRange}
                  onValueChange={(value) => updateFilters({ downloadRange: value as [number, number] })}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{filters.downloadRange[0].toLocaleString()}</span>
                  <span>{filters.downloadRange[1].toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Date Range Filter */}
      <Card>
        <Collapsible open={expandedSections.date} onOpenChange={() => toggleSection("date")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  发布时间
                </CardTitle>
                {expandedSections.date ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Select value={filters.dateRange} onValueChange={(value) => updateFilters({ dateRange: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有时间</SelectItem>
                  <SelectItem value="week">最近一周</SelectItem>
                  <SelectItem value="month">最近一月</SelectItem>
                  <SelectItem value="quarter">最近三月</SelectItem>
                  <SelectItem value="year">最近一年</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">已选筛选条件</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {filters.categories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleCategoryChange(category, false)} />
                </Badge>
              ))}
              {filters.fileFormats.map((format) => (
                <Badge key={format} variant="secondary" className="text-xs">
                  {format}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleFormatChange(format, false)} />
                </Badge>
              ))}
              {filters.ratings.map((rating) => (
                <Badge key={rating} variant="secondary" className="text-xs">
                  {rating}星+
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleRatingChange(rating, false)} />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
