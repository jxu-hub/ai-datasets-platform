"use client"

import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/guards/RoleGuard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { getMinIOBuckets, getMinIOObjects, deleteMinIOObject, processOutboxTasks } from "@/contexts/AdminContext"
import type { MinIOBucket, MinIOObject, MinIOListResponse } from "@/types"
import {
  File,
  Trash2,
  RefreshCw,
  Loader2,
  HardDrive,
  Search,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminStoragePage() {
  const [buckets, setBuckets] = useState<MinIOBucket[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>("")
  const [allObjects, setAllObjects] = useState<MinIOObject[]>([]) // 存储所有文件（从后端获取）
  const [filteredObjects, setFilteredObjects] = useState<MinIOObject[]>([]) // 筛选后的文件
  const [paginatedObjects, setPaginatedObjects] = useState<MinIOObject[]>([]) // 当前页显示的文件
  const [loading, setLoading] = useState(true)
  const [loadingObjects, setLoadingObjects] = useState(false)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // 加载存储桶列表
  const loadBuckets = async () => {
    setLoading(true)
    setError("")
    try {
      const bucketList = await getMinIOBuckets()
      setBuckets(bucketList)
      if (bucketList.length > 0 && !selectedBucket) {
        setSelectedBucket(bucketList[0].name)
      }
    } catch (err: any) {
      console.error("加载存储桶列表失败:", err)
      setError(err.message || "加载存储桶列表失败")
      toast.error(err.message || "加载存储桶列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 加载文件列表（获取所有文件，不分页）
  const loadObjects = async (bucket: string) => {
    if (!bucket) return

    setLoadingObjects(true)
    setError("")
    try {
      // 后端返回所有文件，不分页
      const response = await getMinIOObjects({
        bucket,
        page: 1,
        limit: 10000, // 设置一个很大的limit来获取所有文件
      })
      setAllObjects(response.objects)
    } catch (err: any) {
      console.error("加载文件列表失败:", err)
      setError(err.message || "加载文件列表失败")
      toast.error(err.message || "加载文件列表失败")
    } finally {
      setLoadingObjects(false)
    }
  }

  // 前端筛选和分页逻辑
  const filterAndPaginateObjects = () => {
    let filtered = [...allObjects]

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((obj) => {
        const fileName = obj.name.split("/").pop() || obj.name
        return fileName.toLowerCase().includes(query) || obj.name.toLowerCase().includes(query)
      })
    }

    setFilteredObjects(filtered)

    // 计算总页数
    const pages = Math.ceil(filtered.length / pageSize)
    setTotalPages(pages)

    // 如果当前页超出范围，重置到第一页
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1)
    }

    // 分页
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedObjects(filtered.slice(startIndex, endIndex))
  }

  // 处理存储桶切换
  const handleBucketChange = (bucketName: string) => {
    setSelectedBucket(bucketName)
    setCurrentPage(1)
    setSearchQuery("")
    setAllObjects([])
  }

  // 处理删除文件
  const handleDelete = async (objectName: string) => {
    if (!selectedBucket) return

    setDeleteLoading(objectName)
    try {
      await deleteMinIOObject(selectedBucket, objectName)
      toast.success("文件删除成功")
      // 从allObjects中删除该文件
      setAllObjects(allObjects.filter((obj) => obj.name !== objectName))
    } catch (err: any) {
      console.error("删除文件失败:", err)
      toast.error(err.message || "删除文件失败")
    } finally {
      setDeleteLoading(null)
    }
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
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 获取文件扩展名
  const getFileExtension = (fileName: string) => {
    const parts = fileName.split(".")
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
  }

  // 初始加载
  useEffect(() => {
    loadBuckets()
  }, [])

  // 当存储桶改变时，重新加载文件列表
  useEffect(() => {
    if (selectedBucket) {
      loadObjects(selectedBucket)
    }
  }, [selectedBucket])

  // 当筛选条件或页码改变时，重新筛选和分页
  useEffect(() => {
    if (allObjects.length > 0) {
      filterAndPaginateObjects()
    }
  }, [allObjects, searchQuery, currentPage])

  return (
    <RoleGuard requiredRole="admin">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader title="MinIO存储管理" description="查看和管理MinIO存储桶中的文件" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 space-y-6">
          {/* 存储桶选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                存储桶选择
              </CardTitle>
              <CardDescription>选择要查看的存储桶</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedBucket} onValueChange={handleBucketChange} disabled={loading}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="选择存储桶" />
                  </SelectTrigger>
                  <SelectContent>
                    {buckets.map((bucket) => (
                      <SelectItem key={bucket.name} value={bucket.name}>
                        {bucket.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => loadBuckets()} variant="outline" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  刷新
                </Button>
                <Button onClick={async () => {
                  try {
                    await processOutboxTasks()
                    toast.success("已触发异步删除任务处理")
                  } catch (err: any) {
                    toast.error(err.message || "触发任务失败")
                  }
                }}>
                  处理删除任务
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 文件列表 */}
          {selectedBucket && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  文件列表
                </CardTitle>
                <CardDescription>
                  存储桶: {selectedBucket}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 搜索框 */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索文件名..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1) // 搜索时重置到第一页
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loadingObjects ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">加载文件列表...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>名称</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>大小</TableHead>
                          <TableHead>修改时间</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedObjects.length > 0 ? (
                          paginatedObjects.map((obj) => (
                            <TableRow key={obj.name}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <File className="h-4 w-4 text-gray-500" />
                                  <span className="text-left">
                                    {obj.name.split("/").pop() || obj.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{getFileExtension(obj.name) || "文件"}</Badge>
                              </TableCell>
                              <TableCell>
                                {formatFileSize(obj.size)}
                              </TableCell>
                              <TableCell>{formatDate(obj.lastModified)}</TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deleteLoading === obj.name}
                                    >
                                      {deleteLoading === obj.name ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>确认删除文件</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        您确定要删除文件 "{obj.name}" 吗？此操作不可撤销。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>取消</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(obj.name)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        确认删除
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12">
                              <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">
                                {searchQuery ? "没有找到匹配的文件" : "当前存储桶为空"}
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* 分页 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          显示第 {(currentPage - 1) * pageSize + 1} -{" "}
                          {Math.min(currentPage * pageSize, filteredObjects.length)} 条，共 {filteredObjects.length} 条记录
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
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
                            onClick={() => setCurrentPage(currentPage + 1)}
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
          )}
        </div>
      </div>
    </RoleGuard>
  )
}

