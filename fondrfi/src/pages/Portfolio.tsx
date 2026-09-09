import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "wouter"
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import {
  getPortfolioPrices,
  useGetSwapAssets,
  type PortfolioPrice,
} from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog"
import { TokenAvatar } from "@/components/swap/TokenAvatar"
import { useWallet, type WalletBalance } from "@/contexts/wallet-context"
import {
  MAINNET_TOKENS,
  ROBINHOOD_CHAIN,
  shortenAddress,
  type MainnetToken,
} from "@/lib/robinhood-chain"

const USDG_DECIMALS = 6n
const MAX_PRICED_ASSETS = 30

type PortfolioHolding = {
  token: MainnetToken
  balance: WalletBalance
  price: PortfolioPrice | null
  valueRawUsd: bigint | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again."
}

function formatUsdRaw(raw: bigint) {
  const divisor = 10n ** USDG_DECIMALS
  const whole = raw / divisor
  const fraction = (raw % divisor).toString().padStart(Number(USDG_DECIMALS), "0")
  const amount = Number(`${whole}.${fraction}`)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: amount > 0 && amount < 1 ? 4 : 2,
  }).format(amount)
}

function formatTokenBalance(value: string) {
  const [whole, fraction] = value.split(".")
  const formattedWhole = new Intl.NumberFormat("en-US").format(Number(whole))
  return fraction ? `${formattedWhole}.${fraction}` : formattedWhole
}

function categoryLabel(category: MainnetToken["category"]) {
  if (category === "stock") return "Stock token"
  if (category === "etf") return "ETF token"
  return "Crypto"
}

function categoryColor(category: MainnetToken["category"]) {
  if (category === "stock") return "bg-sky-400"
  if (category === "etf") return "bg-violet-400"
  return "bg-primary"
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading portfolio">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44 rounded-[1.75rem] md:col-span-2" />
        <Skeleton className="h-44 rounded-[1.75rem]" />
      </div>
      <Skeleton className="h-80 rounded-[1.75rem]" />
    </div>
  )
}

