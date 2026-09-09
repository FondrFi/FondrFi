import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Info,
  Loader2, RefreshCw, Search, ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import "./_group.css"

type Category = "crypto" | "stock" | "etf"
type Asset = { id: string; address: string; symbol: string; name: string; decimals: number; category: Category; logoUrl?: string; isNative?: boolean }
type Market = { buyAmount?: string; available: boolean; source?: string; error?: string }
type AssetTuple = [string, string, string, string, number, Category, string?, boolean?]

const explorerUrl = "https://robinhoodchain.blockscout.com"
const ITEMS_PER_PAGE = 20
const assets: Asset[] = ([
  ["eth", "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", "ETH", "Ether", 18, "crypto", "https://assets.coingecko.com/coins/images/279/small/ethereum.png", true],
  ["weth", "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73", "WETH", "Wrapped Ether", 18, "crypto", "https://assets.coingecko.com/coins/images/279/small/ethereum.png"],
  ["usdg", "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", "USDG", "Global Dollar", 6, "crypto", "https://globaldollar.com/favicon.ico"],
  ["usde", "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", "USDe", "Ethena USDe", 18, "crypto", "https://assets.coingecko.com/coins/images/33613/small/USDE.png"],
  ["link", "0x492641F648a4986844848E0beFE66D14817bCE34", "LINK", "Chainlink", 18, "crypto", "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png"],
  ["btc", "0x91285B1AeD9cB617B62d3Fd7eB42da4ccCEeF36B", "WBTC", "Wrapped Bitcoin", 8, "crypto"],
  ["arb", "0x2F12e67E4896c4A7A9aD7721C720a10B877DCdc1", "ARB", "Arbitrum", 18, "crypto"],
  ["aave", "0x9477C6D78A8409C1dAaa03f387FdCB0C33dE82D7", "AAVE", "Aave", 18, "crypto"],
  ["uni", "0xc1984490A6be03f1b8CB9877E6084F87301B15cd", "UNI", "Uniswap", 18, "crypto"],
  ["sol", "0x7F6Ba6DEac3705C53B2FbD31BF13bA9143f40Fc3", "SOL", "Solana", 9, "crypto"],
  ["xrp", "0xE2ea7FeaC4fE7a8fa21b1a2cAD88433Dc4E93EE9", "XRP", "XRP", 6, "crypto"],
  ["doge", "0xA72B8e208B5ee9c693Df242c1Ea3beB9A1c36c16", "DOGE", "Dogecoin", 8, "crypto"],
  ["avax", "0x9406D57677728B2D70bBf29d538F8416ceB13D25", "AVAX", "Avalanche", 18, "crypto"],
  ["nvda", "0xbC5afFEEc6f7C1A30bF7384E32e0d420B3cA5E87", "NVDA", "NVIDIA", 18, "stock"],
  ["aapl", "0x0cDf5D9eD9cd5D469e88704EbD316C689B7AD329", "AAPL", "Apple", 18, "stock"],
  ["tsla", "0x6D356b9c5702B1a9C8a30b4f9dE4a32dD30fA2C5", "TSLA", "Tesla", 18, "stock"],
  ["hood", "0xD91a90A901b6803a334Ef2Ba05476a0EF5D5Ac82", "HOOD", "Robinhood", 18, "stock"],
  ["googl", "0x0e2B19bDd4a8E5466aEd7D2365c352BA13e9b14A", "GOOGL", "Alphabet", 18, "stock"],
  ["meta", "0xf638a446C0B43272CeD1a7e58793f0be8A5D8721", "META", "Meta Platforms", 18, "stock"],
  ["amzn", "0x6463F2a9F3b4072aF1EDC3f1ea91E861A5c6dE93", "AMZN", "Amazon", 18, "stock"],
  ["spy", "0x8Ac3558dD537F89876922aCdB4672823422f4d6A", "SPY", "SPDR S&P 500 ETF Trust", 18, "etf"],
  ["qqq", "0xC9bD4c7bDfd38216A82E30d4D1Eb01AdB3E4fD67", "QQQ", "Invesco QQQ Trust", 18, "etf"],
  ["voo", "0x8CfD3bc8Dd9E7cbCfA2e8A748ec35C5C6a82F760", "VOO", "Vanguard S&P 500 ETF", 18, "etf"],
  ["ibit", "0x6B942E12f73f2afC678A1fD4A7D8F7C5cF74123B", "IBIT", "iShares Bitcoin Trust", 18, "etf"],
] as AssetTuple[]).map(([id, address, symbol, name, decimals, category, logoUrl, isNative]) => ({ id, address, symbol, name, decimals, category, logoUrl, isNative }))

