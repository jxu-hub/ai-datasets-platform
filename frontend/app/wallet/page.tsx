"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useWallet } from "@/contexts/WalletContext"
import { WalletConnect } from "@/components/wallet/WalletConnect"
import { ProtectedRoute } from "@/components/guards/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Wallet, AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { useState } from "react"
import { formatWalletAddress, getChainName, formatBalance } from "@/lib/utils/wallet"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function WalletPage() {
  const { user } = useAuth()
  const {
    wallet,
    bindWallet,
    disconnectWallet,
    requestWalletChange,
    checkWalletConsistency,
    isWalletBound,
    hasWalletChangeRequest,
  } = useWallet()
  const [isOperating, setIsOperating] = useState(false)

  const [showChangeDialog, setShowChangeDialog] = useState(false)
  const [changeReason, setChangeReason] = useState("")

  // Copy address to clipboard
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success("地址已复制")
    } catch (err) {
      toast.error("无法复制地址到剪贴板")
    }
  }

  // 处理钱包操作
  const handleBind = async () => {
    setIsOperating(true)
    const success = await bindWallet()
    if (success) {
      toast.success("钱包已成功绑定到您的账户")
    } else {
      toast.error("钱包绑定失败，请重试")
    }
    setIsOperating(false)
  }

  const handleWalletChangeRequest = async () => {
    if (!wallet.address || !changeReason.trim()) {
      toast.error("请填写更换原因")
      return
    }

    setIsOperating(true)
    const success = await requestWalletChange(wallet.address, changeReason)
    console.log("handleWalletChangeRequest success = =============================================== ", success)
    if (success) {
      toast.success("钱包更换申请已提交，请等待管理员审核")
      setShowChangeDialog(false)
      setChangeReason("")
    } else {
      toast.error("申请提交失败")
    }
    setIsOperating(false)
  }

  const isWalletConsistent = checkWalletConsistency()

  const handleDisconnect = async () => {
    setIsOperating(true)
    await disconnectWallet()
    toast("钱包已断开连接")
    setIsOperating(false)
  }

  return (
    <ProtectedRoute allowedRoles={["user", "seller", "admin"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">钱包管理</h1>
          <p className="text-muted-foreground">管理您的钱包连接和绑定状态</p>
        </div>

        <div className="grid gap-6">
          {wallet.isConnected && user?.wallet?.address && !isWalletConsistent && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>钱包地址不一致警告：</strong>
                当前连接的钱包地址与您账户绑定的地址不匹配。进行区块链交易前，请确保使用正确的钱包地址，或提交更换申请。
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                钱包连接状态
              </CardTitle>
              <CardDescription>{wallet.isConnected ? "您的钱包已连接" : "连接钱包以开始使用平台功能"}</CardDescription>
            </CardHeader>
            <CardContent>
              {wallet.isConnected ? (
                <div className="space-y-4">
                  {/* Wallet Info */}
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-lg">{wallet.walletType?.toUpperCase()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-background px-2 py-1 rounded">
                            {formatWalletAddress(wallet.address || "")}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyAddress(wallet.address || "")}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatBalance(wallet.balance || "0")} ETH</p>
                        <p className="text-sm text-muted-foreground">{getChainName(wallet.chainId || 1)}</p>
                      </div>
                    </div>

                    {/* Binding Status */}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isWalletBound ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">已绑定到账户</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              已绑定
                            </Badge>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">未绑定到账户</span>
                            <Badge variant="outline" className="border-orange-200 text-orange-800">
                              未绑定
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!isWalletBound ? (
                          <Button onClick={handleBind} disabled={isOperating} size="sm">
                            {isOperating ? "绑定中..." : "绑定钱包"}
                          </Button>
                        ) : (
                          <>
                            {hasWalletChangeRequest ? (
                              <Badge variant="outline" className="border-blue-200 text-blue-800">
                                更换申请审核中
                              </Badge>
                            ) : (
                              <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    申请更换钱包
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>申请更换钱包地址</DialogTitle>
                                    <DialogDescription>
                                      更换钱包地址需要管理员审核。更换后，您之前的交易记录将无法与新钱包关联，但平台记录仍会保留。
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>当前绑定地址</Label>
                                      <code className="block text-sm bg-muted p-2 rounded mt-1">
                                        {formatWalletAddress(user?.wallet?.address || "")}
                                      </code>
                                    </div>
                                    <div>
                                      <Label>新钱包地址</Label>
                                      <code className="block text-sm bg-muted p-2 rounded mt-1">
                                        {formatWalletAddress(wallet.address || "")}
                                      </code>
                                    </div>
                                    <div>
                                      <Label htmlFor="reason">更换原因</Label>
                                      <Textarea
                                        id="reason"
                                        placeholder="请说明更换钱包地址的原因..."
                                        value={changeReason}
                                        onChange={(e) => setChangeReason(e.target.value)}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowChangeDialog(false)}>
                                      取消
                                    </Button>
                                    <Button onClick={handleWalletChangeRequest} disabled={isOperating}>
                                      {isOperating ? "提交中..." : "提交申请"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </>
                        )}
                        <Button onClick={handleDisconnect} variant="outline" size="sm">
                          断开连接
                        </Button>
                      </div>
                    </div>
                  </div>

                  {!isWalletBound && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>绑定钱包后才能购买付费数据集。绑定过程需要您的钱包签名确认。</AlertDescription>
                    </Alert>
                  )}

                  {isWalletBound && hasWalletChangeRequest && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        您的钱包更换申请正在审核中，请耐心等待管理员处理。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>请先连接您的 MetaMask 钱包。</AlertDescription>
                  </Alert>
                  <WalletConnect showBindOption={false} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Binding Info */}
          <Card>
            <CardHeader>
              <CardTitle>账户绑定信息</CardTitle>
              <CardDescription>查看当前账户的钱包绑定状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">当前账户</p>
                    <p className="text-sm text-muted-foreground">{user?.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{user?.wallet?.address ? "已绑定钱包" : "未绑定钱包"}</p>
                    {user?.wallet?.address && (
                      <p className="text-sm text-muted-foreground">{formatWalletAddress(user.wallet?.address)}</p>
                    )}
                  </div>
                </div>

                {user?.wallet?.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>此钱包地址已绑定到您的账户，可以用于购买付费数据集</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>钱包安全须知</CardTitle>
              <CardDescription>重要的钱包使用规则和安全提醒</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">一账户一钱包</h3>
                  <p className="text-sm text-muted-foreground">
                    每个账户只能绑定一个钱包地址，绑定后无法随意更换，如需更换需要管理员审核
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">地址一致性检查</h3>
                  <p className="text-sm text-muted-foreground">
                    进行区块链交易时，系统会检查当前连接的钱包是否与绑定地址一致
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">交易记录保护</h3>
                  <p className="text-sm text-muted-foreground">
                    更换钱包地址后，新地址的交易记录将重新开始，原有记录无法迁移
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">安全保障</h3>
                  <p className="text-sm text-muted-foreground">您的私钥始终保存在本地钱包中，平台无法访问您的资金</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
