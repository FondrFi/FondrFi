import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  useGetSwapAssets,
  useGetExploreMarkets,
  type SwapAsset,
  type ExploreMarket,
} from "@workspace/api-client-react";
import {
  Search, RefreshCw, ShieldCheck, AlertTriangle, ExternalLink, ChevronLeft,
  ChevronRight, Loader2, Info, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TokenAvatar } from "@/components/swap/TokenAvatar";
import { MAINNET_TOKENS, ROBINHOOD_CHAIN } from "@/lib/robinhood-chain";

const USDG_DECIMALS = 6n;
const ITEMS_PER_PAGE = 20;

function formatUsdRaw(raw: string) {
  const value = BigInt(raw);
  const divisor = 10n ** USDG_DECIMALS;
  const fractionDigits = value > 0n && value < divisor ? 4 : 2;
  const roundingFactor = 10n ** (USDG_DECIMALS - BigInt(fractionDigits));
  const rounded = (value + roundingFactor / 2n) / roundingFactor;
  if (value > 0n && rounded === 0n) return "<$0.0001";
  const displayDivisor = 10n ** BigInt(fractionDigits);
  const whole = rounded / displayDivisor;
  const fraction = (rounded % displayDivisor).toString().padStart(fractionDigits, "0");
  return `$${new Intl.NumberFormat("en-US").format(whole)}.${fraction}`;
}

function categoryLabel(category: SwapAsset["category"]) {
  if (category === "stock") return "Stock Token";
  if (category === "etf") return "ETF Token";
  return "Crypto";
}

function categoryColor(category: SwapAsset["category"]) {
  if (category === "stock") return "bg-sky-400";
  if (category === "etf") return "bg-violet-400";
  return "bg-emerald-400";
}

function marketStatus(market?: ExploreMarket) {
  if (market?.available && market.buyAmount && !market.error) {
    return market.source === "USDG reference" ? "Reference value" : "Live route";
  }
  return "Unavailable";
}

