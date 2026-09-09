import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { NATIVE_TOKEN_ADDRESS, ROBINHOOD_CHAIN, formatTokenAmount, type MainnetToken } from "@/lib/robinhood-chain"

type RpcTransaction = {
  to: string
  data: string
  value?: string
  gas?: string | null
  gasPrice?: string | null
}

type WalletStatus = "disconnected" | "connecting" | "connected" | "wrong-network" | "unavailable"

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

type Eip6963ProviderInfo = {
  uuid: string
  name: string
  icon: string
  rdns: string
}

type WalletOption = {
  id: string
  name: string
  icon?: string
  provider: Eip1193Provider
}

export type WalletBalance = {
  raw: string | null
  formatted: string | null
  error?: string
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

type WalletContextValue = {
  address: string | null
  chainId: number | null
  status: WalletStatus
  error: string | null
  isOnRobinhoodChain: boolean
  availableWallets: WalletOption[]
  refreshWallets: () => Promise<void>
  connect: (walletId?: string) => Promise<void>
  disconnect: () => Promise<void>
  switchToRobinhoodChain: () => Promise<void>
  getBalance: (token: MainnetToken) => Promise<string>
  getBalances: (tokens: MainnetToken[]) => Promise<Record<string, WalletBalance>>
  getAllowance: (token: MainnetToken, spender: string) => Promise<bigint>
  readContract: (to: string, data: string) => Promise<string>
  approve: (token: MainnetToken, spender: string, amount: bigint) => Promise<string>
  sendTransaction: (transaction: RpcTransaction) => Promise<string>
  getTransactionReceipt: (hash: string) => Promise<{ status: "pending" | "success" | "reverted" }>
  waitForReceipt: (hash: string) => Promise<{ status: "success" | "reverted" }>
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined)

function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No compatible browser wallet was found. Install or unlock MetaMask, Robinhood Wallet, or another EVM wallet.")
  }
  return window.ethereum
}

function parseChainId(value: unknown) {
  return typeof value === "string" ? Number.parseInt(value, 16) : null
}

function parseAccounts(value: unknown) {
  return Array.isArray(value) ? value.filter((account): account is string => typeof account === "string") : []
}

function encodeAddress(address: string) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0")
}

function encodeUint256(value: bigint) {
  return value.toString(16).padStart(64, "0")
}

function toRpcHex(value: string) {
  const parsed = BigInt(value)
  return `0x${parsed.toString(16)}`
}

function getErrorMessages(error: unknown, depth = 0): string[] {
  if (depth > 4 || error == null) return []
  if (typeof error === "string") return [error]
  if (error instanceof Error) {
    return [error.message, ...getErrorMessages(error.cause, depth + 1)].filter(Boolean)
  }
  if (typeof error !== "object") return []

  const record = error as Record<string, unknown>
  const directMessages = ["message", "shortMessage", "reason"]
    .map((key) => record[key])
    .filter((value): value is string => typeof value === "string")
  const nestedMessages = ["data", "error", "cause", "originalError"]
    .flatMap((key) => getErrorMessages(record[key], depth + 1))
  return [...new Set([...directMessages, ...nestedMessages])]
}

function getTransactionSimulationError(error: unknown) {
  const messages = getErrorMessages(error)
  const message = messages.join(" · ") || "The wallet could not simulate this transaction."

  if (/insufficient funds|insufficient balance/i.test(message)) {
    return "Transaction simulation failed because this wallet does not have enough ETH to cover the amount and network fee."
  }
  if (/insufficient allowance/i.test(message)) {
    return "The token approval is not active onchain yet. Wait a few seconds, refresh the quote, and try the swap again."
  }
  if (/execution reverted|reverted|failed to estimate gas|unpredictable gas/i.test(message)) {
    return "Transaction simulation failed on Robinhood Chain. Refresh the quote and check your token balance before trying again."
  }
  return `Transaction simulation failed before MetaMask confirmation: ${message}`
}

async function readRawBalance(provider: Eip1193Provider, activeAddress: string, token: MainnetToken) {
  return token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
    ? await provider.request({ method: "eth_getBalance", params: [activeAddress, "latest"] }) as string
    : await provider.request({
      method: "eth_call",
      params: [{ to: token.address, data: `0x70a08231${encodeAddress(activeAddress)}` }, "latest"],
    }) as string
}

function getInjectedWalletName(provider: Eip1193Provider) {
  const detected = provider as Eip1193Provider & {
    isMetaMask?: boolean
    isRabby?: boolean
    isCoinbaseWallet?: boolean
  }
  if (detected.isMetaMask) return "MetaMask"
  if (detected.isRabby) return "Rabby"
  if (detected.isCoinbaseWallet) return "Coinbase Wallet"
  return "Browser wallet"
}

