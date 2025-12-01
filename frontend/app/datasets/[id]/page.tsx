"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  Calendar,
  Database,
  Users,
  Wallet,
  Loader2,
  Eye,
  ShoppingCart,
  TrendingUp,
  Heart,
} from "lucide-react"
import { useDataset } from "@/contexts/DatasetContext"
import { useTransaction } from "@/contexts/TransactionContext"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole" 
import type { Dataset } from "@/types"
import Link from "next/link"
import { toast } from "sonner"
import { getProvider } from '@/contract/contractConnect'
import { getProfileByWalletAddress } from "@/lib/api/auth"
import { PreviewTable } from "@/components/datasets/PreviewTable";
import { formatFileSize } from "@/lib/utils";
import { useWallet } from "@/contexts/WalletContext"
import { usePaidDownloadWithProgress } from "@/contexts/DatasetContext";
import ProgressLink from "@/components/system/ProgressLink"

export default function DatasetDetailPage() {
  const params = useParams()
  const { isAuthenticated, hasWallet, user, favoriteDataset, unfavoriteDataset, fetchFavoriteStatus } = useAuth()
  const { isAdmin } = useRole()
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [merchantDatasets, setMerchantDatasets] = useState<Dataset[]>([])
  const [author, setAuthor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [purchasing, setPurchasing] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [checkingPurchase, setCheckingPurchase] = useState(false)

  const datasetId = Number.parseInt(params.id as string)
  // 初始收藏状态
  const [favorited, setFavorited] = useState(false)
  const { verifyWalletAddress, wallet } = useWallet();

  const apiMinio = process.env.NEXT_PUBLIC_API_MINIO as string

  const { fetchDatasetById, fetchPaidDatasetsByAuthor, fetchDatasetPreviewByObjectName, downloadFreeDataset, startPaidDownloadTask, getPaidDownloadTaskStatus } = useDataset();
  const { purchaseDataset } = useTransaction();
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // 伪进度条相关逻辑全部交由 usePaidDownloadWithProgress 管理
  const { progress: downloadProgress, status: downloadStatus, modalOpen: downloadModalOpen, startDownload, closeModal } = usePaidDownloadWithProgress(dataset && dataset.objectName ? { id: dataset.id, fileSize: dataset.fileSize, objectName: dataset.objectName } : null);

  // 检查购买状态
  const checkPurchaseStatus = async () => {
    if (!isAuthenticated || !user || !dataset || dataset.isFree) return
    setCheckingPurchase(true)
    try {
      const provider = getProvider()
      const address = user.walletAddress 
      if (!address) {
        setHasPurchased(false)
        return
      }
      const contract = await (await import('@/contract/contractConnect')).default
      const result = await contract.isBuyDataset(address, datasetId)
      setHasPurchased(result)
    } catch (error) {
      setHasPurchased(false)
    } finally {
      setCheckingPurchase(false)
    }
  }

  // 获取同商家其他付费数据集
  const loadMerchantDatasets = async (authorWalletAddress: string) => {
    try {
      const res = await fetchPaidDatasetsByAuthor(authorWalletAddress, 1, 3);
      if (res && res.items) {
        // 排除当前数据集
        setMerchantDatasets(res.items);
      }
    } catch (error) {
      setMerchantDatasets([]);
    }
  };

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError("");
    fetchDatasetById(datasetId)
      .then((data) => {
        setDataset(data.data);
        // 兼容tags为逗号分隔字符串或数组
        if (typeof data.data.tags === 'string') {
          setTags(data.data.tags.split(',').map((t: string) => t.trim()).filter(Boolean));
        } else if (Array.isArray(data.data.tags)) {
          setTags(data.data.tags);
        } else {
          setTags([]);
        }
        console.log("dataset = ", data.data)
        if (data.data && data.data.isFree) {
          loadMerchantDatasets(data.data.authorWalletAddress);
        }
      })
      .catch((err) => {
        setError("数据集不存在或已被删除");
      })
      .finally(() => setLoading(false));
  }, [datasetId]);

  useEffect(() => {
    if (!dataset || !dataset.objectName) return;
    setPreviewLoading(true);
    setPreviewError("");
    fetchDatasetPreviewByObjectName(dataset.objectName)
      .then((data) => {
        setPreviewData(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        setPreviewData([]);
        setPreviewError("暂无预览数据");
      })
      .finally(() => setPreviewLoading(false));
  }, [dataset?.objectName]);

  useEffect(() => {
    if (dataset && user && isAuthenticated && !dataset.isFree) {
      checkPurchaseStatus();
    }
    // 获取作者信息
    if (dataset && dataset.authorWalletAddress) {
      getProfileByWalletAddress(dataset.authorWalletAddress).then(setAuthor).catch(() => setAuthor(null));
    }
  }, [dataset, user, isAuthenticated]);

  // 获取收藏状态
  useEffect(() => {
    if (!user || !datasetId) return;
    (async () => {
      try {
        const status = await fetchFavoriteStatus(datasetId);
        setFavorited(status);
      } catch {}
    })();
  }, [user, datasetId]);

  const handleDownloadOrPurchase = async () => {
    if (!dataset) return;
    setPurchasing(true);
    try {
      if (dataset.isFree) {
        toast.success("下载已开始", { description: "正在获取下载链接..." });
        const url = await downloadFreeDataset(dataset.id);
        // 触发浏览器下载
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (hasPurchased) {
        await startDownload();
      } else {
        toast.info("正在链上购买", { description: "正在发起链上购买流程..." });
        await purchaseDataset(dataset.id, dataset.price);
        setHasPurchased(true);
        toast.success("购买成功");
      }
    } catch (error: any) {
      closeModal();
      console.log("error = ", error);
      toast.error("交易结束处理中，请稍后刷新页面查看结果", { description: error?.reason || error?.message || "链上操作失败" });
    } finally {
      setPurchasing(false);
    }
  };

  // 收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!dataset || !user) return;
    setFavoritesLoading(true);
    try {
      if (favorited) {
        await unfavoriteDataset(user.id, dataset.id);
        setFavorited(false);
        toast("已取消收藏", { description: "已从收藏夹中移除" });
      } else {
        await favoriteDataset(user.id, dataset.id);
        setFavorited(true);
        toast("已收藏", { description: "已添加到收藏夹" });
      }
    } catch (err: any) {
      toast.error(err.message || "操作失败");
    } finally {
      setFavoritesLoading(false);
    }
  }

  const getActionButton = () => {
    if (!dataset) return null

    if (dataset.isFree) {
      if (!isAuthenticated) {
        return (
          <Button asChild size="lg" className="w-full md:w-auto">
            <ProgressLink href="/login">
              <Download className="mr-2 h-4 w-4" />登录后下载
            </ProgressLink>
          </Button>
        )
      }
      return (
        <Button onClick={handleDownloadOrPurchase} disabled={purchasing} size="lg" className="w-full md:w-auto">
          {purchasing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              下载中...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              免费下载
            </>
          )}
        </Button>
      )
    }

    if (!isAuthenticated) {
      return (
        <Button asChild size="lg" className="w-full md:w-auto">
          <ProgressLink href="/login">登录后购买</ProgressLink>
        </Button>
      )
    }

    if (isAdmin()) {
      return (
        <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
          <Eye className="mr-2 h-4 w-4" />
          管理员预览
        </Button>
      )
    }

    if (!hasWallet) {
      return (
        <Button asChild size="lg" className="w-full md:w-auto">
          <ProgressLink href="/profile?tab=wallet">
            <Wallet className="mr-2 h-4 w-4" />
            绑定钱包后购买
          </ProgressLink>
        </Button>
      )
    }

    // 新增：钱包未连接或与绑定钱包不一致时，按钮显示提示
    if (!wallet.isConnected || !verifyWalletAddress) {
      return (
        <Button disabled size="lg" className="w-full md:w-auto">
          <Wallet className="mr-2 h-4 w-4" />
          { !wallet.isConnected ? "请先连接您的钱包" : "当前钱包与绑定钱包不一致" }
        </Button>
      )
    }

    if (checkingPurchase) {
      return (
        <Button disabled size="lg" className="w-full md:w-auto">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          检查购买状态...
        </Button>
      )
    }

    if (hasPurchased) {
      return (
        <Button onClick={handleDownloadOrPurchase} disabled={purchasing} size="lg" className="w-full md:w-auto">
          {purchasing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              下载中...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              下载数据集
            </>
          )}
        </Button>
      )
    }

    return (
      <Button onClick={handleDownloadOrPurchase} disabled={purchasing} size="lg" className="w-full md:w-auto">
        {purchasing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            购买中...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />{dataset.price} ETH 立即购买
          </>
        )}
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    )
  }

  if (error || !dataset) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "数据集不存在"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  console.log("merchantDatasets = ", merchantDatasets)
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{dataset.category}</Badge>
                <Badge
                  variant={dataset.isFree ? "default" : "outline"}
                  className={dataset.isFree ? "" : "bg-foreground text-background"}
                >
                  {dataset.isFree ? "免费" : `${dataset.price} ETH`}
                </Badge>
              </div>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={favoritesLoading}
                  className="flex-shrink-0"
                >
                  <Heart className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "fill-none"}`} />
                </Button>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-4">{dataset.title}</h1>

            <p className="text-muted-foreground text-lg mb-6">{dataset.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={author?.avatarUrl ? apiMinio + author.avatarUrl : "/placeholder.svg"} alt={author?.username || "作者"} />
                <AvatarFallback>{author?.username ? author.username.charAt(0).toUpperCase() : "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{author?.username || "作者"}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{dataset.createdAt ? new Date(dataset.createdAt).toLocaleDateString() : "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-80">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{dataset.downloadCount?.toLocaleString?.() ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">下载次数</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatFileSize(dataset.fileSize)}</div>
                      <div className="text-xs text-muted-foreground">文件大小</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">文件格式:</span>
                      <span>{"JSONL"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">更新时间:</span>
                      <span>{dataset.updatedAt ? new Date(dataset.updatedAt).toLocaleDateString() : "-"}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">{getActionButton()}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-6 mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">数据预览</TabsTrigger>
          <TabsTrigger value="details">详细信息</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>数据预览</CardTitle>
              <CardDescription>查看数据集的样本数据（JSONL格式，共20条预览数据）</CardDescription>
            </CardHeader>
            <CardContent>
              {/* 预览数据展示，独立请求 previewData */}
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>加载预览数据...</span>
                </div>
              ) : previewData.length > 0 ? (
                <div className="space-y-4">
                  <PreviewTable data={previewData.slice(0, 20)} />
                  <p className="text-sm text-muted-foreground">
                    显示前{Math.min(previewData.length, 20)}条数据
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{previewError || "暂无预览数据"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>数据集详情</CardTitle>
              <CardDescription>了解数据集的详细信息和使用说明</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">数据集描述</h3>
                <p className="text-muted-foreground">{dataset.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">基本信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">分类:</span>
                      <span>{dataset.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">文件大小:</span>
                      <span>{formatFileSize(dataset.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">文件格式:</span>
                      <span>{"JSONL"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">创建时间:</span>
                      <span>{dataset.createdAt ? new Date(dataset.createdAt).toLocaleDateString() : "-"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">使用统计</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">下载次数:</span>
                      <span>{dataset.downloadCount?.toLocaleString?.() ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">价格:</span>
                      <span>{dataset.isFree ? "免费" : `${dataset.price} ETH`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dataset.isFree && merchantDatasets.length > 0 && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                该商家的付费数据集
              </CardTitle>
              <CardDescription>发现更多来自 {dataset.authorWalletAddress ? author?.username || "作者" : "作者"} 的高质量付费数据集</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {merchantDatasets.map((merchantDataset) => (
                  <Card key={merchantDataset.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {merchantDataset.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-foreground text-background">
                          {merchantDataset.price} ETH
                        </Badge>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">
                        <ProgressLink href={`/datasets/${merchantDataset.id}`} className="hover:text-primary transition-colors">
                          {merchantDataset.title}
                        </ProgressLink>
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{merchantDataset.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{merchantDataset.downloadCount}</span>
                        </div>
                      </div>
                      <Button asChild size="sm" className="w-full">
                        <ProgressLink href={`/datasets/${merchantDataset.id}`}>查看详情</ProgressLink>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {downloadModalOpen && (
        <div className="fixed left-0 right-0 top-1/2 z-50 flex items-center justify-center pointer-events-none" style={{transform: 'translateY(-50%)'}}>
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col items-center pointer-events-auto border border-gray-200">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${downloadProgress}%` }} />
            </div>
            <div className="text-center text-sm text-muted-foreground mb-2">{downloadStatus || '正在准备文件...'}</div>
            <div className="text-xs text-gray-400">大文件处理可能需要较长时间，请耐心等待...</div>
          </div>
        </div>
      )}
    </div>
  )
}
