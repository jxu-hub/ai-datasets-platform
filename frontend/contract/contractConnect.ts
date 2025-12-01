import { ethers } from 'ethers';
import abi from './contractABI/abi.json';

// 读取环境变量
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
const deployerAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS as string;

if (!contractAddress) {
  throw new Error('请在 .env 文件中配置 NEXT_PUBLIC_CONTRACT_ADDRESS');
}
if (!deployerAddress) {
  throw new Error('请在 .env 文件中配置 NEXT_PUBLIC_DEPLOYER_ADDRESS');
}

// 获取 provider（这里以 MetaMask/浏览器注入为例）
export function getProvider() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  throw new Error('未检测到以太坊钱包(如 MetaMask)');
}

// 获取合约实例
export async function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || (await getProvider());
  return new ethers.Contract(contractAddress, abi, provider);
}

/**
 * 获取可读可写的合约实例（带签名，需用户授权）
 */
export async function getWritableContract() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    // 请求用户授权
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, abi, signer);
  }
  throw new Error('未检测到以太坊钱包(如 MetaMask)');
}

// 默认导出合约对象（只读，使用 provider）
const defaultProvider = typeof window !== 'undefined' && (window as any).ethereum
  ? new ethers.BrowserProvider((window as any).ethereum)
  : ethers.getDefaultProvider();

const contract = new ethers.Contract(contractAddress, abi, defaultProvider);

export default contract;

export { contractAddress, deployerAddress };
