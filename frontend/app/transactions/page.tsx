"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getUserTransactions, getUserDownloadRecords } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Receipt,
  Download,
  ExternalLink,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react"
import { formatFileSize } from "@/lib/utils"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: "purchase" | "download"
  dataset: {
    id: number
    title: string
    price: number
    is_free: boolean
    size: number // 数据集大小（字节）
  }
  amount: number
  status: "completed" | "pending" | "failed"
  tx_hash?: string
  created_at: string
  updated_at: string
  block_number?: number // 区块高度
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [downloadRecords, setDownloadRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")

  // 加载交易记录和下载记录
  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true)
    setError("")

    try {
      // 并行加载购买记录和下载记录
      const [purchaseData, downloadData] = await Promise.all([
        getUserTransactions(),
        getUserDownloadRecords()
      ]);

      // 处理购买记录
      const formattedTransactions: Transaction[] = (purchaseData || []).map((tx: any) => ({
        id: tx.id?.toString() || tx.ID?.toString(),
        type: "purchase" as const,
        dataset: {
          id: tx.dataset_id || tx.datasetId,
          title: tx.dataset_title || tx.datasetTitle || "未知数据集",
          price: parseFloat(tx.amount || 0),
          is_free: false,
          size: tx.dataset_size || tx.datasetSize || 0,
        },
        amount: parseFloat(tx.amount || 0),
        status: tx.status === "completed" ? "completed" : tx.status === "pending" ? "pending" : "failed",
        tx_hash: tx.tx_hash || tx.txHash,
        created_at: tx.created_at || tx.createdAt,
        updated_at: tx.updated_at || tx.updatedAt,
        block_number: tx.block_number || tx.blockNumber,
      }));

      setTransactions(formattedTransactions);
      setDownloadRecords(downloadData || []);
    } catch (err: any) {
      console.error("加载交易记录失败:", err)
      setError(err.message || "加载交易记录失败，请稍后重试")
      toast.error("加载交易记录失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadTransactions()
    }
  }, [user?.id])

  // 过滤交易记录
  const filteredTransactions = transactions.filter((tx) => {
    if (filter !== "all" && tx.status !== filter) return false
    return true
  })

  // 获取状态徽章
  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            已完成
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            处理中
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            失败
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 获取类型徽章
  const getTypeBadge = (type: Transaction["type"]) => {
    switch (type) {
      case "purchase":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <DollarSign className="w-3 h-3 mr-1" />
            购买
          </Badge>
        )
      case "download":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Download className="w-3 h-3 mr-1" />
            下载
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  // 计算统计数据
  const purchaseCount = transactions.length;
  const downloadCount = downloadRecords.length;
  const stats = {
    total: purchaseCount + downloadCount,
    purchases: purchaseCount,
    downloads: downloadCount,
    totalSpent: transactions
      .filter((tx) => tx.status === "completed")
      .reduce((sum, tx) => sum + tx.amount, 0),
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <PageHeader title="交易记录" description="查看您的购买和下载历史记录" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">总记录数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.purchases}</div>
                <p className="text-xs text-muted-foreground">购买记录</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.downloads}</div>
                <p className="text-xs text-muted-foreground">下载记录</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalSpent} ETH</div>
                <p className="text-xs text-muted-foreground">总消费</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs 只保留购买记录和下载记录 */}
          <Tabs defaultValue="purchases" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="purchases">购买记录</TabsTrigger>
                <TabsTrigger value="downloads">下载记录</TabsTrigger>
              </TabsList>

              {/* 右侧筛选器 */}
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="pending">处理中</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    购买记录
                  </CardTitle>
                  <CardDescription>您的付费数据集购买历史</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : filteredTransactions.filter((tx) => tx.type === "purchase").length === 0 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">暂无购买记录</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTransactions
                        .filter((tx) => tx.type === "purchase")
                        .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">
                                <a
                                  href={`/datasets/${transaction.dataset.id}`}
                                  className="hover:text-primary hover:underline cursor-pointer"
                                >
                                  {transaction.dataset.title}
                                </a>
                              </h3>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(transaction.created_at).toLocaleString()}
                              </span>
                                {transaction.tx_hash && (
                                <a
                                    href={`https://etherscan.io/tx/${transaction.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                    <code className="text-xs">{transaction.tx_hash.slice(0, 10)}...</code>
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                                {transaction.amount > 0 ? `${transaction.amount} ETH` : "免费"}
                            </div>
                              <div className="text-xs text-muted-foreground">区块高度: {transaction.block_number}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="downloads">
              <Card>
                <CardHeader>
                  <CardTitle>下载记录</CardTitle>
                  <CardDescription>您的数据集下载历史</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : downloadRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">暂无下载记录</p>
                    </div>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>数据集</TableHead>
                        <TableHead>类型</TableHead>
                          <TableHead>大小</TableHead>
                          <TableHead>下载次数</TableHead>
                        <TableHead>时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {downloadRecords.map((record: any) => (
                          <TableRow key={record.id || record.ID}>
                            <TableCell className="font-medium">
                              <a
                                href={`/datasets/${record.dataset_id || record.datasetId}`}
                                className="hover:text-primary hover:underline cursor-pointer"
                              >
                                {record.dataset_title || record.datasetTitle || "未知数据集"}
                              </a>
                            </TableCell>
                            <TableCell>
                              {(record.type === 1 || record.is_free) ? (
                                <Badge variant="default">免费</Badge>
                              ) : (
                                <span className="font-semibold">{record.price || record.dataset_price || 0} ETH</span>
                              )}
                            </TableCell>
                            <TableCell>{formatFileSize(record.dataset_size || record.datasetSize || 0)}</TableCell>
                            <TableCell>{record.download_count || record.downloadCount || 1}</TableCell>
                            <TableCell>{new Date(record.created_at || record.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
