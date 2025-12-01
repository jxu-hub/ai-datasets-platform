"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { RoleGuard } from "@/components/guards/RoleGuard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { getDatasets, deleteDataset as deleteDatasetBackend, restoreDataset as restoreDatasetBackend, getUserByWallet } from "@/contexts/AdminContext"
import { useWallet } from "@/contexts/WalletContext"
import type { Dataset, PaginatedResponse, User, AdminDataset } from "@/types"
import {
  Search,
  Eye,
  Database,
  Calendar,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  Tag,
  Loader2,
  X,
  CalendarIcon,
  ArrowUpDown,
  Ban,
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"
import ProgressLink from "@/components/system/ProgressLink"
import { getWritableContract } from '@/contract/contractConnect'
import { toast } from 'sonner'

export default function AdminDatasetsPage() {
  const { user } = useAuth()
  const { wallet } = useWallet()
  const [allDatasets, setAllDatasets] = useState<AdminDataset[]>([]) // 存储所有数据集
  const [filteredDatasets, setFilteredDatasets] = useState<AdminDataset[]>([]) // 筛选后的数据集
  const [paginatedDatasets, setPaginatedDatasets] = useState<AdminDataset[]>([]) // 当前页显示的数据集
  const [selectedDataset, setSelectedDataset] = useState<AdminDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearchQuery, setActiveSearchQuery] = useState("") // 实际用于筛选的搜索词
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [downloadSortOrder, setDownloadSortOrder] = useState<"asc" | "desc" | null>(null)
  const [priceSortOrder, setPriceSortOrder] = useState<"asc" | "desc" | null>(null)
  const [createdAtSortOrder, setCreatedAtSortOrder] = useState<"asc" | "desc">("desc") // 默认降序
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [authorsMap, setAuthorsMap] = useState<Record<string, User>>({}) // 存储作者信息
  const [categories, setCategories] = useState<string[]>([]) // 缓存分类列表
  
  const apiMinio = process.env.NEXT_PUBLIC_API_MINIO as string
  const adminWalletAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS as string

  // 初始加载所有数据集
  const loadAllDatasets = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("加载所有数据集...")

      const response = await getDatasets({
        page: 1,
        limit: 1000, // 获取所有数据集
      })

      setAllDatasets(response.items)
      console.log(`成功加载 ${response.items.length} 个数据集`)
      
      // 提取并缓存分类列表
      const uniqueCategories = Array.from(new Set(response.items.map(d => d.category).filter(Boolean)))
      setCategories(uniqueCategories)
      
      // 加载作者信息
      await loadAuthors(response.items)
    } catch (err: any) {
      console.error("加载数据集列表失败:", err)
      setError(err.message || "加载数据集列表失败")
      toast.error(err.message || "加载数据集列表失败")
    } finally {
      setLoading(false)
    }
  }
  
  // 加载作者信息
  const loadAuthors = async (datasets: Dataset[]) => {
    const newAuthorsMap: Record<string, User> = { ...authorsMap }
    const walletAddresses = datasets.map(d => d.authorWalletAddress).filter(addr => addr && !newAuthorsMap[addr])
    
    // 并行加载所有作者信息
    await Promise.all(
      walletAddresses.map(async (addr) => {
        try {
          const author = await getUserByWallet(addr)
          newAuthorsMap[addr] = author
        } catch (err) {
          console.error(`获取作者信息失败 (${addr}):`, err)
        }
      })
    )
    
    setAuthorsMap(newAuthorsMap)
  }
  
  // 前端筛选和排序逻辑
  const filterAndSortDatasets = () => {
    let filtered = [...allDatasets]

    // 1. 搜索筛选（标题、描述、作者用户名）
    if (activeSearchQuery.trim()) {
      const query = activeSearchQuery.toLowerCase()
      filtered = filtered.filter((dataset) => {
        const titleMatch = dataset.title.toLowerCase().includes(query)
        const descMatch = dataset.description?.toLowerCase().includes(query)
        const authorMatch = authorsMap[dataset.authorWalletAddress]?.username?.toLowerCase().includes(query)
        return titleMatch || descMatch || authorMatch
      })
    }

    // 2. 分类筛选
    if (categoryFilter !== "all") {
      filtered = filtered.filter((dataset) => dataset.category === categoryFilter)
    }

    // 3. 时间范围筛选
    if (startDate || endDate) {
      filtered = filtered.filter((dataset) => {
        if (!dataset.createdAt) return false
        const createdDate = new Date(dataset.createdAt)
        
        // 如果有开始日期，检查是否在开始日期之后
        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          if (createdDate < start) return false
        }
        
        // 如果有结束日期，检查是否在结束日期之前
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (createdDate > end) return false
        }
        
        return true
      })
    }

    // 4. 排序
    if (downloadSortOrder) {
      filtered.sort((a, b) => {
        const countA = a.downloadCount ?? 0
        const countB = b.downloadCount ?? 0
        return downloadSortOrder === "desc" ? countB - countA : countA - countB
      })
    } else if (priceSortOrder) {
      filtered.sort((a, b) => {
        const priceA = a.isFree ? 0 : (a.price ?? 0)
        const priceB = b.isFree ? 0 : (b.price ?? 0)
        return priceSortOrder === "desc" ? priceB - priceA : priceA - priceB
      })
    } else {
      // 默认按创建时间排序
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return createdAtSortOrder === "desc" ? dateB - dateA : dateA - dateB
      })
    }

    setFilteredDatasets(filtered)

    // 5. 计算总页数
    const pages = Math.ceil(filtered.length / pageSize)
    setTotalPages(pages)

    // 6. 如果当前页超出范围，重置到第一页
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1)
    }
  }

  // 分页逻辑
  const paginateDatasets = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedDatasets(filteredDatasets.slice(startIndex, endIndex))
  }

  // 强制下架
  const handleDeleteDataset = async (dataset: Dataset) => {
    setDeleteLoading(true)
    let dbDeleted = false // 标记数据库是否已删除
    const isFree = dataset.isFree // 判断是否为免费数据集
    
    try {
      // 1. 先在数据库中软删除
      await deleteDatasetBackend(dataset.id)
      dbDeleted = true
      
      // 2. 如果是付费数据集，需要在链上删除；免费数据集无需链上删除
      if (!isFree) {
        const contract = await getWritableContract()
        const tx = await contract.forcedRemovalDataset(dataset.id)
        await tx.wait()
        toast.success('数据集已强制删除!')
      } else {
        toast.success('免费数据集删除完成！')
      }
      
      // 3. 重新加载列表
      await loadAllDatasets()
      setSelectedDataset(null)
    } catch (err: any) {
      console.error('删除数据集失败:', err)
      // 如果数据库已删除但链上删除失败，恢复数据库中的记录
      if (dbDeleted && !isFree) {
        try {
          await restoreDatasetBackend(dataset.id)
          toast.error('链上删除失败，已恢复数据库记录: ' + (err?.reason || err?.message || '未知错误'))
        } catch (restoreErr: any) {
          console.error('恢复数据库记录失败:', restoreErr)
          toast.error('链上删除失败且恢复数据库记录失败，请联系管理员手动处理')
        }
      } else if (!dbDeleted) {
        toast.error('数据库删除失败: ' + (err?.reason || err?.message || '未知错误'))
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    setActiveSearchQuery(searchQuery) // 点击搜索按钮时才应用搜索词
    setCurrentPage(1)
  }

  // 分类筛选
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value)
    setCurrentPage(1)
  }
  
  // 日期范围筛选
  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start)
    setEndDate(end)
    setCurrentPage(1)
  }
  
  // 下载量排序
  const handleDownloadSortToggle = () => {
    if (downloadSortOrder === null) {
      setDownloadSortOrder("desc")
    } else if (downloadSortOrder === "desc") {
      setDownloadSortOrder("asc")
    } else {
      setDownloadSortOrder(null)
    }
    setPriceSortOrder(null) // 清除价格排序
    setCurrentPage(1)
  }
  
  // 价格排序
  const handlePriceSortToggle = () => {
    if (priceSortOrder === null) {
      setPriceSortOrder("desc")
    } else if (priceSortOrder === "desc") {
      setPriceSortOrder("asc")
    } else {
      setPriceSortOrder(null)
    }
    setDownloadSortOrder(null) // 清除下载量排序
    setCurrentPage(1)
  }
  
  // 创建时间排序
  const handleCreatedAtSortToggle = () => {
    const newSort = createdAtSortOrder === "desc" ? "asc" : "desc"
    setCreatedAtSortOrder(newSort)
    setDownloadSortOrder(null) // 清除下载量排序
    setPriceSortOrder(null) // 清除价格排序
    setCurrentPage(1)
  }
  
  // 分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 获取价格
  const getPriceBadge = (dataset: Dataset) => {
    if (dataset.isFree) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          免费
        </Badge>
      )
    }
    return <Badge className="bg-black text-white">{dataset.price} ETH</Badge>
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }


  // 初始加载所有数据集
  useEffect(() => {
    loadAllDatasets()
  }, [])

  // 当筛选条件改变时，重新筛选
  useEffect(() => {
    if (allDatasets.length > 0) {
      filterAndSortDatasets()
    }
  }, [allDatasets, activeSearchQuery, categoryFilter, startDate, endDate, downloadSortOrder, priceSortOrder, createdAtSortOrder, authorsMap])

  // 当筛选结果或当前页改变时，更新分页
  useEffect(() => {
    paginateDatasets()
  }, [filteredDatasets, currentPage])

  return (
    <RoleGuard requiredRole="admin">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader title="数据集管理" description="查看和管理平台所有数据集" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 space-y-6">
          {/* 搜索和筛选控件 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                搜索和筛选
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="搜索数据集标题、描述或作者..."
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value
                        setSearchQuery(value)
                        // 如果输入框被清空，立即清除搜索筛选
                        if (value.trim() === "" && activeSearchQuery !== "") {
                          setActiveSearchQuery("")
                          setCurrentPage(1)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch()
                        }
                      }}
                    />
                    {/* 清除按钮 */}
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 cursor-pointer"
                        onClick={() => {
                          setSearchQuery("")
                          setActiveSearchQuery("")
                          setCurrentPage(1)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* 开始日期选择器 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-[200px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "yyyy年MM月dd日", { locale: zhCN }) : "开始日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => handleDateRangeChange(date, endDate)}
                        locale={zhCN}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* 结束日期选择器 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-[200px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "yyyy年MM月dd日", { locale: zhCN }) : "结束日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => handleDateRangeChange(startDate, date)}
                        locale={zhCN}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* 清除日期筛选按钮 */}
                  {(startDate || endDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateRangeChange(undefined, undefined)}
                      className="h-10 cursor-pointer"
                    >
                      <X className="h-4 w-4 mr-1" />
                      清除日期
                    </Button>
                  )}
                  
                  <Button onClick={handleSearch} disabled={loading} className="cursor-pointer">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    搜索
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数据集表格 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                数据集列表
                <Badge variant="outline" className="ml-2">
                  共 {filteredDatasets.length} 个数据集
                </Badge>
              </CardTitle>
              <CardDescription>平台所有数据集的详细信息和管理操作</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">加载数据集列表...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>数据集</TableHead>
                        <TableHead>作者</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            分类
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  title="筛选分类"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                  </svg>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40" align="start">
                                <div className="space-y-2">
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer ${categoryFilter === "all" ? "bg-accent" : ""}`}
                                    onClick={() => handleCategoryFilterChange("all")}
                                  >
                                    所有分类
                                  </button>
                                  {categories.map((category) => (
                                    <button
                                      key={category}
                                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer ${categoryFilter === category ? "bg-accent" : ""}`}
                                      onClick={() => handleCategoryFilterChange(category)}
                                    >
                                      {category}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            价格
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 cursor-pointer"
                              onClick={handlePriceSortToggle}
                              title={
                                priceSortOrder === null ? "点击排序" :
                                priceSortOrder === "desc" ? "当前降序，点击切换为升序" : 
                                "当前升序，点击取消排序"
                              }
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            下载量
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 cursor-pointer"
                              onClick={handleDownloadSortToggle}
                              title={
                                downloadSortOrder === null ? "点击排序" :
                                downloadSortOrder === "desc" ? "当前降序，点击切换为升序" : 
                                "当前升序，点击取消排序"
                              }
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            创建时间
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 cursor-pointer"
                              onClick={handleCreatedAtSortToggle}
                              title={createdAtSortOrder === "desc" ? "当前降序，点击切换为升序" : "当前升序，点击切换为降序"}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDatasets.length > 0 ? (
                        paginatedDatasets.map((dataset) => (
                        <TableRow key={dataset.id}>
                          <TableCell>
                            <div className="max-w-xs">
                              <Link
                                href={`/datasets/${dataset.id}`}
                                className="font-medium hover:text-primary block truncate"
                                title={dataset.title}
                              >
                                {dataset.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(dataset.fileSize ?? 0)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {authorsMap[dataset.authorWalletAddress] ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={apiMinio + authorsMap[dataset.authorWalletAddress].avatarUrl || "/placeholder.svg"}
                                    alt={authorsMap[dataset.authorWalletAddress].username}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {authorsMap[dataset.authorWalletAddress].username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{authorsMap[dataset.authorWalletAddress].username}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {dataset.authorWalletAddress?.slice(0, 6)}...{dataset.authorWalletAddress?.slice(-4)}
                                </code>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {dataset.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{getPriceBadge(dataset)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Download className="h-4 w-4 text-green-600" />
                              <span>{dataset.downloadCount?.toLocaleString() ?? 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(dataset.createdAt ?? '')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedDataset(dataset)} className="cursor-pointer">
                                    <Eye className="h-4 w-4" />
                                    查看详情
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle>数据集详情</DialogTitle>
                                    <DialogDescription>查看数据集的完整信息和预览数据</DialogDescription>
                                  </DialogHeader>

                                  {selectedDataset && (
                                    <div className="space-y-4 overflow-y-auto pr-2">
                                      {/* Basic Info */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">标题</label>
                                          <p className="text-sm mt-1">{selectedDataset.title}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">作者</label>
                                          {authorsMap[selectedDataset.authorWalletAddress] ? (
                                            <div className="flex items-center gap-2 mt-1">
                                              <Avatar className="h-6 w-6">
                                                <AvatarImage
                                                  src={apiMinio + authorsMap[selectedDataset.authorWalletAddress].avatarUrl || "/placeholder.svg"}
                                                  alt={authorsMap[selectedDataset.authorWalletAddress].username}
                                                />
                                                <AvatarFallback className="text-xs">
                                                  {authorsMap[selectedDataset.authorWalletAddress].username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="text-sm font-medium">{authorsMap[selectedDataset.authorWalletAddress].username}</p>
                                                <code className="text-xs text-muted-foreground">
                                                  {selectedDataset.authorWalletAddress?.slice(0, 6)}...{selectedDataset.authorWalletAddress?.slice(-4)}
                                                </code>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="mt-1">
                                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {selectedDataset.authorWalletAddress}
                                              </code>
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">分类</label>
                                          <div className="mt-1">
                                            <Badge variant="outline">{selectedDataset.category}</Badge>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">价格</label>
                                          <div className="mt-1">{getPriceBadge(selectedDataset)}</div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">许可证</label>
                                          <p className="text-sm mt-1">{selectedDataset.license ?? 'N/A'}</p>
                                        </div>
                                      </div>

                                      {/* Description */}
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">描述</label>
                                        <p className="text-sm mt-1 leading-relaxed line-clamp-3">{selectedDataset.description}</p>
                                      </div>

                                      {/* Tags */}
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">标签</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {(() => {
                                            // 兼容tags为逗号分隔字符串或数组
                                            let tagsArray: string[] = [];
                                            const tags = selectedDataset.tags as any;
                                            if (typeof tags === 'string') {
                                              tagsArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
                                            } else if (Array.isArray(tags)) {
                                              tagsArray = tags;
                                            }
                                            return tagsArray.map((tag, index) => (
                                              <Badge key={index} variant="secondary" className="text-xs">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag}
                                              </Badge>
                                            ));
                                          })()}
                                        </div>
                                      </div>

                                      {/* Statistics */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <Card>
                                          <CardContent className="pt-3 pb-3">
                                            <div className="flex items-center gap-2">
                                              <Download className="h-4 w-4 text-green-600" />
                                              <span className="text-sm font-medium">下载量</span>
                                            </div>
                                            <p className="text-xl font-bold mt-1">{selectedDataset.downloadCount ?? 0}</p>
                                          </CardContent>
                                        </Card>
                                        <Card>
                                          <CardContent className="pt-3 pb-3">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-blue-600" />
                                              <span className="text-sm font-medium">文件大小</span>
                                            </div>
                                            <p className="text-xl font-bold mt-1">
                                              {formatFileSize(selectedDataset.fileSize ?? 0)}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </div>


                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button asChild variant="outline" className="cursor-pointer">
                                          <ProgressLink href={`/datasets/${selectedDataset.id}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            查看完整页面
                                          </ProgressLink>
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          onClick={() => {
                                            // Admin download uses different API endpoint without fingerprint processing
                                            window.open(`/api/admin/datasets/${selectedDataset.id}/download`, "_blank")
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Download className="h-4 w-4 mr-2" />
                                          下载数据集
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" disabled={deleteLoading} className="cursor-pointer">
                                    强制下架
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-red-600" />
                                      确认强制下架数据集
                                    </AlertDialogTitle>
                                    {wallet.address?.toLowerCase() !== adminWalletAddress?.toLowerCase() ? (
                                      <div className="space-y-2">
                                        <AlertDialogDescription className="text-red-600 font-medium">
                                          ⚠️ 权限不足
                                        </AlertDialogDescription>
                                        <p className="text-sm text-muted-foreground">
                                          只有管理员钱包地址才能执行强制下架操作。
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          当前钱包: {wallet.address || '未连接'}
                                        </p>
                                      </div>
                                    ) : (
                                      <AlertDialogDescription>
                                        您确定要强制下架数据集 "{dataset.title}" 吗？
                                        {dataset.isFree 
                                          ? "此操作将在数据库中删除该免费数据集，不可撤销。"
                                          : "此操作将同时在链上和数据库中删除该付费数据集，不可撤销。"
                                        }
                                      </AlertDialogDescription>
                                    )}
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="cursor-pointer">取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDataset(dataset)}
                                      className="bg-red-600 hover:bg-red-700 cursor-pointer"
                                      disabled={deleteLoading || wallet.address?.toLowerCase() !== adminWalletAddress?.toLowerCase()}
                                    >
                                      {deleteLoading ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          下架中...
                                        </>
                                      ) : (
                                        "确认下架"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                              {activeSearchQuery || categoryFilter !== "all"
                                ? "没有找到符合条件的数据集"
                                : "暂无数据集"}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {paginatedDatasets.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        显示第 {(currentPage - 1) * pageSize + 1} -{" "}
                        {Math.min(currentPage * pageSize, filteredDatasets.length)} 条， 共 {filteredDatasets.length} 条记录
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="cursor-pointer"
                        >
                          上一页
                        </Button>
                        <span className="text-sm">
                          第 {currentPage} / {totalPages} 页
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="cursor-pointer"
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
