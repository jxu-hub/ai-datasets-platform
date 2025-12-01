"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react"
import { useWallet, type WalletType } from "@/contexts/WalletContext"
import { useAuth } from "@/contexts/AuthContext"
import { Textarea } from "@/components/ui/textarea"
import { checkHasWallet } from '@/lib/api/wallet'
import { getProfile } from '@/lib/api/auth'
import { toast } from 'sonner'
import { WalletChangeRequest } from "@/types"
import contract from '@/contract/contractConnect'
import { ROLE_MAP } from '@/lib/constants/roles'

interface WalletOption {
  type: WalletType
  name: string
  description: string
  icon: string
  installUrl?: string
}

const walletOptions: WalletOption[] = [
  {
    type: "metamask",
    name: "MetaMask",
    description: "使用 MetaMask 钱包连接",
    icon: "🦊",
    installUrl: "https://metamask.io/download/",
  },
]

interface WalletConnectProps {
  onSuccess?: () => void
  showBindOption?: boolean
}

export function WalletConnect({ onSuccess, showBindOption = false }: WalletConnectProps) {
  const { wallet, connectWallet, disconnectWallet, bindWallet, verifyWalletAddress, isConnecting, error, requestWalletChange } = useWallet()
  const { user, updateUser } = useAuth()
  const [isBinding, setIsBinding] = useState(false)
  const [open, setOpen] = useState(false)
  const [changeDialogOpen, setChangeDialogOpen] = useState(false)
  const [changeReason, setChangeReason] = useState("")
  const [changeLoading, setChangeLoading] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)
  const [changeError, setChangeError] = useState<string | null>(null)
  const [hasWallet, setHasWallet] = useState<boolean | null>(null)
  const [loadingHasWallet, setLoadingHasWallet] = useState(true)

  // 在更换钱包弹窗内，显示原钱包地址（只读）和新钱包地址（可编辑，默认当前连接钱包地址）
  const [newWalletAddress, setNewWalletAddress] = useState(wallet.address || "")

  const fetchWalletStatus = async () => {
    setLoadingHasWallet(true)
    try {
      const res = await checkHasWallet()
      console.log("components/wallet/walletConnect.tsx checkHasWallet res = ", res)
      setHasWallet(res)
    } catch {
      setHasWallet(false)
    } finally {
      setLoadingHasWallet(false)
    }
  }

  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      fetchWalletStatus()
    }
  }, [wallet.isConnected, wallet.address])

  useEffect(() => {
    if (changeDialogOpen) {
      setNewWalletAddress(wallet.address || "")
    }
  }, [wallet.address, changeDialogOpen])

  console.log("hasWallet = ", hasWallet)

  // 1. 在useEffect中监听bindError和changeError，弹出toast
  useEffect(() => {
    if (bindError) {
      toast.error(bindError)
    }
  }, [bindError])
  useEffect(() => {
    if (changeError) {
      toast.error(changeError)
    }
  }, [changeError])

  const handleConnect = async (type: WalletType) => {
    if (isConnecting) return;
    const success = await connectWallet();
    if (success) {
      setOpen(false);
      onSuccess?.();
    } else {
      toast.error(error || "连接钱包失败，请检查MetaMask");
    }
  }

  // 2. 在绑定/解绑/更换钱包等操作后，清空错误信息
  const handleBind = async () => {
    setIsBinding(true)
    try {
      const res = await bindWallet()
      if (res.success) {
        await fetchWalletStatus()
        // 绑定成功后强制刷新用户信息
        const freshUser = await getProfile()
        updateUser(freshUser)
        toast.success(res.msg)
      } else {
        toast.error(res.msg)
      }
    } catch {
      toast.error("钱包绑定失败")
    }
    setIsBinding(false)
  }
  // 判断是否需要显示更换钱包按钮
  const showChangeWallet = Boolean(
    verifyWalletAddress && wallet.address && user?.walletAddress && wallet.address.toString().toLowerCase() !== user.walletAddress.toString().toLowerCase()
  )
  console.log("showChangeWallet = ", showChangeWallet)

  // 更换钱包
  const handleRequestChange = async () => {
    if (!newWalletAddress || !user?.walletAddress) {
      toast.error("请填写新钱包地址并确保已绑定钱包")
      return
    }
    if (newWalletAddress.toLowerCase() === user.walletAddress.toLowerCase()) {
      toast.error("新钱包地址不能与原钱包地址一致")
      return
    }
    setChangeLoading(true)
    setChangeError(null)
    // 判断该钱包地址的角色
    const roleNum = await contract.roles(newWalletAddress)
    const role = ROLE_MAP[roleNum]
    const walletChange: WalletChangeRequest = {
      newWalletAddress: newWalletAddress,
      reason: changeReason,
      role: role,
    }
    const res = await requestWalletChange(walletChange)
    if (res.success) {
      setChangeDialogOpen(false)
      setChangeReason("")
      const freshUser = await getProfile()
      updateUser(freshUser)
      toast.success(res.msg)
    } else {
      setChangeError(res.msg)
    }
    setChangeLoading(false)
  }

  if (wallet.isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            已连接钱包
          </CardTitle>
          <CardDescription>您的钱包已连接，可以开始使用</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{wallet.balance} ETH</p>
            </div>
          </div>

          {showBindOption && (
            <div className="space-y-3">
              {loadingHasWallet ? (
                <div>加载中...</div>
              ) : hasWallet ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">钱包已绑定到您的账户</span>
                </div>
              ) : null}
              <div className="flex gap-2">
                {!hasWallet ? (
                  <Button onClick={handleBind} disabled={isBinding || loadingHasWallet} className="flex-1">
                    {isBinding ? "绑定中..." : "绑定钱包"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setChangeDialogOpen(true)}
                    className="flex-1"
                  >
                    更换钱包
                  </Button>
                )}
                <Button onClick={disconnectWallet} variant="outline">
                  断开连接
                </Button>
              </div>
              <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>申请更换钱包</DialogTitle>
                    <DialogDescription>
                      请输入更换原因，提交后需管理员审核。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mb-2">
                    <label className="block text-xs text-muted-foreground mb-1">原钱包地址</label>
                    <div className="w-full px-2 py-1 border rounded bg-gray-100 text-xs text-gray-500 break-all select-text">
                      {user?.walletAddress || ''}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs text-muted-foreground mb-1">新钱包地址</label>
                    <input
                      type="text"
                      value={newWalletAddress}
                      onChange={e => setNewWalletAddress(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs"
                      placeholder="请输入新钱包地址"
                    />
                  </div>
                  <Textarea
                    value={changeReason}
                    onChange={e => setChangeReason(e.target.value)}
                    placeholder="请输入更换原因"
                    rows={3}
                    className="mt-2"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setChangeDialogOpen(false)} disabled={changeLoading}>
                      取消
                    </Button>
                    <Button onClick={handleRequestChange} disabled={changeLoading || !changeReason.trim() || !newWalletAddress}>
                      {changeLoading ? "提交中..." : "提交申请"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {!showBindOption && (
            <Button onClick={disconnectWallet} variant="outline" className="w-full bg-transparent">
              断开钱包连接
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Wallet className="mr-2 h-4 w-4" />
          连接钱包
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>连接您的钱包</DialogTitle>
          <DialogDescription>选择一个钱包来连接到平台</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {walletOptions.map((option) => (
            <Card key={option.type} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-0"
                  onClick={() => handleConnect(option.type)}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="text-left">
                      <p className="font-medium">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </Button>
                {option.installUrl && (
                  <div className="mt-2 pt-2 border-t">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => window.open(option.installUrl, "_blank")}
                    >
                      没有 {option.name}？点击安装
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isConnecting && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">正在连接钱包...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
