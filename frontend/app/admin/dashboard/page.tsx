"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole"
import { RoleGuard } from "@/components/guards/RoleGuard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, Users, Database, Activity, Shield, Settings, Loader2, Wallet } from "lucide-react"
import ProgressLink from "@/components/system/ProgressLink"
import { getDashboardAnalytics, getAdminStats, type DashboardAnalytics, type AdminStats } from "@/contexts/AdminContext"
import { toast } from "sonner"
import contract, { getWritableContract, contractAddress } from '@/contract/contractConnect'
import { ethers } from 'ethers'


// 安全获取 provider 的工具函数
function getSafeProvider(): import('ethers').Provider {
  if (typeof window !== "undefined" && sessionStorage.getItem("wallet_auto_connect") === "1" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum)
  }
  return ethers.getDefaultProvider()
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { isAdmin } = useRole()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [contractBalance, setContractBalance] = useState<string>('0')

  // 定义图表颜色数组
  const CHART_COLORS = [
    "#3b82f6", // 蓝色 - 自然语言处理
    "#10b981", // 绿色 - 文本分类
    "#ef4444", // 红色 - 计算机视觉
    "#f59e0b", // 橙色 - 推荐系统
    "#fbbf24", // 黄色 - 金融数据
    "#8b5cf6", // 紫色 - 问答系统
    "#ec4899", // 粉色 - 情感分析
    "#06b6d4", // 青色 - 对话系统
  ]

  // 获取合约余额
  const fetchContractBalance = async () => {
    try {
      const provider = getSafeProvider()
      const balance = await provider.getBalance(contractAddress)
      setContractBalance(ethers.formatEther(balance))
    } catch (e) {
      console.error('获取合约余额失败:', e)
      setContractBalance('0')
    }
  }

  // 加载仪表板数据（同时获取总数和分析数据）
  const loadDashboardData = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("加载仪表板数据...")
      // 并行请求两个接口
      const [statsData, analyticsData] = await Promise.all([
        getAdminStats(),
        getDashboardAnalytics()
      ])
      setStats(statsData)
      setAnalytics(analyticsData)
      // 同时获取合约余额
      fetchContractBalance()
    } catch (err: any) {
      console.error("加载仪表板数据失败:", err)
      setError(err.message || "加载仪表板数据失败")
      toast.error(err.message || "加载仪表板数据失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && isAdmin()) {
      loadDashboardData()
    }
  }, [user])

  if (loading) {
    return (
      <RoleGuard requiredRole="admin">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">加载管理员仪表板...</span>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="admin">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader title="管理员仪表板" description="平台管理和监控中心" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stats && analytics && (
          <div className="mt-8 space-y-8">
            {/* Platform Stats Cards with Monthly Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">总用户数</p>
                      <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{analytics.monthlyGrowth.users.toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">较上月</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">总数据集</p>
                      <p className="text-2xl font-bold">{stats.totalDatasets.toLocaleString()}</p>
                    </div>
                    <Database className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{analytics.monthlyGrowth.datasets.toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">较上月</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">总交易数</p>
                      <p className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="mt-2 flex items-center text-xs">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{analytics.monthlyGrowth.transactions.toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">较上月</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">平台合约余额</p>
                      <p className="text-2xl font-bold">{contractBalance} ETH</p>
                    </div>
                    <Wallet className="h-8 w-8 text-yellow-600" />
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>管理操作</CardTitle>
                <CardDescription>常用管理功能快速入口</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild className="h-20 flex-col gap-2">
                    <ProgressLink href="/admin/users">
                      <Users className="h-6 w-6" />
                      用户管理
                    </ProgressLink>
                  </Button>

                  <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <ProgressLink href="/admin/datasets">
                      <Database className="h-6 w-6" />
                      数据集管理
                    </ProgressLink>
                  </Button>

                  <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <ProgressLink href="/admin/fingerprint">
                      <Shield className="h-6 w-6" />
                      指纹检测
                    </ProgressLink>
                  </Button>

                  <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                    <ProgressLink href="/admin/settings">
                      <Settings className="h-6 w-6" />
                      系统配置
                    </ProgressLink>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>用户增长趋势</CardTitle>
                  <CardDescription>最近6个月的用户增长情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Transaction Volume */}
              <Card>
                <CardHeader>
                  <CardTitle>交易额统计</CardTitle>
                  <CardDescription>本周每日交易额（ETH）</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.transactionVolume}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10b981" name="交易额(ETH)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>数据集分类分布</CardTitle>
                <CardDescription>各类别数据集占比统计</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {analytics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
