/**
 * Wallet utility functions
 */

// Validate Ethereum address format
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Format wallet address for display
export function formatWalletAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length < startChars + endChars) {
    return address
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

// Convert wei to ETH
export function weiToEth(wei: string | number): string {
  const weiValue = typeof wei === "string" ? Number.parseInt(wei, 16) : wei
  return (weiValue / Math.pow(10, 18)).toFixed(4)
}

// Convert ETH to wei
export function ethToWei(eth: string | number): string {
  const ethValue = typeof eth === "string" ? Number.parseFloat(eth) : eth
  return (ethValue * Math.pow(10, 18)).toString(16)
}

// Get chain name from chain ID
export function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: "Ethereum Mainnet",
    3: "Ropsten Testnet",
    4: "Rinkeby Testnet",
    5: "Goerli Testnet",
    42: "Kovan Testnet",
    137: "Polygon Mainnet",
    80001: "Polygon Mumbai Testnet",
    56: "BSC Mainnet",
    97: "BSC Testnet",
  }
  return chains[chainId] || `Chain ${chainId}`
}

// Check if chain is supported
export function isSupportedChain(chainId: number): boolean {
  const supportedChains = [1, 137, 56] // Ethereum, Polygon, BSC
  return supportedChains.includes(chainId)
}

// Generate wallet connection deep link
export function generateWalletConnectUri(uri: string): string {
  return `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`
}

// Validate transaction hash
export function isValidTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

// Format balance for display
export function formatBalance(balance: string | number, decimals = 4): string {
  const balanceValue = typeof balance === "string" ? Number.parseFloat(balance) : balance
  if (balanceValue === 0) return "0"
  if (balanceValue < 0.0001) return "< 0.0001"
  return balanceValue.toFixed(decimals)
}