function discoverWallets() {
  if (typeof window === "undefined") return Promise.resolve<WalletOption[]>([])

  return new Promise<WalletOption[]>((resolve) => {
    const announced = new Map<string, WalletOption>()
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<{ info?: Eip6963ProviderInfo; provider?: Eip1193Provider }>).detail
      if (!detail?.info || !detail.provider || !detail.info.uuid) return
      announced.set(detail.info.uuid, {
        id: detail.info.uuid,
        name: detail.info.name || "Browser wallet",
        icon: detail.info.icon,
        provider: detail.provider,
      })
    }

    window.addEventListener("eip6963:announceProvider", onAnnounce)
    window.dispatchEvent(new Event("eip6963:requestProvider"))
    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce)
      if (announced.size > 0) {
        resolve([...announced.values()])
        return
      }
      if (window.ethereum) {
        resolve([{ id: "injected", name: getInjectedWalletName(window.ethereum), provider: window.ethereum }])
        return
      }
      resolve([])
    }, 250)
  })
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [status, setStatus] = useState<WalletStatus>("disconnected")
  const [error, setError] = useState<string | null>(null)
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([])
  const [activeProviderVersion, setActiveProviderVersion] = useState(0)
  const activeProviderRef = useRef<Eip1193Provider | null>(null)
  const shouldRestoreWalletRef = useRef(true)

  const syncProviderState = useCallback(async (requestAccounts: boolean, provider: Eip1193Provider) => {
    const [rawAccounts, rawChainId] = await Promise.all([
      provider.request({ method: requestAccounts ? "eth_requestAccounts" : "eth_accounts" }),
      provider.request({ method: "eth_chainId" }) as Promise<string>,
    ])
    const accounts = parseAccounts(rawAccounts)
    const nextAddress = accounts[0] ?? null
    const nextChainId = parseChainId(rawChainId)
    setAddress(nextAddress)
    setChainId(nextChainId)
    setStatus(!nextAddress ? "disconnected" : nextChainId === ROBINHOOD_CHAIN.id ? "connected" : "wrong-network")
  }, [])

  const refreshWallets = useCallback(async () => {
    const wallets = await discoverWallets()
    setAvailableWallets(wallets)
    if (wallets.length === 0 && !window.ethereum) setStatus("unavailable")
    if (wallets.length > 0) setStatus((current) => current === "unavailable" ? "disconnected" : current)
  }, [])

  useEffect(() => {
    void refreshWallets()
    const provider = activeProviderRef.current ?? window.ethereum
    if (!provider) {
      setStatus("unavailable")
      return
    }
    if (!activeProviderRef.current && !shouldRestoreWalletRef.current) return

    activeProviderRef.current = provider
    void syncProviderState(false, provider).catch(() => setStatus("disconnected"))
    const onAccountsChanged = () => void syncProviderState(false, provider).catch(() => setStatus("disconnected"))
    const onChainChanged = () => void syncProviderState(false, provider).catch(() => setStatus("disconnected"))
    const onDisconnect = () => {
      setAddress(null)
      setChainId(null)
      setStatus("disconnected")
    }

    provider.on?.("accountsChanged", onAccountsChanged)
    provider.on?.("chainChanged", onChainChanged)
    provider.on?.("disconnect", onDisconnect)
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged)
      provider.removeListener?.("chainChanged", onChainChanged)
      provider.removeListener?.("disconnect", onDisconnect)
    }
  }, [activeProviderVersion, refreshWallets, syncProviderState])

  const connect = useCallback(async (walletId?: string) => {
    setError(null)
    setStatus("connecting")
    const wallet = availableWallets.find((candidate) => candidate.id === walletId) ?? availableWallets[0]
    const provider = wallet?.provider ?? getProvider()
    shouldRestoreWalletRef.current = true
    activeProviderRef.current = provider
    setActiveProviderVersion((version) => version + 1)
    try {
      await syncProviderState(true, provider)
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "Wallet connection was rejected."
      setError(message)
      setStatus(availableWallets.length > 0 || window.ethereum ? "disconnected" : "unavailable")
      throw new Error(message)
    }
  }, [availableWallets, syncProviderState])

  const disconnect = useCallback(async () => {
    const provider = activeProviderRef.current
    shouldRestoreWalletRef.current = false
    activeProviderRef.current = null
    setActiveProviderVersion((version) => version + 1)
    setAddress(null)
    setChainId(null)
    setError(null)
    setStatus(availableWallets.length > 0 || window.ethereum ? "disconnected" : "unavailable")
    if (provider) {
      await provider.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      }).catch(() => undefined)
    }
  }, [availableWallets.length])

  const switchToRobinhoodChain = useCallback(async () => {
    const provider = activeProviderRef.current ?? getProvider()
    setError(null)
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ROBINHOOD_CHAIN.hexId }],
      })
    } catch (switchError) {
      const code = typeof switchError === "object" && switchError && "code" in switchError ? (switchError as { code?: number }).code : undefined
      if (code !== 4902) {
        const message = switchError instanceof Error ? switchError.message : "Unable to switch network."
        setError(message)
        throw new Error(message)
      }
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: ROBINHOOD_CHAIN.hexId,
          chainName: ROBINHOOD_CHAIN.name,
          nativeCurrency: ROBINHOOD_CHAIN.nativeCurrency,
          rpcUrls: [ROBINHOOD_CHAIN.rpcUrl],
          blockExplorerUrls: [ROBINHOOD_CHAIN.explorerUrl],
        }],
      })
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ROBINHOOD_CHAIN.hexId }],
      })
    }
    const activeChainId = parseChainId(await provider.request({ method: "eth_chainId" }))
    if (activeChainId !== ROBINHOOD_CHAIN.id) {
      throw new Error("Robinhood Chain was added, but your wallet did not switch networks. Switch networks in your wallet and try again.")
    }
    await syncProviderState(false, provider)
  }, [syncProviderState])

  const requireConnectedProvider = useCallback(async () => {
    const provider = activeProviderRef.current ?? getProvider()
    const [rawAccounts, rawChainId] = await Promise.all([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" }) as Promise<string>,
    ])
    const accounts = parseAccounts(rawAccounts)
    const activeAddress = accounts[0]
    const activeChainId = parseChainId(rawChainId)

    if (!activeAddress) {
      throw new Error("Connect a wallet first.")
    }
    if (activeChainId !== ROBINHOOD_CHAIN.id) {
      throw new Error("Switch to Robinhood Chain before continuing.")
    }
    if (!address || activeAddress.toLowerCase() !== address.toLowerCase()) {
      void syncProviderState(false, provider)
      throw new Error("Your active wallet account changed. Review the quote and try again.")
    }
    return { provider, activeAddress }
  }, [address, syncProviderState])

  const getBalance = useCallback(async (token: MainnetToken) => {
    const { provider, activeAddress } = await requireConnectedProvider()
    const raw = await readRawBalance(provider, activeAddress, token)
    return formatTokenAmount(BigInt(raw), token.decimals)
  }, [requireConnectedProvider])

  const getBalances = useCallback(async (tokens: MainnetToken[]) => {
    const { provider, activeAddress } = await requireConnectedProvider()
    const uniqueTokens = [...new Map(tokens.map((token) => [token.id, token])).values()]
    let nextIndex = 0
    const workerCount = Math.min(8, uniqueTokens.length)

    const readWorker = async () => {
      const entries: Array<[string, WalletBalance]> = []
      while (nextIndex < uniqueTokens.length) {
        const token = uniqueTokens[nextIndex]
        nextIndex += 1
        try {
          const raw = await readRawBalance(provider, activeAddress, token)
          entries.push([token.id, {
            raw,
            formatted: formatTokenAmount(BigInt(raw), token.decimals),
          }])
        } catch (balanceError) {
          entries.push([token.id, {
            raw: null,
            formatted: null,
            error: balanceError instanceof Error ? balanceError.message : "Unable to read this balance.",
          }])
        }
      }
      return entries
    }

    const results = await Promise.all(Array.from({ length: workerCount }, () => readWorker()))
    return Object.fromEntries(results.flat())
  }, [requireConnectedProvider])

  const getAllowance = useCallback(async (token: MainnetToken, spender: string) => {
    if (token.isNative) return 2n ** 256n - 1n
    const { provider, activeAddress } = await requireConnectedProvider()
    const raw = await provider.request({
      method: "eth_call",
      params: [{ to: token.address, data: `0xdd62ed3e${encodeAddress(activeAddress)}${encodeAddress(spender)}` }, "latest"],
    }) as string
    return BigInt(raw)
  }, [requireConnectedProvider])

  const readContract = useCallback(async (to: string, data: string) => {
    const { provider } = await requireConnectedProvider()
    const result = await provider.request({
      method: "eth_call",
      params: [{ to, data }, "latest"],
    })
    if (typeof result !== "string") {
      throw new Error("The contract returned an unreadable response.")
    }
    return result
  }, [requireConnectedProvider])

  const sendTransaction = useCallback(async (transaction: RpcTransaction) => {
    const { provider, activeAddress } = await requireConnectedProvider()
    const request: {
      from: string
      to: string
      data: string
      value?: string
      gas?: string
      gasPrice?: string
      maxFeePerGas?: string
      maxPriorityFeePerGas?: string
    } = {
      from: activeAddress,
      to: transaction.to,
      data: transaction.data,
      value: transaction.value ? toRpcHex(transaction.value) : undefined,
    }

    try {
      const [latestBlock, latestGasPrice, latestPriorityFee] = await Promise.all([
        provider.request({
          method: "eth_getBlockByNumber",
          params: ["latest", false],
        }).catch(() => null),
        provider.request({ method: "eth_gasPrice" }).catch(() => null),
        provider.request({ method: "eth_maxPriorityFeePerGas" }).catch(() => null),
      ])

      const blockBaseFee = latestBlock && typeof latestBlock === "object" && "baseFeePerGas" in latestBlock &&
        typeof latestBlock.baseFeePerGas === "string" ? BigInt(latestBlock.baseFeePerGas) : null
      const providerGasPrice = typeof latestGasPrice === "string" && latestGasPrice.startsWith("0x")
        ? BigInt(latestGasPrice)
        : null
      const quotedGasPrice = transaction.gasPrice != null ? BigInt(transaction.gasPrice) : null
      const suggestedGasPrice = providerGasPrice ?? quotedGasPrice
      const providerPriorityFee = typeof latestPriorityFee === "string" && latestPriorityFee.startsWith("0x")
        ? BigInt(latestPriorityFee)
        : 0n

      if (blockBaseFee != null) {
        // Robinhood Chain exposes EIP-1559 base fees. Use a small priority fee
        // and keep maxFee safely above the current base fee, even if the next
        // block rises before MetaMask submits the transaction.
        const priorityFee = providerPriorityFee > 0n ? providerPriorityFee : 1_000_000n
        const baseFeeWithPriority = blockBaseFee + priorityFee
        const bumpedSuggestion = suggestedGasPrice != null ? (suggestedGasPrice * 125n) / 100n : 0n
        const maxFee = [baseFeeWithPriority, blockBaseFee * 2n + priorityFee, bumpedSuggestion]
          .reduce((highest, value) => value > highest ? value : highest, 0n)

        request.maxFeePerGas = `0x${maxFee.toString(16)}`
        request.maxPriorityFeePerGas = `0x${priorityFee.toString(16)}`
      } else if (suggestedGasPrice != null) {
        // Legacy fallback for providers that omit baseFeePerGas.
        request.gasPrice = `0x${((suggestedGasPrice * 125n) / 100n).toString(16)}`
      } else {
        throw new Error("The wallet did not provide current network fee data.")
      }

      const estimatedGas = await provider.request({
        method: "eth_estimateGas",
        params: [request],
      }) as string
      const estimatedGasWithBuffer = (BigInt(estimatedGas) * 120n) / 100n
      request.gas = `0x${estimatedGasWithBuffer.toString(16)}`
    } catch (simulationError) {
      throw new Error(getTransactionSimulationError(simulationError))
    }

    return await provider.request({ method: "eth_sendTransaction", params: [request] }) as string
  }, [requireConnectedProvider])

  const approve = useCallback(async (token: MainnetToken, spender: string, amount: bigint) => {
    if (token.isNative) {
      throw new Error("ETH does not require token approval.")
    }
    return sendTransaction({
      to: token.address,
      data: `0x095ea7b3${encodeAddress(spender)}${encodeUint256(amount)}`,
      value: "0",
    })
  }, [sendTransaction])

  const getTransactionReceipt = useCallback(async (hash: string) => {
    const { provider } = await requireConnectedProvider()
    const receipt = await provider.request({ method: "eth_getTransactionReceipt", params: [hash] }) as { status?: string } | null
    if (!receipt) return { status: "pending" as const }
    return { status: receipt.status === "0x1" ? "success" as const : "reverted" as const }
  }, [requireConnectedProvider])

  const waitForReceipt = useCallback(async (hash: string) => {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const receipt = await getTransactionReceipt(hash)
      if (receipt.status !== "pending") return receipt
      await new Promise((resolve) => window.setTimeout(resolve, 2_000))
    }
    throw new Error("Transaction is still pending. Check it in Blockscout.")
  }, [getTransactionReceipt])

  const value = useMemo(() => ({
    address,
    chainId,
    status,
    error,
    isOnRobinhoodChain: chainId === ROBINHOOD_CHAIN.id,
    availableWallets,
    refreshWallets,
    connect,
    disconnect,
    switchToRobinhoodChain,
    getBalance,
    getBalances,
    getAllowance,
    readContract,
    approve,
    sendTransaction,
    getTransactionReceipt,
    waitForReceipt,
  }), [address, chainId, status, error, availableWallets, refreshWallets, connect, disconnect, switchToRobinhoodChain, getBalance, getBalances, getAllowance, readContract, approve, sendTransaction, getTransactionReceipt, waitForReceipt])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider.")
  }
  return context
}