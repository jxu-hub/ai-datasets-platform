"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { RoleGuard } from "@/components/guards/RoleGuard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { detectFingerprint, getFingerprintHistory } from "@/contexts/AdminContext"
import type { FingerprintDetectionResult, FingerprintHistoryItem, PaginatedResponse } from "@/types"
import { formatFileSize } from "@/lib/utils"
import ProgressLink from "@/components/system/ProgressLink"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Shield,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  History,
  Loader2,
  Eye,
  ArrowUpDown,
  X,
  Calendar as CalendarIcon,
} from "lucide-react"

export default function AdminFingerprintPage() {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [detectionResult, setDetectionResult] = useState<FingerprintDetectionResult | null>(null)
  const [detectionHistory, setDetectionHistory] = useState<PaginatedResponse<FingerprintHistoryItem> | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearchQuery, setActiveSearchQuery] = useState("") // 实际用于筛选的搜索词
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [timeSortOrder, setTimeSortOrder] = useState<"asc" | "desc">("desc")

  // 判断是否检测到指纹（matchResult不是"无指纹"则表示有指纹）
  const hasFingerprint = (matchResult: string) => {
    return matchResult && matchResult !== "无指纹"
  }

  // 处理文件选择
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 验证文件类型 (只支持 JSONL 格式)
      if (!file.name.toLowerCase().endsWith(".jsonl")) {
        setError("只支持 JSONL 格式的文件")
        return
      }

      setSelectedFile(file)
      setError("")
      setDetectionResult(null)
    }
  }, [])

  // 处理文件拖拽
  const handleFileDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file) {
        // 创建一个合成事件来重用文件选择逻辑
        const syntheticEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileSelect(syntheticEvent)
      }
    },
    [handleFileSelect],
  )

  // 阻止默认的拖拽行为
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  // 开始指纹检测
  const startDetection = async () => {
    if (!selectedFile) return

    setDetecting(true)
    setError("")
    setUploadProgress(0)

    try {
      console.log("开始指纹检测:", selectedFile.name)

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await detectFingerprint(selectedFile)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setDetectionResult(result)
      toast.success("指纹检测完成")
      
      // 检测后刷新历史记录
      loadDetectionHistory()
    } catch (err: any) {
      console.error("指纹检测失败:", err)
      setError(err.message || "指纹检测失败")
      toast.error(err.message || "指纹检测失败")
    } finally {
      setDetecting(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  // 加载检测历史记录
  const loadDetectionHistory = async () => {
    setHistoryLoading(true)

    try {
      console.log("加载指纹检测历史记录")

      const response = await getFingerprintHistory({
        page: 1,
        limit: 20,
      })

      setDetectionHistory(response)
    } catch (err: any) {
      console.error("加载检测历史失败:", err)
      setError(err.message || "加载检测历史失败")
      toast.error(err.message || "加载检测历史失败")
    } finally {
      setHistoryLoading(false)
    }
  }



  // 格式化检测耗时
  const formatDetectionTime = (time: string) => {
    if (!time || time === "0" || time === "0s" || time === "0ms") {
      return "<1ms"
    }
    return time
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 过滤和排序历史记录
  const getFilteredAndSortedHistory = () => {
    if (!detectionHistory?.items) return []

    let filtered = [...detectionHistory.items]

    // 搜索过滤（文件名或检测结果地址）- 使用 activeSearchQuery
    if (activeSearchQuery.trim()) {
      const query = activeSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.filename.toLowerCase().includes(query) ||
          item.detectionResult.toLowerCase().includes(query)
      )
    }

    // 时间范围过滤
    if (startDate) {
      filtered = filtered.filter((item) => new Date(item.createdAt) >= startDate)
    }
    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      filtered = filtered.filter((item) => new Date(item.createdAt) <= endOfDay)
    }

    // 时间排序
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return timeSortOrder === "asc" ? dateA - dateB : dateB - dateA
    })

    return filtered
  }

  const filteredHistory = getFilteredAndSortedHistory()

  useEffect(() => {
    loadDetectionHistory()
  }, [])

  return (
    <RoleGuard requiredRole="admin">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader title="指纹检测系统" description="检测数据集指纹，识别潜在的盗版和重复内容" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          <Tabs defaultValue="detection" className="space-y-6">
            <TabsList>
              <TabsTrigger value="detection" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                指纹检测
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                检测历史
              </TabsTrigger>
            </TabsList>

            {/* 检测标签 */}
            <TabsContent value="detection" className="space-y-6">
              {/* 文件上传 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    上传文件进行检测
                  </CardTitle>
                  <CardDescription>
                    上传 JSONL 格式的数据集文件，系统将分析其指纹特征并与现有数据集进行比对
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 文件拖拽区域 */}
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                    >
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium">拖拽文件到此处或点击选择</p>
                        <p className="text-sm text-muted-foreground">支持 JSONL 格式</p>
                      </div>
                      <input
                        type="file"
                        accept=".jsonl"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" className="mt-4 bg-transparent" asChild>
                          <span className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            选择文件
                          </span>
                        </Button>
                      </label>
                    </div>

                    {/* 选择的文件信息 */}
                    {selectedFile && (
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-blue-600" />
                              <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                              </div>
                            </div>
                            <Button
                              onClick={startDetection}
                              disabled={detecting}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {detecting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  检测中...
                                </>
                              ) : (
                                <>
                                  <Search className="h-4 w-4 mr-2" />
                                  开始检测
                                </>
                              )}
                            </Button>
                          </div>

                          {/* 上传进度 */}
                          {detecting && uploadProgress > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span>上传进度</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <Progress value={uploadProgress} className="h-2" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* 检测结果 */}
                    {detectionResult && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {hasFingerprint(detectionResult.matchResult) ? (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            检测结果
                          </CardTitle>
                          <CardDescription>
                            检测耗时: {formatDetectionTime(detectionResult.detectionTime)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground mb-2">检测状态</p>
                                  <p className={`text-2xl font-bold ${hasFingerprint(detectionResult.matchResult) ? "text-red-600" : "text-green-600"}`}>
                                    {hasFingerprint(detectionResult.matchResult) ? "检测到指纹" : "未检测到指纹"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {hasFingerprint(detectionResult.matchResult) ? "该文件与现有数据集存在指纹匹配" : "该文件未与任何现有数据集匹配"}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground mb-2">指纹地址</p>
                                  {hasFingerprint(detectionResult.matchResult) ? (
                                    <div className="space-y-2">
                                      <p 
                                        className="text-sm font-mono bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80 break-all"
                                        onClick={() => {
                                          navigator.clipboard.writeText(detectionResult.matchResult)
                                          toast.success("地址已复制")
                                        }}
                                        title="点击复制"
                                      >
                                        {detectionResult.matchResult}
                                      </p>
                                      <p className="text-xs text-muted-foreground">点击复制地址</p>
                                    </div>
                                  ) : (
                                    <p className="text-lg text-muted-foreground">-</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 历史标签 */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    检测历史记录
                    {detectionHistory && (
                      <Badge variant="outline" className="ml-2">
                        共 {filteredHistory.length} / {detectionHistory.total} 条记录
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>查看所有指纹检测的历史记录和结果</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 搜索和筛选区域 */}
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-4">
                      {/* 搜索框 */}
                      <div className="flex-1 relative">
                        <Input
                          placeholder="搜索文件名或指纹地址..."
                          value={searchQuery}
                          onChange={(e) => {
                            const value = e.target.value
                            setSearchQuery(value)
                            // 如果输入框被清空，立即清除搜索筛选
                            if (value.trim() === "" && activeSearchQuery !== "") {
                              setActiveSearchQuery("")
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setActiveSearchQuery(searchQuery)
                            }
                          }}
                        />
                        {/* 清除按钮 */}
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => {
                              setSearchQuery("")
                              setActiveSearchQuery("")
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* 开始日期 */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP", { locale: zhCN }) : "开始日期"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            locale={zhCN}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      {/* 结束日期 */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP", { locale: zhCN }) : "结束日期"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            locale={zhCN}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      {/* 搜索按钮 */}
                      <Button onClick={() => setActiveSearchQuery(searchQuery)} disabled={historyLoading}>
                        {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        搜索
                      </Button>

                      {/* 清除筛选 */}
                      {(activeSearchQuery || startDate || endDate) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("")
                            setActiveSearchQuery("")
                            setStartDate(undefined)
                            setEndDate(undefined)
                          }}
                        >
                          清除筛选
                        </Button>
                      )}
                    </div>
                  </div>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">加载检测历史...</span>
                    </div>
                  ) : filteredHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>文件名</TableHead>
                          <TableHead>文件大小</TableHead>
                          <TableHead>检测耗时</TableHead>
                          <TableHead>数据集ID</TableHead>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              检测时间
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setTimeSortOrder(timeSortOrder === "asc" ? "desc" : "asc")}
                              >
                                <ArrowUpDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableHead>
                          <TableHead>检测结果</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{item.filename}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{formatFileSize(item.fileSize)}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{formatDetectionTime(item.detectionTime)}</span>
                            </TableCell>
                            <TableCell>
                              {item.datasetID ? (
                                <ProgressLink href={`/datasets/${item.datasetID}`}>
                                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                                    <Eye className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700">{item.datasetID}</span>
                                  </div>
                                </ProgressLink>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(item.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasFingerprint(item.detectionResult) ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 mb-1">
                                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                                    <span className="text-xs text-orange-600 font-medium">检测到指纹</span>
                                  </div>
                                  <div>
                                    <span 
                                      className="font-mono text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200 cursor-pointer hover:bg-orange-100"
                                      onClick={() => {
                                        navigator.clipboard.writeText(item.detectionResult)
                                        toast.success("地址已复制")
                                      }}
                                      title={item.detectionResult}
                                    >
                                      {item.detectionResult.length > 10
                                        ? `${item.detectionResult.slice(0, 6)}...${item.detectionResult.slice(-4)}`
                                        : item.detectionResult
                                      }
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">未检测到指纹</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchQuery || startDate || endDate ? "未找到符合条件的记录" : "暂无检测历史记录"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  )
}