export function Portfolio() {
  const [walletOpen, setWalletOpen] = useState(false)
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({})
  const [prices, setPrices] = useState<Record<string, PortfolioPrice>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const loadRequestId = useRef(0)

  const {
    address,
    status,
    isOnRobinhoodChain,
    getBalances,
    switchToRobinhoodChain,
  } = useWallet()
  const assetCatalog = useGetSwapAssets()
  const tokens = useMemo(() => (
    assetCatalog.data?.assets ??
    (assetCatalog.isError ? MAINNET_TOKENS : [])
  ), [assetCatalog.data?.assets, assetCatalog.isError])

  useEffect(() => {
    document.title = "Portfolio · FondrFi"
    const description = "View live Robinhood Chain wallet holdings and indicative on-chain values in FondrFi."
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "description"
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [])

  const loadPortfolio = useCallback(async () => {
    const requestId = ++loadRequestId.current
    if (!address || !isOnRobinhoodChain || tokens.length === 0) {
      setBalances({})
      setPrices({})
      setBalanceError(null)
      setPriceError(null)
      setLastUpdated(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setBalanceError(null)
    setPriceError(null)
    try {
      const nextBalances = await getBalances(tokens)
      if (loadRequestId.current !== requestId) return

      setBalances(nextBalances)
      const failedReads = Object.values(nextBalances).filter((balance) => balance.error).length
      if (failedReads > 0) {
        setBalanceError(`${failedReads} asset balance${failedReads === 1 ? "" : "s"} could not be read from your wallet provider.`)
      }

      const heldTokens = tokens.filter((token) => {
        const raw = nextBalances[token.id]?.raw
        return raw != null && BigInt(raw) > 0n
      })
      const priceCandidates = heldTokens.slice(0, MAX_PRICED_ASSETS)
      if (priceCandidates.length === 0) {
        setPrices({})
        setLastUpdated(new Date())
        return
      }

      try {
        const priceResponse = await getPortfolioPrices({
          taker: address,
          assets: priceCandidates.map((token) => ({
            address: token.address,
            sellAmount: (10n ** BigInt(token.decimals)).toString(),
          })),
        })
        if (loadRequestId.current !== requestId) return
        setPrices(Object.fromEntries(priceResponse.prices.map((price) => [price.address.toLowerCase(), price])))
        setLastUpdated(new Date(priceResponse.refreshedAt))
        if (heldTokens.length > MAX_PRICED_ASSETS) {
          setPriceError(`Live pricing is limited to the first ${MAX_PRICED_ASSETS} holdings per refresh. Remaining assets are shown as unpriced.`)
        }
      } catch (error) {
        if (loadRequestId.current !== requestId) return
        setPrices({})
        setPriceError(getErrorMessage(error))
        setLastUpdated(new Date())
      }
    } catch (error) {
      if (loadRequestId.current !== requestId) return
      setBalances({})
      setPrices({})
      setBalanceError(getErrorMessage(error))
      setLastUpdated(null)
    } finally {
      if (loadRequestId.current === requestId) setIsLoading(false)
    }
  }, [address, getBalances, isOnRobinhoodChain, tokens])

  useEffect(() => {
    void loadPortfolio()
    return () => {
      loadRequestId.current += 1
    }
  }, [loadPortfolio])

  const holdings = useMemo<PortfolioHolding[]>(() => tokens
    .flatMap((token) => {
      const balance = balances[token.id]
      if (!balance?.raw || BigInt(balance.raw) <= 0n) return []
      const price = prices[token.address.toLowerCase()] ?? null
      const valueRawUsd = price?.available && price.buyAmount
        ? (BigInt(balance.raw) * BigInt(price.buyAmount)) / (10n ** BigInt(token.decimals))
        : null
      return [{ token, balance, price, valueRawUsd }]
    })
    .sort((left, right) => {
      if (left.valueRawUsd != null && right.valueRawUsd != null) {
        if (left.valueRawUsd === right.valueRawUsd) return left.token.symbol.localeCompare(right.token.symbol)
        return left.valueRawUsd > right.valueRawUsd ? -1 : 1
      }
      if (left.valueRawUsd != null) return -1
      if (right.valueRawUsd != null) return 1
      return left.token.symbol.localeCompare(right.token.symbol)
    }), [balances, prices, tokens])

  const totalValueRawUsd = useMemo(
    () => holdings.reduce((total, holding) => total + (holding.valueRawUsd ?? 0n), 0n),
    [holdings],
  )
  const pricedHoldings = holdings.filter((holding) => holding.valueRawUsd != null)
  const unpricedHoldings = holdings.length - pricedHoldings.length
  const failedBalanceReads = Object.values(balances).filter((balance) => balance.error).length

  return (
    <>
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-primary/10 blur-[110px]" />
          <div className="absolute right-[5%] top-72 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        <section className="relative mx-auto w-full max-w-6xl px-4 py-10 md:py-16">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Read-only · Robinhood Chain
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">
                Your onchain portfolio.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Live wallet balances across crypto, stock tokens, and ETFs—valued only when a verified on-chain market route is available.
              </p>
            </div>
            {address && isOnRobinhoodChain && (
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs text-muted-foreground backdrop-blur-xl">
                  {shortenAddress(address)}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-background/70"
                  onClick={() => void loadPortfolio()}
                  disabled={isLoading || tokens.length === 0}
                  aria-label="Refresh portfolio"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                </Button>
              </div>
            )}
          </div>

          {!address ? (
            <div className="rounded-[2rem] border border-border/70 bg-background/70 p-8 text-center shadow-2xl shadow-primary/5 backdrop-blur-2xl md:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Wallet className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold">Connect to see your real holdings</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                FondrFi reads balances directly in your browser. Nothing is deposited, moved, or stored by this page.
              </p>
              <Button className="mt-7 rounded-full px-6" onClick={() => setWalletOpen(true)}>
                Connect wallet <ArrowRight />
              </Button>
            </div>
          ) : !isOnRobinhoodChain ? (
            <div className="rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-8 text-center md:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold">Switch to Robinhood Chain</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Portfolio balances are scoped to Robinhood Chain mainnet. Your current network is not used for this view.
              </p>
              <Button className="mt-7 rounded-full px-6" onClick={() => void switchToRobinhoodChain()}>
                Switch network
              </Button>
            </div>
          ) : assetCatalog.isLoading && tokens.length === 0 ? (
            <PortfolioSkeleton />
          ) : (
            <div className="space-y-6">
              {assetCatalog.isError && (
                <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  The full Robinhood asset registry is unavailable. This refresh includes verified core assets only.
                </div>
              )}
              {balanceError && (
                <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {balanceError}
                </div>
              )}
              {priceError && (
                <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  Live valuation is partial: {priceError}
                </div>
              )}

              {isLoading && Object.keys(balances).length === 0 ? (
                <PortfolioSkeleton />
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-background/80 to-blue-500/10 p-6 md:col-span-2 md:p-8">
                      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border border-primary/20 bg-primary/10 blur-2xl" />
                      <div className="relative">
                        <p className="text-sm font-medium text-muted-foreground">Priced portfolio value</p>
                        <p className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">
                          {formatUsdRaw(totalValueRawUsd)}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                            {pricedHoldings.length} priced asset{pricedHoldings.length === 1 ? "" : "s"}
                          </span>
                          {unpricedHoldings > 0 && (
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-200">
                              {unpricedHoldings} unpriced
                            </span>
                          )}
                          {failedBalanceReads > 0 && (
                            <span className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-destructive">
                              {failedBalanceReads} unread
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-6 backdrop-blur-xl md:p-8">
                      <div className="flex h-full flex-col justify-between gap-8">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Holdings found</p>
                          <p className="mt-3 font-display text-5xl font-semibold">{holdings.length}</p>
                        </div>
                        <div className="text-xs leading-relaxed text-muted-foreground">
                          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for live data"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/70 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-border/70 px-5 py-5 md:px-7">
                      <div>
                        <h2 className="font-display text-2xl font-semibold">Holdings</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Non-zero balances from the verified asset registry</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">{holdings.length} assets</Badge>
                    </div>

                    {holdings.length === 0 && failedBalanceReads > 0 ? (
                      <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                          <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h3 className="mt-5 font-display text-2xl font-semibold">Portfolio balances are unavailable</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                          Your wallet provider did not return enough balance data to determine whether this wallet is empty.
                        </p>
                        <Button variant="outline" className="mt-6 rounded-full" onClick={() => void loadPortfolio()}>
                          <RefreshCw /> Try again
                        </Button>
                      </div>
                    ) : holdings.length === 0 ? (
                      <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                          <Wallet className="h-6 w-6" />
                        </div>
                        <h3 className="mt-5 font-display text-2xl font-semibold">No supported holdings yet</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                          This wallet has no non-zero balance among the verified Robinhood Chain assets FondrFi currently tracks.
                        </p>
                        <Button asChild variant="outline" className="mt-6 rounded-full">
                          <Link href="/">Open trade <ArrowRight /></Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/70">
                        {holdings.map((holding) => {
                          const allocation = holding.valueRawUsd != null && totalValueRawUsd > 0n
                            ? Number((holding.valueRawUsd * 10_000n) / totalValueRawUsd) / 100
                            : null
                          return (
                            <div key={holding.token.id} className="px-5 py-5 transition-colors hover:bg-secondary/25 md:px-7">
                              <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(130px,.8fr)_minmax(150px,.9fr)]">
                                <div className="flex min-w-0 items-center gap-4">
                                  <TokenAvatar token={holding.token} size="lg" className="h-11 w-11" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-semibold">{holding.token.name}</span>
                                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryColor(holding.token.category)}`} />
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                      <span>{holding.token.symbol}</span>
                                      <span>·</span>
                                      <span>{categoryLabel(holding.token.category)}</span>
                                      {!holding.token.isNative && (
                                        <>
                                          <span>·</span>
                                          <a
                                            href={`${ROBINHOOD_CHAIN.explorerUrl}/address/${holding.token.address}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                                          >
                                            Contract <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="md:text-right">
                                  <p className="font-medium">{formatTokenBalance(holding.balance.formatted ?? "0")} {holding.token.symbol}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {holding.price?.available && holding.price.buyAmount
                                      ? `${formatUsdRaw(BigInt(holding.price.buyAmount))} per token`
                                      : holding.price?.error ?? "Price unavailable"}
                                  </p>
                                </div>

                                <div className="md:text-right">
                                  <p className={`text-lg font-semibold ${holding.valueRawUsd == null ? "text-muted-foreground" : ""}`}>
                                    {holding.valueRawUsd != null ? formatUsdRaw(holding.valueRawUsd) : "Unpriced"}
                                  </p>
                                  {allocation != null ? (
                                    <div className="mt-2 flex items-center gap-2 md:justify-end">
                                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                                        <div className={`h-full rounded-full ${categoryColor(holding.token.category)}`} style={{ width: `${Math.max(2, allocation)}%` }} />
                                      </div>
                                      <span className="w-12 text-right text-xs text-muted-foreground">{allocation.toFixed(2)}%</span>
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-xs text-muted-foreground">Excluded from total</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-secondary/20 px-4 py-4 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-center md:justify-between">
                    <span className="flex items-start gap-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Balance reads stay in your browser. Live valuation sends your wallet address and held asset identifiers to 0x through FondrFi; balances are not stored. Values are indicative USDG routes, and unpriced assets are excluded.
                    </span>
                    <a
                      href={`${ROBINHOOD_CHAIN.explorerUrl}/address/${address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground hover:text-primary hover:underline"
                    >
                      View wallet in Blockscout <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <ConnectWalletDialog open={walletOpen} onOpenChange={setWalletOpen} />
      <span className="sr-only">Wallet status: {status}</span>
    </>
  )
}