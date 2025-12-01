"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWallet } from "@/contexts/WalletContext"
import { useBlockchain } from "@/hooks/useBlockchain"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Wallet, AlertTriangle, CheckCircle, Loader2, ExternalLink, DollarSign } from "lucide-react"
import { WalletAlert } from "@/components/wallet/WalletAlert"
import type { Dataset } from "@/types"
import { toast } from "sonner"

interface PurchaseModalProps {
  dataset: Dataset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PurchaseModal({ dataset, open, onOpenChange, onSuccess }: PurchaseModalProps) {
  const { user, isAuthenticated, hasWallet } = useAuth()
  const { wallet, isWalletBound } = useWallet()
  const { sendPayment, isProcessing, error, clearError } = useBlockchain()

  const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">("confirm")
  const [transactionHash, setTransactionHash] = useState<string>("")

  const boundAddress = user?.wallet?.address || ""
  const isWalletAddressConsistent =
    boundAddress && wallet.address && boundAddress.toLowerCase() === wallet.address.toLowerCase()

  // Check if user can purchase
  const canPurchase = isAuthenticated && hasWallet && isWalletBound && wallet.isConnected && isWalletAddressConsistent

  // Handle purchase
  const handlePurchase = async () => {
    if (!dataset || !user || !canPurchase) return
    toast("正在处理购买，请在钱包中确认交易...")
    setStep("processing")
    clearError()

    try {
      console.log("[v0] Starting purchase process for dataset:", dataset.id)

      // Send blockchain payment
      const result = await sendPayment({
        datasetId: dataset.id.toString(),
        price: dataset.price.toString(),
        sellerAddress: "0x742d35Cc6634C0532925a3b8D4C9db96590c4C5d", // Mock seller address
      })

      if (result.success) {
        setTransactionHash(result.hash)
        setStep("success")
        toast.success("购买成功，您现在可以下载该数据集。")

        // Call success callback after a delay
        setTimeout(() => {
          onSuccess?.()
          onOpenChange(false)
          // Reset modal state
          setTimeout(() => {
            setStep("confirm")
            setTransactionHash("")
          }, 500)
        }, 2000)
      } else {
        setStep("error")
        toast.error("购买失败，请稍后重试")
      }
    } catch (err) {
      console.error("[v0] Purchase error:", err)
      setStep("error")
      toast.error("购买失败，请稍后重试")
    }
  }

  // Reset modal when closed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      setStep("confirm")
      setTransactionHash("")
      clearError()
    }
    onOpenChange(newOpen)
  }

  if (!dataset) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            购买数据集
          </DialogTitle>
          <DialogDescription>确认购买以下数据集</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dataset Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-medium line-clamp-2">{dataset.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{dataset.description}</p>
              </div>
              <Badge variant="destructive">¥{dataset.price}</Badge>
            </div>

            <div className="flex flex-wrap gap-1">
              {dataset.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Purchase Steps */}
          {step === "confirm" && (
            <div className="space-y-4">
              {isAuthenticated && hasWallet && isWalletBound && wallet.isConnected && !isWalletAddressConsistent && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <p className="font-medium">钱包地址不匹配</p>
                    <p className="text-sm">
                      您当前连接的钱包地址与绑定的钱包地址不一致。为了安全起见，请使用绑定的钱包地址进行交易。
                    </p>
                    <div className="text-xs space-y-1 mt-2">
                      <p>
                        绑定地址:{" "}
                        {boundAddress ? `${boundAddress.slice(0, 6)}...${boundAddress.slice(-4)}` : "未绑定"}
                      </p>
                      <p>
                        当前地址:{" "}
                        {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "未连接"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Check */}
              {!canPurchase ? (
                <WalletAlert action="purchase" />
              ) : (
                <div className="space-y-3">
                  {/* Wallet Info */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm">钱包余额</span>
                    </div>
                    <span className="font-medium">{wallet.balance} ETH</span>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>数据集价格</span>
                      <span>¥{dataset.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gas费用 (预估)</span>
                      <span>~0.002 ETH</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>总计</span>
                      <span>¥{dataset.price} + Gas</span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <Button onClick={handlePurchase} className="w-full" size="lg">
                    <DollarSign className="mr-2 h-4 w-4" />
                    确认购买
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="font-medium mb-2">处理交易中...</h3>
              <p className="text-sm text-muted-foreground">请在钱包中确认交易，这可能需要几分钟时间</p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">购买成功！</h3>
              <p className="text-sm text-muted-foreground mb-4">您现在可以下载这个数据集了</p>
              {transactionHash && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>交易哈希:</span>
                  <code className="bg-muted px-2 py-1 rounded">{transactionHash.slice(0, 10)}...</code>
                  <Button size="sm" variant="ghost" className="h-auto p-1">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="space-y-2">
                  <p className="font-medium">购买失败</p>
                  <p className="text-sm">
                    购买失败，请稍后重试。
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("confirm")} className="flex-1">
                  重试
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
