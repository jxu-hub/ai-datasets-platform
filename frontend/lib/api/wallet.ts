import axios from "axios"
import { WalletChangeRequest } from "@/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE

// 查询钱包绑定状态
export async function checkHasWallet() {
  const res = await axios.get(`${BASE_URL}/wallet/isHasWallet`, { withCredentials: true })
  console.log("lib/api/wallet: checkHasWallet: res = ", res.data.data)
  if (res.data.code === 200) {
    return res.data.data.message // { hasWallet: boolean, msg?: string }
  } else {
    throw new Error(res.data.msg || '查询钱包绑定状态失败')
  }
}



// 绑定钱包
export async function bindWalletApi(address: string, role: string) {
  const res = await axios.post(`${BASE_URL}/wallet/bind-wallet`, { walletAddress: address, role: role }, { withCredentials: true })
  if (res.data.code === 201) {
    return res.data.data.message
  } else {
    throw new Error(res.data.msg)
  }
}

// 更换钱包
export async function changeWalletApi(walletChange: WalletChangeRequest) {
  const res = await axios.post(`${BASE_URL}/wallet/change-wallet`, walletChange , { withCredentials: true })
  console.log("lib/api/wallet: changeWalletApi: res = ", res)
  if (res.data.code === 200) {
    return { success: true, msg: res.data.data.message } 
  } else {
    return { success: false, msg: res.data.msg } 
  }
}