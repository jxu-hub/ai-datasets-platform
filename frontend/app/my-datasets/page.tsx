"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getAuthorDatasets, getAuthorDatasetStats } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Download,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Calendar,
} from "lucide-react"
import ProgressLink from "@/components/system/ProgressLink"
import type { Dataset, DatasetStats } from "@/types"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getWritableContract } from '@/contract/contractConnect'
import { toast } from 'sonner'

export default function MyDatasetsPage() {
  const { user } = useAuth()

  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [stats, setStats] = useState<DatasetStats | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [deleting, setDeleting] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 5  
  const [datasetType, setDatasetType] = useState<'all' | 'free' | 'paid'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 根据筛选类型过滤数据集
  const filteredDatasets = datasets.filter(d => {
    if (datasetType === 'free') return d.isFree
    if (datasetType === 'paid') return !d.isFree
    return true
  })
  const pagedDatasets = filteredDatasets.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filteredDatasets.length / pageSize)

  const [editOpen, setEditOpen] = useState(false)
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '' })
  const [editLoading, setEditLoading] = useState(false)

  // 加载用户的数据集
  const loadMyDatasets = async () => {
    if (!user || !user.walletAddress) {
      setError("用户未绑定钱包地址")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getAuthorDatasets(user.walletAddress, 1, 1000)
      if (result && result.items) {
        // 转换数据格式以匹配前端类型
        const formattedDatasets = result.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',') : item.tags) : [],
          price: item.price || 0,
          isFree: item.isFree || item.is_free || false,
          fileSize: item.fileSize || item.file_size || 0,
          authorWalletAddress: item.authorWalletAddress || item.author_wallet_address || '',
          downloadCount: item.downloadCount || item.download_count || 0,
          license: item.license || '',
          createdAt: item.createdAt || item.created_at || '',
          updatedAt: item.updatedAt || item.updated_at || '',
          objectName: item.objectName || item.object_name || '',
        }))
        setDatasets(formattedDatasets)
      } else {
        setDatasets([])
      }
    } catch (err: any) {
      setError(err.message || "加载数据集失败")
      setDatasets([])
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    if (!user || !user.walletAddress) return

    try {
      const result = await getAuthorDatasetStats(user.walletAddress)
      if (result) {
        setStats(result)
      }
    } catch (err: any) {
      console.error("加载统计信息失败:", err)
    }
  }

  // 替换 handleDelete 逻辑
  const handleDelete = async (datasetId: number) => {
    if (!confirm("确定要下架（删除）这个数据集吗？此操作不可撤销。")) {
      return
    }
    setDeleting(datasetId)
    try {
      const contract = await getWritableContract()
      const tx = await contract.deactivateDataset(datasetId)
      await tx.wait()
      toast.success('数据集已成功下架（链上）')
      setDatasets((prev) => prev.filter((d) => d.id !== datasetId))
      loadStats()
    } catch (err: any) {
      toast.error('下架失败: ' + (err?.reason || err?.message || '未知错误'))
    }
    setDeleting(null)
  }

  // 打开编辑弹窗
  const handleEditOpen = (dataset: Dataset) => {
    setEditingDataset(dataset)
    setEditForm({
      title: dataset.title,
      description: dataset.description,
      price: dataset.price.toString(),
    })
    setEditOpen(true)
  }

  // 编辑表单提交
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDataset) return
    setEditLoading(true)
    try {
      const contract = await getWritableContract()
      const tx = await contract.updateDataset(
        editingDataset.id,
        editForm.title,
        editForm.description,
        Number(editForm.price)
      )
      await tx.wait()
      toast.success('数据集已成功更新（链上）')
      // 本地同步更新
      setDatasets((prev) => prev.map((d) => d.id === editingDataset.id ? { ...d, ...editForm, price: Number(editForm.price) } : d))
      setEditOpen(false)
    } catch (err: any) {
      toast.error('更新失败: ' + (err?.reason || err?.message || '未知错误'))
    } finally {
      setEditLoading(false)
    }
  }

  useEffect(() => {
    loadMyDatasets()
    loadStats()
  }, [user])

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <ProtectedRoute requireAuth requireRole="seller">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <PageHeader title="我的数据集" description="管理您上传的数据集，查看销售统计和用户反馈" />
          <Button asChild>
            <ProgressLink href="/upload">
              <Plus className="mr-2 h-4 w-4" />
              上传新数据集
            </ProgressLink>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="datasets">数据集管理</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总数据集</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalDatasets || 0}</div>
                  <p className="text-xs text-muted-foreground">已上传的数据集数量</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总下载量</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalDownloads?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">累计下载次数</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总收益</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalRevenue?.toFixed(3) || 0} ETH</div>
                  <p className="text-xs text-muted-foreground">累计销售收益</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Datasets */}
            <Card>
              <CardHeader>
                <CardTitle>最近上传的数据集</CardTitle>
                <CardDescription>查看您最近上传的数据集状态</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">加载中...</span>
                  </div>
                ) : datasets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">您还没有上传任何数据集</p>
                    <Button asChild>
                      <ProgressLink href="/upload">
                        <Plus className="mr-2 h-4 w-4" />
                        上传第一个数据集
                      </ProgressLink>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {datasets.slice(0, 5).map((dataset) => (
                      <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{dataset.title}</h3>
                            <Badge
                              variant={dataset.isFree ? "secondary" : "default"}
                              className={dataset.isFree ? "" : "bg-black text-white"}
                            >
                              {dataset.isFree ? "免费" : `${dataset.price} ETH`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {dataset.downloadCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(dataset.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <ProgressLink href={`/datasets/${dataset.id}`}>
                              <Eye className="h-3 w-3" />
                            </ProgressLink>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>数据集管理</CardTitle>
                <CardDescription>管理您上传的所有数据集</CardDescription>
              </CardHeader>
              <CardContent>
                {/* 筛选Tab */}
                <div className="mb-4 flex gap-2">
                  <Button variant={datasetType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setDatasetType('all'); setPage(1) }}>全部</Button>
                  <Button variant={datasetType === 'free' ? 'default' : 'outline'} size="sm" onClick={() => { setDatasetType('free'); setPage(1) }}>免费</Button>
                  <Button variant={datasetType === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => { setDatasetType('paid'); setPage(1) }}>付费</Button>
                </div>
                {/* 原有 loading/空/列表逻辑，datasets 替换为 pagedDatasets，分页用 totalPages/filteredDatasets.length */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">加载中...</span>
                  </div>
                ) : filteredDatasets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">没有符合条件的数据集</p>
                    <Button asChild>
                      <ProgressLink href="/upload">
                        <Plus className="mr-2 h-4 w-4" />
                        上传第一个数据集
                      </ProgressLink>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6">
                      {pagedDatasets.map((dataset) => (
                        <Card key={dataset.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold">{dataset.title}</h3>
                                  <Badge
                                    variant={dataset.isFree ? "secondary" : "default"}
                                    className={dataset.isFree ? "" : "bg-black text-white"}
                                  >
                                    {dataset.isFree ? "免费" : `${dataset.price} ETH`}
                                  </Badge>
                                  <Badge variant="outline">{dataset.category}</Badge>
                                </div>
                                <p className="text-muted-foreground mb-4 line-clamp-2">{dataset.description}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {dataset.tags.slice(0, 5).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">下载量:</span>
                                    <span className="ml-1 font-medium">{dataset.downloadCount}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">大小:</span>
                                    <span className="ml-1 font-medium">{formatFileSize(dataset.fileSize)}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">许可:</span>
                                    <span className="ml-1 font-medium">{dataset.license}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button asChild size="sm" variant="outline">
                                  <ProgressLink href={`/datasets/${dataset.id}`}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    查看
                                  </ProgressLink>
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleEditOpen(dataset)}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  编辑
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(dataset.id)}
                                  disabled={deleting === dataset.id}
                                >
                                  {deleting === dataset.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 mr-1" />
                                  )}
                                  删除
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {/* 分页控件 */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={page > 1 ? () => setPage(page - 1) : undefined}
                                aria-disabled={page === 1}
                                tabIndex={page === 1 ? -1 : 0}
                              >
                                <span>上一页</span>
                              </PaginationPrevious>
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  isActive={page === i + 1}
                                  onClick={() => setPage(i + 1)}
                                >
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={page < totalPages ? () => setPage(page + 1) : undefined}
                                aria-disabled={page === totalPages}
                                tabIndex={page === totalPages ? -1 : 0}
                              >
                                <span>下一页</span>
                              </PaginationNext>
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑数据集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">标题</label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">描述</label>
              <Textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">价格（ETH）</label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={editForm.price}
                onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>取消</Button>
              <Button type="submit" disabled={editLoading}>{editLoading ? '保存中...' : '保存'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
