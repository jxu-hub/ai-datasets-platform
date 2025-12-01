"use client"

import { useEffect, useState } from "react"
import type { KeyboardEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  TrendingUp, 
  Users, 
  Database, 
  ArrowRight, 
  Download, 
  Star, 
  Eye,
  Zap,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Award
} from "lucide-react"
import ProgressLink from "@/components/system/ProgressLink"
import { getHomeStats, getHotRank, getLatestRank } from "@/contexts/HomeContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

const initialStats = { total_datasets: 0, total_users: 0, total_transactions: 0 }

const initialHot: any[] = []

const initialLatest: any[] = []

// 精选数据集
const mockFeaturedDatasets = [
  {
    id: 201,
    title: "COCO中文图像标注数据集",
    description: "12万张图像，80个类别，高质量中文标注",
    category: "计算机视觉",
    price: 6.8,
    is_free: false,
    rating: 4.9,
    tag: "编辑精选",
  },
  {
    id: 202,
    title: "中文知识图谱三元组数据",
    description: "500万条高质量知识三元组，涵盖多个领域",
    category: "知识图谱",
    price: 0,
    is_free: true,
    rating: 4.8,
    tag: "社区推荐",
  },
  {
    id: 203,
    title: "电商商品推荐系统数据集",
    description: "百万级用户行为数据，适合推荐算法研究",
    category: "推荐系统",
    price: 5.5,
    is_free: false,
    rating: 4.7,
    tag: "新品上架",
  },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState(initialStats)
  const [hot, setHot] = useState(initialHot)
  const [latest, setLatest] = useState(initialLatest)
  const router = useRouter()

  const isFreeDataset = (d: any) => {
    const p = Number(d?.price ?? 0)
    return !!(d?.isFree || d?.is_free || p === 0)
  }

  const renderPriceTag = (d: any) => {
    return isFreeDataset(d) ? (
      <Badge variant="outline">免费</Badge>
    ) : (
      <div className="text-sm font-semibold">{Number(d?.price ?? 0)} ETH</div>
    )
  }

  const formatRelativeTime = (ts?: number | string) => {
    if (ts === undefined || ts === null) return ""
    const n = typeof ts === "string" ? Number(ts) : ts
    if (!n || Number.isNaN(n)) return ""
    const now = Math.floor(Date.now() / 1000)
    let diff = now - Number(n)
    if (diff < 0) diff = 0
    if (diff < 60) return diff === 0 ? "刚刚" : `${diff}秒前`
    const m = Math.floor(diff / 60)
    if (m < 60) return `${m}分钟前`
    const h = Math.floor(diff / 3600)
    if (h < 24) return `${h}小时前`
    const d = Math.floor(diff / 86400)
    return `${d}天前`
  }

  const getUnix = (d: any): number | undefined => {
    const ts = (d?.createdAtUnix ?? (d as any)?.created_at_unix ?? null)
    if (typeof ts === 'number') return ts
    if (typeof ts === 'string') {
      const n = Number(ts)
      if (!Number.isNaN(n)) return n
    }
    const iso = (d?.createdAt ?? d?.updatedAt ?? null)
    if (typeof iso === 'string') {
      const dt = Date.parse(iso)
      if (!Number.isNaN(dt)) return Math.floor(dt / 1000)
    }
    return undefined
  }

  useEffect(() => {
    (async () => {
      try {
        const s = await getHomeStats()
        const h = await getHotRank(10)
        const l = await getLatestRank(10)
        setStats(s)
        setHot(h)
        setLatest(l)
      } catch {}
    })()
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/free-datasets?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/free-datasets?category=${encodeURIComponent(categoryName)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - 简洁专业 */}
      <section className="relative border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
                AI 数据集交易平台
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                专业的 AI 训练数据集交易市场，为开发者和研究者提供高质量数据资源
            </p>
            </div>

            {/* Search Bar - 企业级搜索框 */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="搜索数据集名称、分类、标签..."
                  className="pl-12 pr-32 h-14 text-base border-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  size="lg" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-12"
                  onClick={handleSearch}
                >
                搜索
              </Button>
            </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section - 数据统计 */}
      <section className="py-12 border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-12">
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-foreground">{stats.total_datasets.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">数据集总数</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-foreground">{stats.total_users.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">注册用户</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-5xl font-bold text-foreground">{stats.total_transactions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">累计交易</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Ranking & Latest Uploads - 热门排行 + 最新上传（同行展示）*/}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧：热门排行榜 */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-foreground" />
                    <h2 className="text-2xl font-bold text-foreground">热门排行</h2>
                  </div>
                  <ProgressLink href="/free-datasets" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    更多 <ArrowRight className="h-3.5 w-3.5" />
                  </ProgressLink>
                </div>

                {/* Top 5 排行榜 */}
                <div className="space-y-2">
                  {(Array.isArray(hot) ? hot : ((hot as any)?.items ?? [])).slice(0, 5).map((dataset: any, index: number) => (
                    <ProgressLink key={dataset.id} href={`/datasets/${dataset.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                        {/* 排名 */}
                        <div className="flex-shrink-0 w-8">
                          {index < 3 ? (
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-foreground text-background' : 
                              index === 1 ? 'bg-muted-foreground/70 text-background' : 
                              'bg-muted-foreground/50 text-background'
                            }`}>
                              {index + 1}
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-muted-foreground/40 text-center">
                              {index + 1}
                            </div>
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground group-hover:underline line-clamp-1 mb-1">
                            {dataset.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="truncate">{dataset.category}</span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {(dataset.downloadCount || dataset.download_count || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* 价格区域 */}
                        <div className="flex-shrink-0 text-right">
                          {renderPriceTag(dataset)}
                        </div>
                      </div>
                    </ProgressLink>
                  ))}
                </div>
              </div>

              {/* 右侧：最新上传 */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-foreground" />
                    <h2 className="text-2xl font-bold text-foreground">最新上传</h2>
                  </div>
                  <ProgressLink href="/free-datasets" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                    更多 <ArrowRight className="h-3.5 w-3.5" />
                  </ProgressLink>
                </div>

                <div className="space-y-3">
                  {(Array.isArray(latest) ? latest : ((latest as any)?.items ?? [])).map((dataset: any) => (
                    <ProgressLink key={dataset.id} href={`/datasets/${dataset.id}`}>
                      <div className="flex items-center justify-between p-4 h-16 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-medium text-foreground group-hover:underline line-clamp-1 mb-1 truncate">
                            {dataset.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs truncate max-w-[160px]">
                              {dataset.category}
                            </Badge>
                            <span>·</span>
                            <span className="truncate max-w-[80px]">{formatRelativeTime(getUnix(dataset))}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          {renderPriceTag(dataset)}
                        </div>
                      </div>
                    </ProgressLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - 分类浏览（带图标） */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">数据集分类</h2>
            <p className="text-muted-foreground">按照不同的应用领域浏览数据集</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
                { name: "自然语言处理", count: 450, icon: "💬" },
                { name: "文本分类", count: 320, icon: "📝" },
                { name: "计算机视觉", count: 285, icon: "👁️" },
                { name: "推荐系统", count: 180, icon: "🎯" },
                { name: "金融数据", count: 120, icon: "💰" },
                { name: "问答系统", count: 95, icon: "❓" },
                { name: "情感分析", count: 85, icon: "😊" },
                { name: "对话系统", count: 75, icon: "🗣️" },
            ].map((category) => (
              <Card
                key={category.name}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} 个数据集</p>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features - 平台特色 */}
      <section className="py-12 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="h-5 w-5 text-foreground" />
                <h2 className="text-2xl font-bold text-foreground">平台特色</h2>
              </div>
              <p className="text-sm text-muted-foreground">为什么选择我们的平台</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">区块链存证</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    基于以太坊智能合约，确保数据交易透明、安全、不可篡改
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">质量保证</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    严格审核机制，所有数据集经过专业团队验证，确保高质量
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">即时交付</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    支付完成后即可下载，无需等待，高速CDN加速分发
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4">
                    <Users className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">社区驱动</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    开放的上传机制，让更多优质数据集惠及AI开发者
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
