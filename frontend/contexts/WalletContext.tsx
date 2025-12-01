"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./AuthContext"
import { ethers } from 'ethers'
import { bindWalletApi, changeWalletApi } from "@/lib/api/wallet"
import { toast } from 'sonner'
import { WalletChangeRequest } from "@/types"
import contract from '@/contract/contractConnect'
import { ROLE_MAP } from '@/lib/constants/roles'

export type WalletType = "metamask"

// Wallet state interface
export interface WalletState {
  isConnected: boolean
  address: string | null
  balance: string | null
}

// Wallet context interface
export interface WalletContextType {
  wallet: WalletState
  connectWallet: () => Promise<boolean>
  disconnectWallet: () => Promise<void>
  bindWallet: () => Promise<{ success: boolean, msg: string }>
  requestWalletChange: (walletChange: WalletChangeRequest) => Promise<{ success: boolean, msg: string }>
  checkWalletConsistency: () => boolean
  verifyWalletAddress: boolean
  isConnecting: boolean
  error: string | null
  hasWalletChangeRequest: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasWalletChangeRequest, setHasWalletChangeRequest] = useState(false)

  // 判断当前钱包是否为该用户绑定的钱包
  const verifyWalletAddress = Boolean(
    user?.walletAddress && wallet.address && user.walletAddress.toString().toLowerCase() === wallet.address.toLowerCase(),
  )

  const getMetaMaskProvider = () => {
    if (typeof window !== "undefined") {
      // Check if MetaMask is installed
      if ((window as any).ethereum && (window as any).ethereum.isMetaMask) {
        return (window as any).ethereum
      }
      // Fallback to mock for development if MetaMask not available
      return 
    }
    return null
  }

  // connectWallet: 用户手动连接成功后，设置 sessionStorage 标记
  const connectWallet = async (): Promise<boolean> => {
    setIsConnecting(true)
    setError(null)
    try {
      const provider = getMetaMaskProvider()
      if (!provider) {
        toast.error("未检测到 MetaMask，请先安装 MetaMask 插件")
        setError("MetaMask not found. Please install MetaMask extension.")
        return false
      }
      // 只需一行代码即可弹出授权
      const accounts = await provider.request({ method: "eth_requestAccounts" })
      if (!accounts || accounts.length === 0) {
        toast.error("未检测到钱包账户，请检查MetaMask")
        setError("No accounts found")
        return false
      }
      // 获取余额
      const balance = await provider.request({ method: "eth_getBalance", params: [accounts[0], "latest"] })
      const balanceInEth = (Number.parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)
      setWallet({
        isConnected: true,
        address: accounts[0],
        balance: balanceInEth,
      })
      if (typeof window !== "undefined") {
        sessionStorage.setItem("wallet_auto_connect", "1")
      }
      provider.on("accountsChanged", handleAccountsChanged)
      provider.on("chainChanged", handleChainChanged)
      return true
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || JSON.stringify(err) || "连接钱包失败"
      toast.error(msg)
      setError(msg)
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  // disconnectWallet: 断开连接时清除 sessionStorage 标记
  const disconnectWallet = async (): Promise<void> => {
    const provider = getMetaMaskProvider()
    if (provider) {
      provider.removeListener("accountsChanged", handleAccountsChanged)
      provider.removeListener("chainChanged", handleChainChanged)
    }
    setWallet({
      isConnected: false,
      address: null,
      balance: null,
    })
    setError(null)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("wallet_auto_connect")
    }
  }

  // 绑定钱包
  const bindWallet = async (): Promise<{ success: boolean, msg: string }> => {
    if (!wallet.address || !user) {
      setError("Wallet not connected or user not logged in")
      return { success: false, msg: "Wallet not connected or user not logged in" }
    }
    try {
      const roleNum = await contract.roles(wallet.address)
      const role = ROLE_MAP[roleNum]
      const res = await bindWalletApi(wallet.address, role)
      return { success: true, msg: res }
    } catch (err: any) {
      setError(err.message || "钱包绑定失败")
      return { success: false, msg: err.message || "钱包绑定失败" }
    }
  }

  // 检查钱包一致性
  const checkWalletConsistency = (): boolean => {
    if (!user?.walletAddress || !wallet.address) {
      return true // No binding or no connection, no inconsistency
    }
    return user.walletAddress.toString().toLowerCase() === wallet.address.toLowerCase()
  }

  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setWallet((prev) => ({ ...prev, address: accounts[0] }))
      // 立即刷新余额
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        const balance = await provider.getBalance(accounts[0])
        const balanceInEth = ethers.formatEther(balance)
        setWallet((prev) => ({ ...prev, balance: Number(balanceInEth).toFixed(4) }))
      } catch {}
    }
  }

  // Handle chain changes
  const handleChainChanged = (chainId: string) => {
    try {
      // 你可以根据实际支持的链ID进行判断，比如只支持某些链
      const supportedChains = [1, 5, 11155111] // 以太坊主网、Goerli、Sepolia等
      const chainIdNum = Number.parseInt(chainId, 16)
      if (!supportedChains.includes(chainIdNum)) {
        // 只弹窗提示，不设置全局error
        if (typeof window !== 'undefined') {
          import('sonner').then(({ toast }) => {
            toast.error('当前区块链网络不受支持，请切换到主网或测试网')
          })
        }
        return
      }
      setWallet((prev) => ({ ...prev, chainId: chainIdNum }))
    } catch (e) {
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => {
          toast.error('切换区块链网络时发生错误')
        })
      }
    }
  }

  // 更换钱包
  const requestWalletChange = async (walletChange: WalletChangeRequest): Promise<{ success: boolean, msg: string }> => {
    if (!user || !user.walletAddress) {
      setError("用户未登录或未绑定钱包")
      return { success: false, msg: "用户未登录或未绑定钱包" }
    }

    try {
      const res = await changeWalletApi(walletChange)
      if (res && res.success) {
        setHasWalletChangeRequest(true)
        return { success: true , msg: res.msg }
      } else {
        setError(res.msg || "提交更换申请失败")
        return { success: false, msg: res.msg }
      }
    } catch (err: any) {
      setError(err.message || "提交更换申请失败")
      return { success: false, msg: "提交更换申请失败" }
    }
  }

  // useEffect(() => {
  //   if (user && typeof window !== "undefined") {
  //     const existingRequests = JSON.parse(sessionStorage.getItem("wallet_change_requests") || "[]")
  //     const userRequest = existingRequests.find(
  //       (req: WalletChangeRequest) => req.userId === user.id && req.status === "pending",
  //     )
  //     setHasWalletChangeRequest(!!userRequest)
  //   }
  // }, [user])

  // useEffect 增强区块监听和网络切换处理
  useEffect(() => {
    let provider: ethers.Provider | null = null
    let blockListener: any = null
    let interval: any = null
    let networkListener: any = null
    if (wallet.isConnected && wallet.address && sessionStorage.getItem("wallet_auto_connect") === "1") {
      try {
        provider = new ethers.BrowserProvider((window as any).ethereum)
        // 监听区块
        blockListener = async () => {
          try {
            const balance = await provider!.getBalance(wallet.address!)
            const balanceInEth = ethers.formatEther(balance)
            setWallet((prev) => ({ ...prev, balance: Number(balanceInEth).toFixed(4) }))
          } catch (err: any) {
            if (err.code === "NETWORK_ERROR" || err.message?.includes("network changed")) {
              toast.error("检测到网络切换，请重新连接钱包或刷新页面")
              disconnectWallet()
            } else {
              toast.error("获取余额失败：" + (err.message || "未知错误"))
            }
          }
        }
        provider.on('block', blockListener)
        // 保险起见，定时刷新
        interval = setInterval(blockListener, 10000)
        // 监听网络切换
        networkListener = (newNetwork: any, oldNetwork: any) => {
          if (oldNetwork) {
            toast.error("检测到网络切换，请重新连接钱包")
            disconnectWallet()
          }
        }
        provider.on('network', networkListener)
      } catch {}
    }
    return () => {
      if (provider && blockListener) provider.off('block', blockListener)
      if (provider && networkListener) provider.off('network', networkListener)
      if (interval) clearInterval(interval)
    }
  }, [wallet.isConnected, wallet.address])

  // useEffect: 只有 sessionStorage 有标记时自动连接
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window !== "undefined") {
        const autoConnectFlag = sessionStorage.getItem("wallet_auto_connect")
        if (autoConnectFlag === "1") {
          const provider = getMetaMaskProvider()
          if (provider) {
            try {
              const accounts = await provider.request({ method: "eth_accounts" })
              if (accounts && accounts.length > 0) {
                try {
                  await connectWallet()
                } catch (err) {
                  console.log("[v0] Auto-connect failed:", err)
                }
              }
            } catch (err) {
              console.log("[v0] Auto-connect failed:", err)
            }
          }
        }
      }
    }
    autoConnect()
  }, [])

  const value: WalletContextType = {
    wallet,
    connectWallet,
    disconnectWallet,
    bindWallet,
    requestWalletChange,
    checkWalletConsistency,
    verifyWalletAddress,
    isConnecting,
    error,
    hasWalletChangeRequest,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// 保持 useWallet 返回结构统一
export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context;
}
