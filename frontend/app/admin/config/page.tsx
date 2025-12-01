"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { RoleGuard } from "@/components/guards/RoleGuard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockAdminAPI } from "@/lib/api/mock"
import { DollarSign, FileText, Save, Loader2, CheckCircle } from "lucide-react"
import { getWritableContract } from '@/contract/contractConnect'
import { toast } from 'sonner'
import contract from '@/contract/contractConnect'

interface SystemConfig {
  fees: {
    serviceFeeRate: number
  }
  policies: {
    termsOfService: string
    privacyPolicy: string
    dataUsagePolicy: string
  }
}

export default function AdminConfigPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Load system configuration
  const loadConfig = async () => {
    setLoading(true)
    setError("")
    try {
      // 1. 先查 mock 配置
      const response = await mockAdminAPI.getSystemConfig()
      let chainFeeRate = 0
      try {
        // 2. 查链上费率
        chainFeeRate = Number(await contract.feeRate?.())
      } catch {}
      if (response.success && response.data) {
        const filteredConfig = {
          fees: {
            ...response.data.fees,
            serviceFeeRate: chainFeeRate || response.data.fees.serviceFeeRate,
          },
          policies: response.data.policies,
        }
        setConfig(filteredConfig)
      } else {
        setError(response.error || "加载系统配置失败")
      }
    } catch (err: any) {
      setError("加载系统配置失败")
    } finally {
      setLoading(false)
    }
  }

  // Save configuration
  const saveConfig = async (section: keyof SystemConfig, data: any) => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      console.log("[v0] Saving config section:", section, data)

      const response = await mockAdminAPI.updateSystemConfig(section, data)

      if (response.success) {
        setSuccess("配置保存成功")
        await loadConfig() // Reload to get updated data
      } else {
        setError(response.error || "保存配置失败")
      }
    } catch (err: any) {
      console.error("[v0] Save config error:", err)
      setError("保存配置失败")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  if (loading) {
    return (
      <RoleGuard requiredRole="admin">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">加载系统配置...</span>
          </div>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requiredRole="admin">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader title="系统配置" description="管理费率设置和政策" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {config && (
          <div className="mt-8">
            <Tabs defaultValue="fees" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fees">费率设置</TabsTrigger>
                <TabsTrigger value="policies">政策管理</TabsTrigger>
              </TabsList>

              {/* Fee Configuration */}
              <TabsContent value="fees">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      费率设置
                    </CardTitle>
                    <CardDescription>管理平台服务费率设置（用户购买付费数据集时向商家收取的服务费）</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="service-fee">服务费率 (%)</Label>
                        <Input
                          id="service-fee"
                          type="number"
                          min={1}
                          max={50}
                          step={1}
                          value={config.fees.serviceFeeRate}
                          onChange={(e) => {
                            let val = Number(e.target.value)
                            if (val < 1) val = 1
                            if (val > 50) val = 50
                            setConfig({
                              ...config,
                              fees: { ...config.fees, serviceFeeRate: Math.floor(val) },
                            })
                          }}
                        />
                        <p className="text-sm text-muted-foreground">
                          用户购买付费数据集时，平台向商家收取的服务费比例
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={async () => {
                          if (config.fees.serviceFeeRate < 1 || config.fees.serviceFeeRate > 50) {
                            toast.error('费率必须在1-50之间')
                            return
                          }
                          setSaving(true)
                          setError("")
                          setSuccess("")
                          try {
                            const contract = await getWritableContract()
                            const tx = await contract.setFeeRate(config.fees.serviceFeeRate)
                            await tx.wait()
                            toast.success('链上费率设置成功！')
                            await loadConfig()
                            setSuccess('配置保存成功')
                          } catch (err: any) {
                            toast.error('链上设置失败: ' + (err?.reason || err?.message || '未知错误'))
                            setError('保存配置失败')
                          } finally {
                            setSaving(false)
                          }
                        }}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        保存费率设置
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Policies */}
              <TabsContent value="policies">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      政策管理
                    </CardTitle>
                    <CardDescription>管理服务条款、隐私政策等法律文档</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="terms-of-service">服务条款</Label>
                        <Textarea
                          id="terms-of-service"
                          rows={8}
                          value={config.policies.termsOfService}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              policies: { ...config.policies, termsOfService: e.target.value },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="privacy-policy">隐私政策</Label>
                        <Textarea
                          id="privacy-policy"
                          rows={8}
                          value={config.policies.privacyPolicy}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              policies: { ...config.policies, privacyPolicy: e.target.value },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data-usage-policy">数据使用政策</Label>
                        <Textarea
                          id="data-usage-policy"
                          rows={8}
                          value={config.policies.dataUsagePolicy}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              policies: { ...config.policies, dataUsagePolicy: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => saveConfig("policies", config.policies)} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        保存政策文档
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