const marketAmounts = ["2450123456", "2449987654", "1000000", "999865", "15234000", "104321098765", "345600", "284500000", "9070000", "173450000", "2510000", "163000", "21340000", "208480000", "213670000", "330120000", "74900000", "169250000", "625780000", "232150000", "604120000", "511430000", "564890000"]
function categoryLabel(category: Category) { return category === "stock" ? "Stock Token" : category === "etf" ? "ETF Token" : "Crypto" }
function categoryColor(category: Category) { return category === "stock" ? "bg-sky-400" : category === "etf" ? "bg-violet-400" : "bg-primary" }
function formatUsdRaw(raw: string) {
  const value = BigInt(raw), divisor = 10n ** 6n, fractionDigits = value > 0n && value < divisor ? 4 : 2
  const factor = 10n ** (6n - BigInt(fractionDigits)), rounded = (value + factor / 2n) / factor
  if (value > 0n && rounded === 0n) return "<$0.0001"
  const display = 10n ** BigInt(fractionDigits)
  return `$${new Intl.NumberFormat("en-US").format(rounded / display)}.${(rounded % display).toString().padStart(fractionDigits, "0")}`
}
function fallbackStyle(asset: Asset) {
  if (asset.category === "etf") return "bg-violet-500/15 text-violet-700 ring-violet-500/20 dark:text-violet-200"
  if (asset.category === "stock") return "bg-sky-500/15 text-sky-700 ring-sky-500/20 dark:text-sky-200"
  if (asset.symbol === "ETH" || asset.symbol === "WETH") return "bg-indigo-500/15 text-indigo-700 ring-indigo-500/20 dark:text-indigo-200"
  if (asset.symbol === "LINK") return "bg-blue-500/15 text-blue-700 ring-blue-500/20 dark:text-blue-200"
  return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:text-emerald-200"
}
function TokenAvatar({ asset, className = "" }: { asset: Asset; className?: string }) {
  const [failed, setFailed] = useState(false)
  return <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm ring-1 ring-inset ${asset.logoUrl && !failed ? "bg-background" : fallbackStyle(asset)} ${className}`}>
    {asset.logoUrl && !failed ? <img src={asset.logoUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span className="font-bold leading-none">{asset.symbol.slice(0, 2)}</span>}
  </span>
}

export function Current() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [markets, setMarkets] = useState<Record<string, Market>>({})
  const filtered = useMemo(() => assets.filter((asset) => {
    const query = searchQuery.toLowerCase()
    return (categoryFilter === "all" || asset.category === categoryFilter) && (!query || asset.name.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query) || asset.address.toLowerCase().includes(query))
  }), [searchQuery, categoryFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const visibleAssets = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const refreshMarkets = () => {
    setRefreshing(true)
    window.setTimeout(() => {
      setMarkets(Object.fromEntries(assets.map((asset, index) => [asset.address.toLowerCase(), index === 11 ? { available: false } : index === 19 ? { available: false, error: "Route temporarily unavailable" } : { available: true, buyAmount: marketAmounts[index] ?? "1000000", source: "0x Liquidity" }])))
      setLastRefreshedAt(new Date())
      setLoading(false); setRefreshing(false)
    }, 500)
  }
  useEffect(() => { const timer = window.setTimeout(refreshMarkets, 250); return () => window.clearTimeout(timer) }, [])
  useEffect(() => { setPage(1) }, [searchQuery, categoryFilter])
  const priceFor = (asset: Asset) => markets[asset.address.toLowerCase()]

  return <main className="min-h-screen overflow-hidden bg-background font-sans text-foreground">
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute left-[5%] top-10 h-72 w-72 rounded-full bg-primary/10 blur-[110px]" /><div className="absolute right-[10%] top-60 h-80 w-80 rounded-full bg-sky-500/10 blur-[120px]" /></div>
      <section className="relative mx-auto w-full max-w-6xl px-4 py-10 md:py-16">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"><ShieldCheck className="h-3.5 w-3.5" />Live Onchain Market</div><h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Explore Assets.</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">Browse the verified Robinhood Chain catalog and discover live indicative routes for crypto, stocks, and ETFs.</p></div>
          <div className="flex items-center gap-3"><div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs text-muted-foreground backdrop-blur-xl" aria-live="polite">{refreshing || loading ? <><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>Fetching Routes</> : <><span className="h-2 w-2 rounded-full bg-primary" />Updated {lastRefreshedAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>}</div><Button variant="outline" size="icon" className="rounded-full bg-background/70" onClick={refreshMarkets} disabled={refreshing} aria-label="Refresh markets"><RefreshCw className={refreshing ? "animate-spin" : ""} /></Button></div>
        </div>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="group relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" /><input aria-label="Search verified assets" placeholder="Search name, symbol, or address..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-9 w-full rounded-full border border-border/70 bg-background pl-9 pr-4 text-sm shadow-sm transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10" /></div><div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:pb-0">{(["all", "crypto", "stock", "etf"] as const).map((category) => <Button key={category} variant={categoryFilter === category ? "default" : "outline"} onClick={() => setCategoryFilter(category)} className="h-9 whitespace-nowrap rounded-full">{category === "all" ? "All Assets" : categoryLabel(category)}</Button>)}</div></div>
        <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/70 shadow-2xl shadow-primary/5 backdrop-blur-xl"><div className="hidden grid-cols-[2.5fr_1fr_1.5fr_100px] border-b border-border/70 bg-secondary/30 px-7 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid"><div>Asset</div><div>Category</div><div className="text-right">Indicative Route (USDG)</div><div className="text-right">Action</div></div><div className="divide-y divide-border/50">
          {loading ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="flex items-center gap-4 px-7 py-4 md:grid md:grid-cols-[2.5fr_1fr_1.5fr_100px]"><div className="flex items-center gap-4"><Skeleton className="h-11 w-11 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-12" /></div></div><Skeleton className="ml-auto h-5 w-20" /></div>) : visibleAssets.length === 0 ? <div className="px-6 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"><Search className="h-6 w-6" /></div><h3 className="mt-5 font-display text-2xl font-semibold">No assets found</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Try adjusting your search or category filters.</p><Button variant="outline" className="mt-6 rounded-full" onClick={() => { setSearchQuery(""); setCategoryFilter("all") }}>Clear filters</Button></div> : visibleAssets.map((asset) => {
            const price = priceFor(asset)
            const priceText = !price ? "Waiting..." : price.error ? "Unavailable" : !price.available || !price.buyAmount ? "No route" : formatUsdRaw(price.buyAmount)
            return <div key={asset.id} className="group flex flex-col items-start gap-4 px-5 py-4 transition-colors hover:bg-secondary/25 md:grid md:grid-cols-[2.5fr_1fr_1.5fr_100px] md:items-center md:px-7"><div className="flex w-full items-center gap-4 md:w-auto"><TokenAvatar asset={asset} className="h-11 w-11 shadow-sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-semibold">{asset.name}</span><span className={`h-1.5 w-1.5 shrink-0 rounded-full md:hidden ${categoryColor(asset.category)}`} /></div><div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><span>{asset.symbol}</span><span className="md:hidden">·</span><span className="md:hidden">{categoryLabel(asset.category)}</span></div></div><div className={`text-right md:hidden ${price.error ? "text-amber-500" : !price.available ? "text-muted-foreground" : "font-medium"}`}>{priceText}</div></div><div className="hidden md:block"><Badge variant="outline" className="rounded-full bg-background/50 font-medium"><span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${categoryColor(asset.category)}`} />{categoryLabel(asset.category)}</Badge></div><div className={`hidden text-right md:block ${price.error ? "text-amber-500" : !price.available ? "text-muted-foreground" : "text-base font-semibold"}`}>{priceText}</div><div className="hidden text-right md:block"><Button variant="ghost" size="sm" className="rounded-full px-4 transition-opacity md:opacity-0 md:group-hover:opacity-100" onClick={() => setSelectedAsset(asset)}>Inspect</Button></div><div className="mt-1 w-full border-t border-border/50 pt-2 md:hidden"><Button variant="ghost" size="sm" className="h-8 w-full text-xs font-semibold text-primary" onClick={() => setSelectedAsset(asset)}>Inspect Details <ArrowRight className="ml-1 h-3 w-3" /></Button></div></div>
          })}</div>
          {totalPages > 1 && <div className="flex items-center justify-between border-t border-border/70 bg-secondary/10 px-7 py-4"><span className="text-sm font-medium text-muted-foreground">Page {currentPage} of {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="h-8 rounded-full bg-background/50 px-3"><ChevronLeft className="mr-1 h-4 w-4" />Prev</Button><Button variant="outline" size="sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="h-8 rounded-full bg-background/50 px-3">Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>}
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border/70 bg-secondary/20 px-4 py-4 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-center md:justify-between"><span className="flex items-start gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Explore is read-only and works without a wallet. Prices are indicative routes for one token into USDG from 0x liquidity, not oracle or exchange prices.</span><a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground hover:text-primary hover:underline">Open Robinhood Chain explorer <ExternalLink className="h-3.5 w-3.5" /></a></div>
      </section>
    </div>
    <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}><DialogContent className="rounded-[2rem] border-border/70 bg-background/95 p-6 shadow-2xl backdrop-blur-2xl sm:max-w-md md:p-8">{selectedAsset && (() => { const price = priceFor(selectedAsset); return <><DialogHeader className="mb-6 space-y-0 text-left"><DialogTitle className="flex items-center gap-4 font-display text-2xl"><TokenAvatar asset={selectedAsset} className="h-14 w-14 shadow-sm ring-border" /><div className="flex flex-col gap-0.5"><span className="text-xl font-semibold">{selectedAsset.name}</span><span className="text-sm font-normal tracking-wide text-muted-foreground">{selectedAsset.symbol}</span></div></DialogTitle></DialogHeader><div className="space-y-6"><div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background/50 p-5 shadow-sm md:p-6"><div className="absolute right-0 top-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-full bg-primary/20 blur-2xl" /><div className="relative"><div className="mb-2 flex items-center justify-between text-sm font-medium text-muted-foreground"><span>Live Route Price</span>{refreshing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</div><div className={`font-display text-4xl font-semibold tracking-tight ${price?.error ? "text-amber-500" : ""}`}>{!price ? "Waiting..." : price.error ? "Unavailable" : !price.available || !price.buyAmount ? "No route found" : formatUsdRaw(price.buyAmount)}</div>{price?.error && <p className="mt-3 text-xs leading-relaxed text-amber-600">Route temporarily unavailable. Close this detail and try again.</p>}<div className="mt-4 flex items-start gap-2 rounded-lg border border-border/50 bg-background/70 p-3 text-xs text-muted-foreground backdrop-blur-md"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Indicative USDG price for 1 {selectedAsset.symbol}. Read-only estimate directly from the liquidity layer.</div></div></div><div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/50 bg-secondary/30 p-5 text-sm"><div><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span><Badge variant="outline" className="rounded-full border-border/70 bg-background font-medium shadow-sm"><span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${categoryColor(selectedAsset.category)}`} />{categoryLabel(selectedAsset.category)}</Badge></div><div><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Decimals</span><span className="rounded-md border border-border/70 bg-background px-2.5 py-1 font-mono text-xs shadow-sm">{selectedAsset.decimals}</span></div><div className="col-span-2 pt-2"><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contract Address</span><div className="flex flex-wrap items-center gap-2"><span className="break-all rounded-md border border-border/70 bg-background px-2.5 py-1.5 font-mono text-xs text-foreground/80 shadow-sm">{selectedAsset.isNative ? "Native Robinhood Chain asset · no token contract" : selectedAsset.address}</span><a href={explorerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">Explorer <ExternalLink className="h-3 w-3" /></a></div></div><div className="col-span-2 pt-2"><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Liquidity Source</span><span className="flex items-center gap-2 font-medium">{price?.source ?? "None"}</span></div></div></div></> })()}</DialogContent></Dialog>
  </main>
}