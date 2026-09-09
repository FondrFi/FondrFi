import { useState } from "react"
import {
  ExternalLink,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import "./_group.css"

type Category = "crypto" | "stock" | "etf"

type Holding = {
  id: string
  name: string
  symbol: string
  category: Category
  balance: string
  price?: string
  value?: string
  allocation?: number
  logoUrl?: string
  isNative?: boolean
}

const explorerUrl = "https://robinhoodchain.blockscout.com"
const walletAddress = "0x71F4eC4e38a0A5d756F7241BfF91B9C0aB4d9c52"

const holdings: Holding[] = [
  {
    id: "eth", name: "Ether", symbol: "ETH", category: "crypto", balance: "2.00",
    price: "$2,450.00", value: "$4,900.00", allocation: 88.28,
    logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", isNative: true,
  },
  {
    id: "nvda", name: "NVIDIA", symbol: "NVDA", category: "stock", balance: "3.00",
    price: "$208.48", value: "$625.44", allocation: 11.27,
  },
  {
    id: "usdg", name: "Global Dollar", symbol: "USDG", category: "crypto", balance: "25.00",
    price: "$1.00", value: "$25.00", allocation: 0.45,
    logoUrl: "https://globaldollar.com/favicon.ico",
  },
  {
    id: "spy", name: "SPDR S&P 500 ETF Trust", symbol: "SPY", category: "etf", balance: "1.00",
  },
]

function categoryLabel(category: Category) {
  if (category === "stock") return "Stock token"
  if (category === "etf") return "ETF token"
  return "Crypto"
}

function categoryColor(category: Category) {
  if (category === "stock") return "bg-sky-400"
  if (category === "etf") return "bg-violet-400"
  return "bg-primary"
}

function fallbackStyle(holding: Holding) {
  if (holding.category === "etf") return "bg-violet-500/15 text-violet-700 ring-violet-500/20 dark:text-violet-200"
  if (holding.category === "stock") return "bg-sky-500/15 text-sky-700 ring-sky-500/20 dark:text-sky-200"
  if (holding.symbol === "ETH") return "bg-indigo-500/15 text-indigo-700 ring-indigo-500/20 dark:text-indigo-200"
  return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:text-emerald-200"
}

function TokenAvatar({ holding }: { holding: Holding }) {
  const [hasImageError, setHasImageError] = useState(false)
  const hasImage = Boolean(holding.logoUrl && !hasImageError)

  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm ring-1 ring-inset ${hasImage ? "bg-background" : fallbackStyle(holding)}`}
      aria-label={`${holding.symbol} logo`}
    >
      {hasImage ? (
        <img src={holding.logoUrl} alt="" className="h-full w-full object-cover" onError={() => setHasImageError(true)} />
      ) : (
        <span className="font-bold leading-none">{holding.symbol.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  )
}

export function Current() {
  return (
    <main className="min-h-screen overflow-hidden bg-background font-sans text-foreground">
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
              <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Your onchain portfolio.</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Live wallet balances across crypto, stock tokens, and ETFs—valued only when a verified on-chain market route is available.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs text-muted-foreground backdrop-blur-xl">
                0x71F4...9c52
              </div>
              <Button variant="outline" size="icon" className="rounded-full bg-background/70" aria-label="Refresh portfolio">
                <RefreshCw />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-background/80 to-blue-500/10 p-6 md:col-span-2 md:p-8">
                <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border border-primary/20 bg-primary/10 blur-2xl" />
                <div className="relative">
                  <p className="text-sm font-medium text-muted-foreground">Priced portfolio value</p>
                  <p className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-6xl">$5,550.44</p>
                  <div className="mt-6 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">3 priced assets</span>
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-200">1 unpriced</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-6 backdrop-blur-xl md:p-8">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Holdings found</p>
                    <p className="mt-3 font-display text-5xl font-semibold">4</p>
                  </div>
                  <div className="text-xs leading-relaxed text-muted-foreground">Updated 10:42 AM</div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/70 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-5 md:px-7">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Holdings</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Non-zero balances from the verified asset registry</p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">4 assets</Badge>
              </div>

              <div className="divide-y divide-border/70">
                {holdings.map((holding) => (
                  <div key={holding.id} className="px-5 py-5 transition-colors hover:bg-secondary/25 md:px-7">
                    <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(130px,.8fr)_minmax(150px,.9fr)]">
                      <div className="flex min-w-0 items-center gap-4">
                        <TokenAvatar holding={holding} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold">{holding.name}</span>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryColor(holding.category)}`} />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{holding.symbol}</span><span>·</span><span>{categoryLabel(holding.category)}</span>
                            {!holding.isNative && <>
                              <span>·</span>
                              <a href={`${explorerUrl}/address/${holding.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary hover:underline">
                                Contract <ExternalLink className="h-3 w-3" />
                              </a>
                            </>}
                          </div>
                        </div>
                      </div>

                      <div className="md:text-right">
                        <p className="font-medium">{holding.balance} {holding.symbol}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{holding.price ? `${holding.price} per token` : "Price unavailable"}</p>
                      </div>

                      <div className="md:text-right">
                        <p className={`text-lg font-semibold ${holding.value ? "" : "text-muted-foreground"}`}>{holding.value ?? "Unpriced"}</p>
                        {holding.allocation !== undefined ? (
                          <div className="mt-2 flex items-center gap-2 md:justify-end">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                              <div className={`h-full rounded-full ${categoryColor(holding.category)}`} style={{ width: `${Math.max(2, holding.allocation)}%` }} />
                            </div>
                            <span className="w-12 text-right text-xs text-muted-foreground">{holding.allocation.toFixed(2)}%</span>
                          </div>
                        ) : <p className="mt-1 text-xs text-muted-foreground">Excluded from total</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-secondary/20 px-4 py-4 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Balance reads stay in your browser. Live valuation sends your wallet address and held asset identifiers to 0x through FondrFi; balances are not stored. Values are indicative USDG routes, and unpriced assets are excluded.
              </span>
              <a href={`${explorerUrl}/address/${walletAddress}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground hover:text-primary hover:underline">
                View wallet in Blockscout <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}