import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getGetSwapAssetsQueryKey, useGetExploreMarkets, useGetSwapAssets, type ExploreMarket, type SwapAsset } from "@workspace/api-client-react";
import { AlertTriangle, BarChart3, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Info, RefreshCw, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import "./index.css";

const queryClient = new QueryClient();
const PAGE_SIZE = 20;
const EXPLORER = "https://explorer.mainnet.chain.robinhood.com";

function formatUsd(raw: string | null | undefined) {
  if (!raw) return "Unavailable";
  try {
    const value = BigInt(raw);
    const divisor = 1_000_000n;
    if (value === 0n) return "$0.00";
    const digits = value < divisor ? 4 : 2;
    const rounded = (value + 10n ** BigInt(6 - digits) / 2n) / 10n ** BigInt(6 - digits);
    const whole = rounded / 10n ** BigInt(digits);
    const fraction = (rounded % 10n ** BigInt(digits)).toString().padStart(digits, "0");
    return `$${new Intl.NumberFormat("en-US").format(Number(whole))}.${fraction}`;
  } catch { return "Unavailable"; }
}

function categoryLabel(category: SwapAsset["category"]) {
  return category === "stock" ? "Stock token" : category === "etf" ? "ETF token" : "Crypto";
}

function Avatar({ asset, size = "md" }: { asset: SwapAsset; size?: "sm" | "md" | "lg" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = asset.symbol.slice(0, 2).toUpperCase();
  return asset.logoUrl && !imageFailed ? <img src={asset.logoUrl} alt="" className={`avatar avatar-${size}`} onError={() => setImageFailed(true)} /> :
    <span className={`avatar avatar-${size} avatar-fallback cat-${asset.category}`} aria-hidden="true">{initials}</span>;
}

function Status({ market, testId }: { market?: ExploreMarket; testId?: string }) {
  const live = Boolean(market?.available && market.buyAmount && !market.error);
  const reference = market?.source === "USDG reference";
  return <span className={live ? "route-live" : "route-muted"} data-testid={testId ?? `status-route-${market?.address ?? "pending"}`}>{live ? reference ? "Reference value" : "Indicative route" : "Unavailable"}</span>;
}

function Notice({ children, danger = false }: { children: string; danger?: boolean }) {
  return <div className={`notice ${danger ? "notice-danger" : ""}`} data-testid={danger ? "status-market-error" : "status-catalog-fallback"}><AlertTriangle size={14} />{children}</div>;
}

function Terminal() {
  const catalog = useGetSwapAssets({ query: { queryKey: getGetSwapAssetsQueryKey() } });
  const assets = useMemo(() => catalog.data?.assets ?? [], [catalog.data?.assets]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "crypto" | "stock" | "etf">("all");
  const [page, setPage] = useState(1);
  const [prices, setPrices] = useState<Record<string, ExploreMarket>>({});
  const [selected, setSelected] = useState<SwapAsset | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [compact, setCompact] = useState(false);
  const [refreshed, setRefreshed] = useState<Date | null>(null);
  const requestVersion = useRef(0);
  const { mutate: fetchMarkets, isPending: marketsPending, isError: marketsError } = useGetExploreMarkets();

  const filtered = useMemo(() => assets.filter((asset) => {
    const term = query.toLowerCase();
    return (filter === "all" || asset.category === filter) &&
      (!term || `${asset.name} ${asset.symbol} ${asset.address}`.toLowerCase().includes(term));
  }), [assets, filter, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = useMemo(() => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filtered, currentPage]);
  const stocks = useMemo(() => assets.filter((asset) => asset.category === "stock").slice(0, 4), [assets]);
  const reference = useMemo(() => ["ETH", "USDG", "USDe"].map((symbol) => assets.find((a) => a.symbol === symbol)).filter(Boolean) as SwapAsset[], [assets]);
  const addresses = useMemo(() => Array.from(new Set([...visible, ...stocks, ...reference].map((a) => a.address.toLowerCase()))).slice(0, 30), [visible, stocks, reference]);

  const refresh = useCallback(() => {
    if (!addresses.length) return;
    const version = ++requestVersion.current;
    fetchMarkets({ data: { addresses } }, {
      onSuccess: (response) => {
        if (version !== requestVersion.current) return;
        setPrices((old) => Object.fromEntries([...Object.entries(old), ...response.markets.map((market) => [market.address.toLowerCase(), market])]));
        setRefreshed(new Date(response.refreshedAt));
      },
    });
  }, [addresses, fetchMarkets]);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 180);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => { setPage(1); }, [query, filter]);

  const openAsset = (asset: SwapAsset) => {
    setSelected(asset);
    if (!prices[asset.address.toLowerCase()]) fetchMarkets({ data: { addresses: [asset.address] } }, {
      onSuccess: (response) => {
        const market = response.markets[0];
        if (market) setPrices((old) => ({ ...old, [market.address.toLowerCase()]: market }));
      },
    });
  };
  const liveCount = addresses.filter((address) => prices[address]?.available && prices[address]?.buyAmount && !prices[address]?.error && prices[address]?.source !== "USDG reference").length;
  const metrics = [["Verified assets", String(assets.length)], ["Live routes", `${liveCount} / ${addresses.length}`], ["Stock tokens", String(assets.filter((a) => a.category === "stock").length)], ["ETF tokens", String(assets.filter((a) => a.category === "etf").length)], ["Quote source", "0x · 20s cache"]];
  const selectedMarket = selected ? prices[selected.address.toLowerCase()] : undefined;

  return <main className="terminal">
    <div className="terminal-inner">
      <header className="topbar">
        <div className="top-actions">
          <span className="eyebrow refresh-label" data-testid="status-refresh">{marketsPending ? "Fetching routes" : refreshed ? `Updated ${refreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Awaiting routes"}</span>
          <button className="icon-btn" onClick={() => setShowControls((value) => !value)} aria-label="Open display controls" data-testid="button-display-controls"><SlidersHorizontal size={15} /></button>
          <button className={`icon-btn ${marketsPending ? "spinning" : ""}`} onClick={refresh} disabled={marketsPending || !addresses.length} aria-label="Refresh market routes" data-testid="button-refresh-markets"><RefreshCw size={15} /></button>
        </div>
      </header>
      {showControls && <div className="controls" data-testid="panel-display-controls"><span className="eyebrow">Display density</span><button onClick={() => setCompact((value) => !value)} data-testid="button-toggle-density">{compact ? "Comfortable rows" : "Compact rows"} <BarChart3 size={13} /></button></div>}
      <section className="metrics" aria-label="Market metrics">
        {metrics.map(([label, value]) => <div className="metric" key={label}><p className="eyebrow">{label}</p><p className="metric-value font-display" data-testid={`metric-${label.toLowerCase().replaceAll(" ", "-")}`}>{value}</p></div>)}
      </section>
      {catalog.isError && <Notice>The full verified asset registry is unavailable. Try refreshing to reconnect.</Notice>}
      {marketsError && <Notice danger>Live route pricing is temporarily unavailable. Your catalog remains read-only and safe to browse.</Notice>}

      <section className="rail-section">
        <div className="section-heading"><div><h2 className="font-display">Tokenized stocks</h2><span className="pill">Verified</span></div><span className="eyebrow">Indicative USDG routes</span></div>
        <div className="stock-grid">
          {stocks.map((asset) => { const market = prices[asset.address.toLowerCase()]; return <button className="stock-card" key={asset.id} onClick={() => openAsset(asset)} data-testid={`card-stock-${asset.id}`}>
            <div className="asset-head"><div className="asset-identity"><Avatar asset={asset} /><div><strong>{asset.name}</strong><span className="eyebrow">{asset.symbol}</span></div></div><span className="eyebrow">USDG</span></div>
            <span className="eyebrow">{categoryLabel(asset.category)}</span><strong className="stock-price font-display" data-testid={`text-stock-price-${asset.id}`}>{formatUsd(market?.buyAmount)}</strong><Status market={market} testId={`status-stock-route-${asset.id}`} />
          </button>; })}
          {!catalog.isLoading && !stocks.length && <div className="empty-small">No verified stock tokens are currently listed.</div>}
        </div>
      </section>

      <section className="access-strip"><div className="access-copy"><ShieldCheck size={16} /><div><h2 className="font-display">Market access</h2><p>Public route coverage on Robinhood Chain</p></div></div><div className="access-grid">{reference.map((asset) => <button key={asset.id} className="access-item" onClick={() => openAsset(asset)} data-testid={`button-reference-${asset.id}`}><span className="asset-identity"><Avatar asset={asset} size="sm" /><strong>{asset.symbol}</strong></span><Status market={prices[asset.address.toLowerCase()]} testId={`status-reference-route-${asset.id}`} /></button>)}</div></section>

      <section className="market-section">
        <div className="market-toolbar"><div className="tabs"><button className="tab active" data-testid="tab-tokens">Tokens</button>{["Auctions", "Pools", "Transactions"].map((tab) => <button className="tab disabled" disabled key={tab} data-testid={`tab-${tab.toLowerCase()}`}>{tab}<small>Soon</small></button>)}</div><label className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search verified assets" aria-label="Search verified assets" data-testid="input-search-assets" /></label><button className="period-btn" data-testid="button-period">1D <ChevronDown size={13} /></button></div>
        <div className="filter-row">{(["all", "crypto", "stock", "etf"] as const).map((value) => <button className={`filter ${filter === value ? "selected" : ""}`} key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} data-testid={`button-filter-${value}`}>{value === "all" ? "Popular / All" : value === "stock" ? "Stocks" : value === "etf" ? "ETFs" : "Crypto"}</button>)}<span className="market-count" data-testid="text-market-count">{filtered.length} markets</span></div>
        <div className="table-wrap"><table className={compact ? "compact" : ""}><thead><tr><th>#</th><th>Asset</th><th className="right">Price / USDG</th><th className="right">Route</th><th className="right">Category</th><th className="right">Decimals</th><th className="right">Market signal</th></tr></thead><tbody>
          {catalog.isLoading && !assets.length ? Array.from({ length: 6 }, (_, index) => <tr key={index}><td colSpan={7}><div className="skeleton row-skeleton" /></td></tr>) : visible.map((asset, index) => { const market = prices[asset.address.toLowerCase()]; const loading = marketsPending && !market; return <tr key={asset.id} tabIndex={0} onClick={() => openAsset(asset)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openAsset(asset); }} data-testid={`row-market-${asset.id}`}><td className="rank">{String((currentPage - 1) * PAGE_SIZE + index + 1).padStart(2, "0")}</td><td><div className="asset-identity"><Avatar asset={asset} /><div><strong data-testid={`text-asset-name-${asset.id}`}>{asset.name}</strong><span className="eyebrow">{asset.symbol}</span></div></div></td><td className="right price" data-testid={`text-market-price-${asset.id}`}>{loading ? <span className="skeleton price-skeleton" /> : formatUsd(market?.buyAmount)}</td><td className="right"><Status market={market} testId={`status-table-route-${asset.id}`} /></td><td className="right muted">{categoryLabel(asset.category)}</td><td className="right muted">{asset.decimals}</td><td className="right muted">{market?.source ?? "Route pending"}</td></tr>; })}
        </tbody></table>{!catalog.isLoading && !visible.length && <div className="empty-state"><Search size={18} /><strong>No verified assets found</strong><span>Try a different symbol, name, or category.</span><button onClick={() => { setQuery(""); setFilter("all"); }} data-testid="button-clear-filters">Clear filters</button></div>}</div>
        {totalPages > 1 && <div className="pagination"><span data-testid="text-pagination">Page {currentPage} of {totalPages}</span><div><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} data-testid="button-page-prev"><ChevronLeft size={14} />Prev</button><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} data-testid="button-page-next">Next<ChevronRight size={14} /></button></div></div>}
        <p className="freshness" data-testid="text-freshness">{refreshed ? `Routes refreshed ${refreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Routes awaiting first refresh"} · USDG</p>
        <div className="footer-note"><span><Info size={14} />Explore is read-only. Prices are indicative routes for one asset into USDG, not oracle or exchange prices. Historical moves are not provided by this feed.</span><a href={EXPLORER} target="_blank" rel="noreferrer" data-testid="link-chain-explorer">Open explorer <ExternalLink size={13} /></a></div>
      </section>
    </div>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal" role="dialog" aria-modal="true" aria-label={`${selected.name} market details`} onClick={(event) => event.stopPropagation()} data-testid="dialog-asset-details"><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close asset details" data-testid="button-close-details"><X size={16} /></button><div className="modal-title"><Avatar asset={selected} size="lg" /><div><h2 className="font-display">{selected.name}</h2><span>{selected.symbol} · {categoryLabel(selected.category)}</span></div></div><div className="detail-price"><span className="eyebrow">{selected.symbol === "USDG" || selectedMarket?.source === "USDG reference" ? "Reference value · USDG" : "Indicative route price · USDG"}</span><strong data-testid="text-detail-price">{marketsPending && !selectedMarket ? "Loading…" : formatUsd(selectedMarket?.buyAmount)}</strong><Status market={selectedMarket} testId={`status-detail-route-${selected.id}`} /></div><div className="detail-grid"><div><span className="eyebrow">Source</span><strong data-testid="text-liquidity-source">{selectedMarket?.source ?? "Not available"}</strong></div><div><span className="eyebrow">Decimals</span><strong data-testid="text-asset-decimals">{selected.decimals}</strong></div><div className="detail-address"><span className="eyebrow">Contract address</span>{selected.isNative ? <strong className="font-mono" data-testid="text-contract-address">Native Robinhood Chain asset · no token contract</strong> : <><strong className="font-mono" data-testid="text-contract-address">{selected.address}</strong><a href={`${EXPLORER}/address/${selected.address}`} target="_blank" rel="noreferrer" data-testid="link-asset-explorer">View contract <ExternalLink size={12} /></a></>}</div></div><p className="modal-disclaimer"><ShieldCheck size={14} />No wallet connection or transaction is required. USDG is the reference unit for this read-only view.</p></div></div>}
  </main>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><Terminal /></QueryClientProvider>;
}