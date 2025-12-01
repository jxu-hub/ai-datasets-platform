"use client"

import { useState } from "react"
import ProgressLink from "@/components/system/ProgressLink"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { useWallet } from "@/contexts/WalletContext"
import { useAuth } from "@/contexts/AuthContext"
import { useSystemConfig } from "@/contexts/SystemConfigContext"
import { Menu, Database, Search, Wallet, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 主导航头部组件
 */
export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pathname = usePathname()
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const { isConnected, address, balance } = wallet;
  const { isAuthenticated } = useAuth()
  const { config } = useSystemConfig()

  const publicNavigationItems = [
    {
      title: "首页",
      href: "/",
      icon: Database,
    },
    {
      title: "免费数据集",
      href: "/free-datasets",
      icon: Database,
    },
    {
      title: "付费数据集",
      href: "/paid-datasets",
      icon: Search,
    },
  ]

  const isActivePath = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("[v0] Failed to copy address:", error)
      }
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: string) => {
    const num = Number.parseFloat(bal)
    return num.toFixed(4)
  }

  const handleConnectWallet = async () => {
    await connectWallet()
  }

  const platformName = config?.platform.name || "AI数据集平台"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <ProgressLink href="/" className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{platformName}</span>
            </ProgressLink>
          </div>

          {/* Desktop Navigation - Only Public Pages */}
          <nav className="hidden md:flex items-center space-x-8">
            {publicNavigationItems.map((item) => {
              const Icon = item.icon
              return (
                <ProgressLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary",
                    isActivePath(item.href) ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </ProgressLink>
              )
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {/* Wallet Connection */}
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                {isConnected && address ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium">{formatAddress(address)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={handleCopyAddress}
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            )}
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatBalance(balance || "0")} ETH</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectWallet}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Wallet className="h-4 w-4" />
                    连接钱包
                  </Button>
                )}
              </div>
            )}

            {/* Auth Status */}
            <AuthStatus />
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-6">
                {isAuthenticated && (
                  <div className="pb-4 border-b">
                    {isConnected && address ? (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm font-medium">{formatAddress(address)}</span>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={handleCopyAddress}>
                              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatBalance(balance || "0")} ETH</span>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={handleConnectWallet} className="w-full bg-transparent">
                        <Wallet className="mr-2 h-4 w-4" />
                        连接钱包
                      </Button>
                    )}
                  </div>
                )}

                {/* Mobile Auth Status */}
                <div className="pb-4 border-b">
                  <AuthStatus />
                </div>

                {/* Mobile Navigation */}
                <nav className="flex flex-col space-y-2">
                  {publicNavigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <ProgressLink
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActivePath(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </ProgressLink>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
