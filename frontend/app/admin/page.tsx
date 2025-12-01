"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { Users, Database, Shield, BarChart3, TrendingUp, Settings } from "lucide-react"
import ProgressLink from "@/components/system/ProgressLink"
import { getAdminStats, type AdminStats } from "@/contexts/AdminContext"
import contract, { getWritableContract, contractAddress } from '@/contract/contractConnect'
import { ethers } from 'ethers'
import { toast } from 'sonner'

// 新增：安全获取 provider 的工具函数
function getSafeProvider(): import('ethers').Provider {
  if (typeof window !== "undefined" && sessionStorage.getItem("wallet_auto_connect") === "1" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum)
  }
  return ethers.getDefaultProvider()
}

/**
 * 管理员后台主页
 */
function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [contractBalance, setContractBalance] = useState<string>('0')
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log("Loading admin homepage stats")
        const statsData = await getAdminStats()
        setStats(statsData)
      } catch (error) {
        console.error("Failed to load admin stats:", error)
        toast.error("获取统计数据失败")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    fetchContractBalance()
  }, [])

  // 获取合约余额
  const fetchContractBalance = async () => {
    try {
      const provider = getSafeProvider()
      const balance = await provider.getBalance(contractAddress)
      setContractBalance(ethers.formatEther(balance))
    } catch (e) {
      toast.error('获取合约余额失败: ' + (e as any)?.reason || (e as any)?.message || '未知错误')
      setContractBalance('0')
    }
  }

  // 提现（管理员）
  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      const writable = await getWritableContract()
      const tx = await writable.withdrawal()
      await tx.wait()
      toast.success('合约余额已成功提取到管理员钱包！')
      fetchContractBalance()
    } catch (e: any) {
      toast.error('提现失败: ' + (e?.reason || e?.message || '未知错误'))
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-10 p-6 max-w-7xl mx-auto">
      {/* 欢迎区 */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white mb-4">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">管理后台</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          欢迎来到AI数据集平台管理后台，这里您可以管理平台的所有功能和数据
        </p>
      </div>

      {/* 统计卡片区 + 合约余额 */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">总用户数</CardTitle>
              <div className="p-2 bg-black rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">平台注册用户总数</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">总数据集</CardTitle>
              <div className="p-2 bg-black rounded-lg">
                <Database className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalDatasets.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">平台数据集总数</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">总交易数</CardTitle>
              <div className="p-2 bg-black rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">平台交易总数</p>
            </CardContent>
          </Card>

          {/* 合约余额与提现 */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">平台合约余额</CardTitle>
              <div className="p-2 bg-black rounded-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet h-4 w-4 text-white"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M18 14v.01"/></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <span className="text-2xl font-bold text-gray-900">{contractBalance} ETH</span>
                <Button onClick={handleWithdraw} disabled={withdrawing} variant="outline" className="w-full text-gray-700 border-gray-300 mt-2">
                  {withdrawing ? '正在提取...' : '提取到管理员钱包'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 快速操作区 */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900">快速操作</h2>
        <div className="grid grid-cols-5 gap-4">
          <ProgressLink href="/admin/dashboard" className="block">
            <Card className="border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-gray-400 bg-white h-full">
              <CardContent className="p-4 text-center">
                <div className="mx-auto w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base text-gray-900 mb-2">数据统计</CardTitle>
                <CardDescription className="text-xs text-gray-600">查看平台详细统计数据和分析报告</CardDescription>
              </CardContent>
            </Card>
          </ProgressLink>

          <ProgressLink href="/admin/users" className="block">
            <Card className="border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-gray-400 bg-white h-full">
              <CardContent className="p-4 text-center">
                <div className="mx-auto w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base text-gray-900 mb-2">用户管理</CardTitle>
                <CardDescription className="text-xs text-gray-600">管理平台用户信息和权限设置</CardDescription>
              </CardContent>
            </Card>
          </ProgressLink>

          <ProgressLink href="/admin/datasets" className="block">
            <Card className="border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-gray-400 bg-white h-full">
              <CardContent className="p-4 text-center">
                <div className="mx-auto w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-3">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base text-gray-900 mb-2">数据集管理</CardTitle>
                <CardDescription className="text-xs text-gray-600">管理平台数据集内容和质量</CardDescription>
              </CardContent>
            </Card>
          </ProgressLink>

          <ProgressLink href="/admin/fingerprint" className="block">
            <Card className="border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-gray-400 bg-white h-full">
              <CardContent className="p-4 text-center">
                <div className="mx-auto w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base text-gray-900 mb-2">指纹检测</CardTitle>
                <CardDescription className="text-xs text-gray-600">检测数据集指纹和防盗版保护</CardDescription>
              </CardContent>
            </Card>
          </ProgressLink>

          <ProgressLink href="/admin/config" className="block">
            <Card className="border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-gray-400 bg-white h-full">
              <CardContent className="p-4 text-center">
                <div className="mx-auto w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-3">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base text-gray-900 mb-2">系统配置</CardTitle>
                <CardDescription className="text-xs text-gray-600">管理平台系统设置和配置</CardDescription>
              </CardContent>
            </Card>
          </ProgressLink>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireRole="admin">
      <AdminHomePage />
    </ProtectedRoute>
  )
}
