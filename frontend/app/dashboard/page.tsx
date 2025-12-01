"use client"

import { useState, useEffect } from "react"
import { useAuth, getUserStats } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UserStats } from "@/types"
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Download,
  Heart,
  Database,
  ShoppingCart,
  Plus,
  ArrowRight,
  Loader2,
  Users,
  PieChart as PieChartIcon,
} from "lucide-react"
import ProgressLink from "@/components/system/ProgressLink"
import { toast } from "sonner"

export default function DashboardPage() {
  const { user } = useAuth()
  const { isUser, isSeller, isAdmin } = useRole()
  
  // 用户统计数据
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 页面加载时获取用户统计数据
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
    setLoading(true)
      setStatsLoading(true)
    try {
        const stats = await getUserStats()
        setUserStats(stats)
      } catch (error) {
        console.error("获取用户统计数据失败:", error)
        setError("获取统计数据失败")
    } finally {
        setStatsLoading(false)
      setLoading(false)
    }
  }

    fetchUserStats()
  }, [user?.id])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // 统计数据卡片
  const renderStatsCards = () => {
    // 普通用户显示3列，商家/管理员显示4列
    const gridCols = (isSeller() || isAdmin()) 
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" 
      : "grid-cols-1 md:grid-cols-3"

      return (
      <div className={`grid ${gridCols} gap-6`}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-muted-foreground">总消费</p>
                <p className="text-2xl font-bold">{userStats?.total_spent?.toFixed(4) ?? "0.0000"} ETH</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            <div className="mt-2">
              <Button asChild size="sm" variant="outline" className="bg-transparent">
                <ProgressLink href="/transactions">
                  查看记录 <ArrowRight className="ml-1 h-3 w-3" />
                </ProgressLink>
              </Button>
              </div>
            </CardContent>
          </Card>

        {/* 只有商家和管理员才显示"已上传" */}
        {(isSeller() || isAdmin()) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">已上传</p>
                  <p className="text-2xl font-bold">{userStats?.total_uploads ?? 0}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Button asChild size="sm" variant="outline" className="bg-transparent">
                  <ProgressLink href="/my-datasets">
                    管理数据集 <ArrowRight className="ml-1 h-3 w-3" />
                  </ProgressLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已购买</p>
                <p className="text-2xl font-bold">{userStats?.total_purchases ?? 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Button asChild size="sm" variant="outline" className="bg-transparent">
                <ProgressLink href="/transactions">
                  查看交易 <ArrowRight className="ml-1 h-3 w-3" />
                </ProgressLink>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已下载</p>
                <p className="text-2xl font-bold">{userStats?.total_downloads ?? 0}</p>
              </div>
              <Download className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Button asChild size="sm" variant="outline" className="bg-transparent">
                <ProgressLink href="/transactions">
                  查看下载 <ArrowRight className="ml-1 h-3 w-3" />
                </ProgressLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requireAuth>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">加载中...</span>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader
          title={`欢迎回来，${user?.username}！`}
          description="您的个人数据统计与快速操作面板"
        />

        <div className="mt-8 space-y-8">
          {/* Stats Cards */}
          {renderStatsCards()}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>常用功能快速入口</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(isSeller() || isAdmin()) && (
                  <Button asChild className="h-20 flex-col gap-2">
                    <ProgressLink href="/upload">
                      <Plus className="h-6 w-6" />
                      上传数据集
                    </ProgressLink>
                  </Button>
                )}

                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <ProgressLink href="/free-datasets">
                    <Database className="h-6 w-6" />
                    浏览免费数据集
                  </ProgressLink>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <ProgressLink href="/paid-datasets">
                    <ShoppingCart className="h-6 w-6" />
                    浏览付费数据集
                  </ProgressLink>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <ProgressLink href="/favorites">
                    <Heart className="h-6 w-6 text-red-600" />
                    我的收藏
                  </ProgressLink>
                </Button>

                <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                  <ProgressLink href="/profile">
                    <Users className="h-6 w-6" />
                    个人资料
                  </ProgressLink>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Statistics Charts */}
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">加载统计数据...</span>
                  </div>
                ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 已购买数据集分类分布 */}
              <Card className="overflow-visible">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    已购买数据集分类分布
                  </CardTitle>
                  <CardDescription>按分类统计您购买的数据集</CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-6">
                  {userStats?.purchased_datasets && userStats.purchased_datasets.length > 0 ? (
                    <div style={{ width: '100%', height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCategoryStats(userStats.purchased_datasets)}
                            dataKey="value"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            innerRadius={45}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, category, percent }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = outerRadius + 40;
                              const angle = midAngle || 0;
                              const x = cx + radius * Math.cos(-angle * RADIAN);
                              const y = cy + radius * Math.sin(-angle * RADIAN);
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="#333" 
                                  textAnchor={x > cx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  style={{ fontSize: '12px', fontWeight: '500' }}
                                >
                                  {`${category} (${((percent || 0) * 100).toFixed(0)}%)`}
                                </text>
                              );
                            }}
                            labelLine={{ stroke: '#888', strokeWidth: 1 }}
                          >
                            {getCategoryStats(userStats.purchased_datasets).map((entry, index) => (
                              <Cell key={`cell-purchased-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any, name: any) => [`数量: ${value} 个`, name]}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              padding: '10px'
                            }}
                          />
                        </PieChart>
                  </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
                      <div>您还没有购买任何数据集</div>
                      <ProgressLink href="/paid-datasets">
                        <Button variant="outline" className="mt-2">去浏览数据集</Button>
                      </ProgressLink>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 已下载数据集分类分布 */}
              <Card className="overflow-visible">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    已下载数据集分类分布
                  </CardTitle>
                  <CardDescription>按分类统计您下载的数据集</CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-6">
                  {userStats?.downloaded_datasets && userStats.downloaded_datasets.length > 0 ? (
                    <div style={{ width: '100%', height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                            data={getCategoryStats(userStats.downloaded_datasets)}
                            dataKey="value"
                            nameKey="category"
                        cx="50%"
                        cy="50%"
                            outerRadius={70}
                            innerRadius={45}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, category, percent }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = outerRadius + 40;
                              const angle = midAngle || 0;
                              const x = cx + radius * Math.cos(-angle * RADIAN);
                              const y = cy + radius * Math.sin(-angle * RADIAN);
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="#333" 
                                  textAnchor={x > cx ? 'start' : 'end'} 
                                  dominantBaseline="central"
                                  style={{ fontSize: '12px', fontWeight: '500' }}
                                >
                                  {`${category} (${((percent || 0) * 100).toFixed(0)}%)`}
                                </text>
                              );
                            }}
                            labelLine={{ stroke: '#888', strokeWidth: 1 }}
                          >
                            {getCategoryStats(userStats.downloaded_datasets).map((entry, index) => (
                              <Cell key={`cell-downloaded-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                          <Tooltip 
                            formatter={(value: any, name: any) => [`数量: ${value} 个`, name]}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #ccc',
                              borderRadius: '8px',
                              padding: '10px'
                            }}
                          />
                    </PieChart>
                  </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Download className="h-10 w-10 mb-2 opacity-40" />
                      <div>您还没有下载过数据集</div>
                      <ProgressLink href="/free-datasets">
                        <Button variant="outline" className="mt-2">去体验免费下载</Button>
                      </ProgressLink>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

// 工具函数和配色
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6699", "#33CC99", "#FFB347"]

function getCategoryStats(categories: string[]): { category: string; value: number }[] {
  if (!categories || categories.length === 0) return []
  const stats: Record<string, number> = {}
  categories.forEach((category: string) => {
    if (category) {
      stats[category] = (stats[category] || 0) + 1
    }
  })
  return Object.entries(stats).map(([category, value]) => ({ category, value }))
}
