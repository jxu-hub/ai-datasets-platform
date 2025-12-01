"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Wallet } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useWallet } from "@/contexts/WalletContext"
import Link from "next/link"

interface WalletAlertProps {
  action?: "purchase" | "download" | "general"
  className?: string
}

export function WalletAlert({ action = "general", className }: WalletAlertProps) {
  const { wallet, verifyWalletAddress } = useWallet()
  const { user, isAuthenticated } = useAuth()
  const boundWalletAddress = user?.walletAddress || ""

  // Not logged in
  if (!isAuthenticated) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>请先登录后再进行{action === "purchase" ? "购买" : "操作"}</span>
          <Button asChild size="sm">
            <Link href="/login">立即登录</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Wallet not connected
  if (!wallet.isConnected) {
    return (
      <Alert className={className}>
        <Wallet className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>请先连接钱包后再进行{action === "purchase" ? "购买" : "操作"}</span>
          <Button asChild size="sm">
            <Link href="/wallet">连接钱包</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Wallet not bound
  if (!verifyWalletAddress) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>请先绑定钱包到您的账户后再进行{action === "purchase" ? "购买" : "操作"}</span>
          <Button asChild size="sm">
            <Link href="/wallet">绑定钱包</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Wallet address consistency check
  const isWalletAddressConsistent =
    boundWalletAddress && wallet.address &&
    boundWalletAddress.toLowerCase() === wallet.address.toLowerCase()

  // Wallet address mismatch alert
  if (wallet.isConnected && verifyWalletAddress && !isWalletAddressConsistent) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="font-medium">钱包地址不匹配</p>
          <p className="text-sm">请切换到您绑定的钱包地址后再进行{action === "purchase" ? "购买" : "操作"}。</p>
          <div className="text-xs space-y-1">
            <p>
              绑定地址: {boundWalletAddress
                ? `${boundWalletAddress.slice(0, 6)}...${boundWalletAddress.slice(-4)}`
                : "未绑定"}
            </p>
            <p>
              当前地址: {wallet.address
                ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                : "未连接"}
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // All checks passed - no alert needed
  return null
}
