export const ROBINHOOD_CHAIN = {
  id: 4663,
  hexId: "0x1237",
  name: "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorerUrl: "https://robinhoodchain.blockscout.com",
} as const

export const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

export type MainnetToken = {
  id: string
  address: string
  symbol: string
  name: string
  decimals: number
  category: "crypto" | "stock" | "etf"
  logoUrl: string | null
  isNative?: boolean
}

// Default assets are rendered before the verified live catalog arrives. The API
// expands this list with the active official Robinhood Stock Token registry.
export const MAINNET_TOKENS: MainnetToken[] = [
  {
    id: "eth",
    address: NATIVE_TOKEN_ADDRESS,
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    isNative: true,
  },
  {
    id: "weth",
    address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    id: "usdg",
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    symbol: "USDG",
    name: "Global Dollar",
    decimals: 6,
    category: "crypto",
    logoUrl: "https://globaldollar.com/favicon.ico",
  },
  {
    id: "usde",
    address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    symbol: "USDe",
    name: "Ethena USDe",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/33613/small/USDE.png",
  },
  {
    id: "link",
    address: "0x492641F648a4986844848E0beFE66D14817bCE34",
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  },
]

export function formatTokenAmount(value: bigint, decimals: number, maximumFractionDigits = 6) {
  const base = 10n ** BigInt(decimals)
  const whole = value / base
  const fraction = (value % base).toString().padStart(decimals, "0").slice(0, maximumFractionDigits).replace(/0+$/, "")
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function parseTokenAmount(value: string, decimals: number) {
  const normalized = value.trim()
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a valid amount.")
  }

  const [whole, fraction = ""] = normalized.split(".")
  if (fraction.length > decimals) {
    throw new Error(`This token supports up to ${decimals} decimal places.`)
  }

  return BigInt(`${whole}${fraction.padEnd(decimals, "0")}`)
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}