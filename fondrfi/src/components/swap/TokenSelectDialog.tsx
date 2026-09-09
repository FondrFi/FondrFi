import { useMemo, useState } from "react"
import { ExternalLink, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ROBINHOOD_CHAIN, shortenAddress, type MainnetToken } from "@/lib/robinhood-chain"
import { TokenAvatar } from "./TokenAvatar"

export type Token = MainnetToken

interface TokenSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (token: Token) => void
  selectedTokenId?: string
  balances: Record<string, string>
  tokens: Token[]
  isCatalogLoading?: boolean
  catalogError?: string | null
}

export function TokenSelectDialog({
  open,
  onOpenChange,
  onSelect,
  selectedTokenId,
  balances,
  tokens,
  isCatalogLoading = false,
  catalogError,
}: TokenSelectDialogProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<"all" | Token["category"]>("all")

  const categoryCounts = useMemo(() => ({
    crypto: tokens.filter((token) => token.category === "crypto").length,
    stock: tokens.filter((token) => token.category === "stock").length,
    etf: tokens.filter((token) => token.category === "etf").length,
  }), [tokens])

  const filteredTokens = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return tokens.filter((token) => {
      const matchesCategory = category === "all" || token.category === category
      const matchesSearch = !normalizedSearch ||
        token.symbol.toLowerCase().includes(normalizedSearch) ||
        token.name.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [category, search, tokens])

  const quickPicks = useMemo(() => ["ETH", "USDG", "NVDA", "AAPL", "SPY"]
    .map((symbol) => tokens.find((token) => token.symbol === symbol))
    .filter((token): token is Token => Boolean(token)), [tokens])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0 bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-medium">Select an asset</DialogTitle>
          <p className="pt-1 text-xs text-muted-foreground">
            Verified Robinhood Chain assets. A live quote confirms whether a route is available.
          </p>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ticker or asset name"
              className="pl-9 bg-secondary/50 border-transparent focus-visible:ring-primary/20 focus-visible:border-primary/50 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {quickPicks.map(token => (
            <button
              key={token.id}
              onClick={() => onSelect(token)}
              disabled={selectedTokenId === token.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-background hover:bg-secondary transition-colors whitespace-nowrap disabled:opacity-40"
            >
              <TokenAvatar token={token} size="sm" />
              <span className="text-sm font-medium">{token.symbol}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1 border-y border-border/50 bg-secondary/20 px-4 py-2">
          {([
            ["all", `All ${tokens.length}`],
            ["crypto", `Crypto ${categoryCounts.crypto}`],
            ["stock", `Stocks ${categoryCounts.stock}`],
            ["etf", `ETFs ${categoryCounts.etf}`],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${category === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-[350px] overflow-y-auto no-scrollbar">
          {isCatalogLoading && (
            <div className="px-4 pt-3 text-xs text-muted-foreground">Loading the verified asset registry…</div>
          )}
          {catalogError && (
            <div className="mx-4 mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">
              {catalogError}
            </div>
          )}
          {filteredTokens.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No verified assets match that search.
            </div>
          ) : (
            <div className="flex flex-col py-2">
              {filteredTokens.map((token) => (
                <div
                  key={token.id}
                  onClick={() => onSelect(token)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      onSelect(token)
                    }
                  }}
                  role="button"
                  tabIndex={selectedTokenId === token.id ? -1 : 0}
                  className={`flex items-center justify-between px-4 py-3 outline-none hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors ${
                    selectedTokenId === token.id ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <TokenAvatar token={token} size="lg" />
                    <div className="min-w-0 text-left">
                      <div className="truncate font-medium">{token.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{token.symbol}</span>
                        <span className="text-border">·</span>
                        <span className="capitalize">{token.category}</span>
                        {!token.isNative && (
                          <>
                            <span className="text-border">·</span>
                            <a
                              href={`${ROBINHOOD_CHAIN.explorerUrl}/address/${token.address}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center gap-0.5 hover:text-primary hover:underline"
                              aria-label={`View ${token.symbol} contract in Blockscout`}
                            >
                              {shortenAddress(token.address)} <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                      <div className="font-medium">{balances[token.id] ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground">Balance</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