export function Explore() {
  const assetCatalog = useGetSwapAssets();
  const tokens = useMemo<SwapAsset[]>(() => {
    if (assetCatalog.data?.assets) return assetCatalog.data.assets;
    if (assetCatalog.isError) return MAINNET_TOKENS.map((t) => ({ ...t, isNative: !!t.isNative }));
    return [];
  }, [assetCatalog.data?.assets, assetCatalog.isError]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "crypto" | "stock" | "etf">("all");
  const [page, setPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<SwapAsset | null>(null);
  const [prices, setPrices] = useState<Record<string, ExploreMarket>>({});
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const visibleRequestId = useRef(0);
  const singleRequestId = useRef(0);

  useEffect(() => {
    document.title = "Explore Robinhood Chain Markets · FondrFi";
    const metadata = [
      ["description", "Browse verified Robinhood Chain assets and inspect live, read-only indicative USDG market routes on FondrFi."],
      ["og:title", "Explore Robinhood Chain Markets · FondrFi"],
      ["og:description", "Live indicative USDG routes for verified crypto, stock tokens, and ETFs on Robinhood Chain."],
    ] as const;
    metadata.forEach(([key, content]) => {
      const selector = key.startsWith("og:") ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      let meta = document.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement("meta");
        if (key.startsWith("og:")) meta.setAttribute("property", key);
        else meta.name = key;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });
  }, []);

  useEffect(() => setPage(1), [searchQuery, categoryFilter]);

  const filteredTokens = useMemo(() => tokens.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    const q = searchQuery.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q) || t.address.toLowerCase().includes(q);
  }), [tokens, searchQuery, categoryFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredTokens.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTokens = useMemo(() => filteredTokens.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredTokens, currentPage]);
  const stockRail = useMemo(() => tokens.filter((asset) => asset.category === "stock").slice(0, 4), [tokens]);
  const coverageAssets = useMemo(() => ["ETH", "USDG", "USDe"].map((symbol) => tokens.find((asset) => asset.symbol === symbol)).filter((asset): asset is SwapAsset => Boolean(asset)), [tokens]);
  // A visible page is 20; the rails add at most seven distinct verified assets.
  const addressesToFetch = useMemo(() => Array.from(new Set([
    ...paginatedTokens.map((asset) => asset.address),
    ...stockRail.map((asset) => asset.address),
    ...coverageAssets.map((asset) => asset.address),
  ].map((address) => address.toLowerCase()))).slice(0, 30), [paginatedTokens, stockRail, coverageAssets]);

  const { mutate: fetchMarkets, isPending: isFetchingPrices, error: fetchError } = useGetExploreMarkets();
  const handleRefresh = useCallback(() => {
    if (!addressesToFetch.length) return;
    const requestId = ++visibleRequestId.current;
    fetchMarkets({ data: { addresses: addressesToFetch } }, {
      onSuccess: (res) => {
        if (visibleRequestId.current !== requestId) return;
        setPrices((previous) => {
          const next = { ...previous };
          res.markets.forEach((market) => { next[market.address.toLowerCase()] = market; });
          return next;
        });
        setLastRefreshedAt(new Date(res.refreshedAt));
      },
    });
  }, [addressesToFetch, fetchMarkets]);

  useEffect(() => {
    const timeout = window.setTimeout(handleRefresh, 250);
    return () => { window.clearTimeout(timeout); visibleRequestId.current += 1; };
  }, [handleRefresh]);

  const { mutate: fetchSingleMarket, isPending: isFetchingSingle, error: singleFetchError } = useGetExploreMarkets();
  const handleSelectAsset = (asset: SwapAsset) => {
    const requestId = ++singleRequestId.current;
    setSelectedAsset(asset);
    fetchSingleMarket({ data: { addresses: [asset.address] } }, {
      onSuccess: (res) => {
        if (singleRequestId.current !== requestId) return;
        const market = res.markets[0];
        if (market) setPrices((previous) => ({ ...previous, [market.address.toLowerCase()]: market }));
      },
    });
  };

  const liveRoutes = addressesToFetch.filter((address) => marketStatus(prices[address]) === "Live route").length;
  const metricItems = [
    ["Verified assets", tokens.length.toString()],
    ["Live routes", `${liveRoutes} / ${addressesToFetch.length}`],
    ["Stock tokens", tokens.filter((asset) => asset.category === "stock").length.toString()],
    ["ETF tokens", tokens.filter((asset) => asset.category === "etf").length.toString()],
    ["Quote source", "0x / 20s cache"],
  ];

  return (
    <>
      <main className="flex-1 overflow-hidden bg-background text-foreground">
        <section className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2" data-testid="status-refresh" aria-live="polite">
              <span className="hidden text-[10px] uppercase tracking-[.12em] text-muted-foreground sm:inline">
                {isFetchingPrices ? "Fetching routes" : lastRefreshedAt ? `Updated ${lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Waiting for routes"}
              </span>
              <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isFetchingPrices || !addressesToFetch.length} aria-label="Refresh markets" data-testid="button-refresh-markets" className="h-8 w-8 rounded-lg border border-border text-muted-foreground hover:bg-secondary hover:text-foreground">
                <RefreshCw className={`h-3.5 w-3.5 ${isFetchingPrices ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </header>

          <section className="no-scrollbar -mx-4 mb-7 flex overflow-x-auto border-y border-border sm:mx-0 sm:rounded-xl sm:border" aria-label="Market metrics">
            <div className="flex min-w-[690px] flex-1">
              {metricItems.map(([label, value], index) => <div key={label} className={`min-w-[138px] flex-1 px-4 py-3.5 ${index ? "border-l border-border" : ""}`}>
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{label}</p>
                <p className="font-display text-[15px] font-medium tracking-tight text-foreground">{value}</p>
              </div>)}
            </div>
          </section>

          {assetCatalog.isError && <TerminalNotice testId="status-catalog-fallback">The full Robinhood asset registry is unavailable. Showing verified core assets only.</TerminalNotice>}
          {fetchError && <TerminalNotice testId="status-market-error" destructive>Live route pricing is currently unavailable. Please try again later.</TerminalNotice>}

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><h2 className="font-display text-[18px] font-semibold">Stocks</h2><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.13em] text-primary">Verified</span></div>
              <span className="text-[10px] text-muted-foreground">Indicative USDG routes</span>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
              {stockRail.map((asset) => {
                const market = prices[asset.address.toLowerCase()];
                return <button key={asset.id} onClick={() => handleSelectAsset(asset)} className="min-w-[236px] rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:min-w-0">
                  <div className="mb-5 flex items-start justify-between"><div className="flex min-w-0 items-center gap-2.5"><TokenAvatar token={asset} size="md" /><div className="min-w-0"><p className="truncate text-[12px] font-medium text-card-foreground">{asset.name}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.13em] text-muted-foreground">{asset.symbol}</p></div></div><span className="text-[9px] text-muted-foreground">USDG</span></div>
                  <p className="mb-1 text-[9px] uppercase tracking-[.15em] text-muted-foreground">{categoryLabel(asset.category)}</p>
                  <p className="font-display text-[20px] font-medium tracking-tight text-foreground">{market?.available && market.buyAmount && !market.error ? formatUsdRaw(market.buyAmount) : "Unavailable"}</p>
                  <p className={`mt-1 text-[10px] ${marketStatus(market) === "Live route" ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}`}>{marketStatus(market) === "Live route" ? "Indicative route" : "No historical data"}</p>
                </button>;
              })}
              {!stockRail.length && !assetCatalog.isLoading && <p className="text-xs text-muted-foreground">No verified stock tokens are currently in the catalog.</p>}
            </div>
          </section>

          <section className="mb-7 grid gap-4 border-y border-border py-4 md:grid-cols-[minmax(190px,.7fr)_1.8fr] md:items-center md:gap-10">
            <div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h2 className="font-display text-[17px] font-semibold">Market access</h2></div><p className="mt-1 text-[11px] text-muted-foreground">Read-only route coverage on Robinhood Chain</p></div>
            <div className="grid gap-2 sm:grid-cols-3">{coverageAssets.map((asset) => {
              const market = prices[asset.address.toLowerCase()];
              return <button key={asset.id} onClick={() => handleSelectAsset(asset)} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <span className="flex items-center gap-2.5"><TokenAvatar token={asset} size="sm" /><span className="text-[12px] font-medium">{asset.symbol}</span></span>
                <span className={`text-[10px] ${marketStatus(market) !== "Unavailable" ? "text-emerald-600 dark:text-emerald-300" : "text-muted-foreground"}`}>{marketStatus(market)}</span>
              </button>;
            })}</div>
          </section>

          <section>
            <div className="mb-3 flex flex-col gap-3 border-b border-border md:flex-row md:items-end md:justify-between">
              <nav className="no-scrollbar flex gap-5 overflow-x-auto" aria-label="Market sections">
                <button aria-current="page" className="relative whitespace-nowrap border-b-2 border-primary pb-3 text-[12px] font-medium text-foreground">Tokens</button>
                {["Auctions", "Pools", "Transactions"].map((tab) => <button key={tab} disabled aria-disabled="true" className="whitespace-nowrap pb-3 text-[12px] text-muted-foreground disabled:cursor-not-allowed">{tab} <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[8px] uppercase tracking-wide">Soon</span></button>)}
              </nav>
              <div className="relative mb-2 w-full md:w-[190px]"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Search verified assets" placeholder="Search" data-testid="input-search-assets" className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-2 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" /></div>
            </div>
            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
              {(["all", "crypto", "stock", "etf"] as const).map((category) => <button key={category} onClick={() => setCategoryFilter(category)} aria-pressed={categoryFilter === category} data-testid={`button-filter-${category}`} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${categoryFilter === category ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{category === "all" ? "Popular / All" : category === "stock" ? "Stocks" : category === "etf" ? "ETFs" : "Crypto"}</button>)}
              <button disabled aria-disabled="true" className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-[10px] text-muted-foreground/60">Commodities <span className="ml-1">Soon</span></button>
              <span className="ml-auto hidden whitespace-nowrap text-[10px] text-muted-foreground sm:inline">{filteredTokens.length} markets</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead><tr className="border-b border-border text-[9px] uppercase tracking-[.15em] text-muted-foreground"><th className="w-12 px-4 py-3 font-medium">#</th><th className="px-3 py-3 font-medium">Token</th><th className="px-3 py-3 text-right font-medium">Price</th><th className="px-3 py-3 text-right font-medium">1H</th><th className="px-3 py-3 text-right font-medium">1D</th><th className="px-3 py-3 text-right font-medium">FDV</th><th className="px-3 py-3 text-right font-medium">Volume</th><th className="w-28 px-4 py-3 text-right font-medium">1D chart</th></tr></thead>
                <tbody>
                  {assetCatalog.isLoading && !tokens.length ? Array.from({ length: 5 }).map((_, index) => <tr key={index} className="border-b border-border"><td colSpan={8} className="px-4 py-3"><Skeleton className="h-8 w-full bg-muted" /></td></tr>) : paginatedTokens.map((asset, index) => {
                    const market = prices[asset.address.toLowerCase()];
                    const isLoading = isFetchingPrices && !market;
                    const unavailable = !isLoading && marketStatus(market) === "Unavailable";
                    return <tr key={asset.id} role="button" tabIndex={0} onClick={() => handleSelectAsset(asset)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSelectAsset(asset); } }} className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary" data-testid={`row-market-${asset.id}`}>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-muted-foreground">{String((currentPage - 1) * ITEMS_PER_PAGE + index + 1).padStart(2, "0")}</td>
                      <td className="px-3 py-3.5"><div className="flex items-center gap-2.5"><TokenAvatar token={asset} size="md" /><div><p className="text-[12px] font-medium text-card-foreground" data-testid={`text-asset-name-${asset.id}`}>{asset.name}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.14em] text-muted-foreground">{asset.symbol} · {categoryLabel(asset.category)}</p></div></div></td>
                      <td className="px-3 py-3.5 text-right font-display text-[13px] font-medium text-foreground" data-testid={`text-market-price-${asset.id}`}>{isLoading ? <Skeleton className="ml-auto h-4 w-16 bg-muted" /> : unavailable ? <span className="text-[11px] text-muted-foreground" title={market?.error ?? undefined}>Unavailable</span> : formatUsdRaw(market.buyAmount!)}</td>
                      {["1H", "1D", "FDV", "Volume"].map((label) => <td key={label} className="px-3 py-3.5 text-right text-[11px] text-muted-foreground"><span aria-label={`${label} data unavailable`}>—</span></td>)}
                      <td className="px-4 py-3.5 text-right text-[10px] text-muted-foreground"><span aria-label="Historical chart data unavailable">No historical data</span></td>
                    </tr>;
                  })}
                </tbody>
              </table>
              {!assetCatalog.isLoading && !paginatedTokens.length && <div className="px-6 py-14 text-center"><Search className="mx-auto h-5 w-5 text-muted-foreground" /><h3 className="mt-3 font-display text-lg">No assets found</h3><p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or category filters.</p><Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }} data-testid="button-clear-filters" className="mt-3 text-primary">Clear filters</Button></div>}
            </div>
            {totalPages > 1 && <div className="flex items-center justify-between border-x border-b border-border px-4 py-3"><span className="text-[11px] text-muted-foreground">Page {currentPage} of {totalPages}</span><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} data-testid="button-page-prev" className="h-7 text-xs"><ChevronLeft className="mr-1 h-3.5 w-3.5" />Prev</Button><Button variant="ghost" size="sm" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} data-testid="button-page-next" className="h-7 text-xs">Next<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></div></div>}
            <p className="mt-4 text-center text-[10px] uppercase tracking-[.13em] text-muted-foreground">{lastRefreshedAt ? `Market routes refreshed ${lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Market routes awaiting first refresh"} · USDG</p>
            <div className="mt-4 flex flex-col gap-3 border-t border-border py-4 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-center md:justify-between"><span className="flex items-start gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Explore is read-only and works without a wallet. Prices are indicative routes for one token into USDG, not oracle or exchange prices.</span><a href={ROBINHOOD_CHAIN.explorerUrl} target="_blank" rel="noreferrer" data-testid="link-chain-explorer" className="inline-flex shrink-0 items-center gap-1 text-foreground hover:text-primary">Open explorer <ExternalLink className="h-3.5 w-3.5" /></a></div>
          </section>
        </section>
      </main>

      <Dialog open={!!selectedAsset} onOpenChange={(open) => { if (!open) { singleRequestId.current += 1; setSelectedAsset(null); } }}>
        <DialogContent className="border-border bg-card p-6 text-card-foreground sm:max-w-md">
          {selectedAsset && (() => {
            const market = prices[selectedAsset.address.toLowerCase()];
            const loading = isFetchingSingle || (isFetchingPrices && !market);
            const status = marketStatus(market);
            const isReference = status === "Reference value";
            return <><DialogHeader><DialogTitle className="flex items-center gap-3 text-left font-display"><TokenAvatar token={selectedAsset} size="lg" /><span>{selectedAsset.name}<small className="ml-2 text-sm font-normal text-muted-foreground">{selectedAsset.symbol}</small></span></DialogTitle></DialogHeader>
              <div className="mt-5 space-y-4"><div className="border border-border bg-background p-4"><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isReference ? "Reference value · USDG" : "Live route price · USDG"}</p><div className="mt-2 text-3xl font-semibold" data-testid="text-detail-price" aria-live="polite">{loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : status !== "Unavailable" ? formatUsdRaw(market!.buyAmount!) : <span className="text-lg text-muted-foreground">Unavailable</span>}</div>{!loading && (singleFetchError || market?.error) && <p className="mt-2 text-xs text-amber-600 dark:text-amber-300" data-testid="status-detail-market-error">{market?.error ?? "The live route request failed. Close this detail and try again."}</p>}<p className="mt-3 flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />{isReference ? "USDG is the reference unit for Explore pricing." : `Indicative USDG route for 1 ${selectedAsset.symbol}; read-only estimate from the liquidity layer.`}</p></div>
              <div className="grid grid-cols-2 gap-3 border border-border p-4 text-xs"><div><p className="mb-1 uppercase tracking-wider text-muted-foreground">Category</p><Badge variant="outline"><span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${categoryColor(selectedAsset.category)}`} />{categoryLabel(selectedAsset.category)}</Badge></div><div><p className="mb-1 uppercase tracking-wider text-muted-foreground">Decimals</p><span data-testid="text-asset-decimals">{selectedAsset.decimals}</span></div><div className="col-span-2"><p className="mb-1 uppercase tracking-wider text-muted-foreground">Source</p><span data-testid="text-liquidity-source">{market?.source ?? (loading ? "Loading..." : "None")}</span></div><div className="col-span-2"><p className="mb-1 uppercase tracking-wider text-muted-foreground">Contract address</p>{selectedAsset.isNative ? <div className="flex items-center justify-between gap-2"><span data-testid="text-contract-address">Native Robinhood Chain asset · no token contract</span><ExplorerLink href={ROBINHOOD_CHAIN.explorerUrl} /></div> : <div className="flex items-center justify-between gap-2"><span className="break-all font-mono" data-testid="text-contract-address">{selectedAsset.address}</span><ExplorerLink href={`${ROBINHOOD_CHAIN.explorerUrl}/address/${selectedAsset.address}`} /></div>}</div></div></div></>;
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TerminalNotice({ children, destructive = false, testId }: { children: ReactNode; destructive?: boolean; testId: string }) {
  return <div className={`mb-5 flex gap-2 border px-3 py-2.5 text-xs ${destructive ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`} data-testid={testId}><AlertTriangle className="h-4 w-4 shrink-0" />{children}</div>;
}

function ExplorerLink({ href }: { href: string }) {
  return <a href={href} target="_blank" rel="noreferrer" data-testid="link-asset-explorer" className="inline-flex shrink-0 items-center gap-1 text-primary hover:underline">Explorer <ArrowUpRight className="h-3 w-3" /></a>;
}