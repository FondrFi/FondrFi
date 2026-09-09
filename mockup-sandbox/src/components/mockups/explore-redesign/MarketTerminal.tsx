import { useState } from "react"
import { BarChart3, ChevronDown, CircleDollarSign, Grid2X2, Search, SlidersHorizontal, TrendingDown, TrendingUp } from "lucide-react"
import "./_group.css"

type SparkProps = { points: string; color: string; fill?: string }

const metrics = [
  ["1D VOLUME", "$2.40B"],
  ["TOTAL UNISWAP TVL", "$2.80B"],
  ["V2 TVL", "$961.48M"],
  ["V3 TVL", "$1.19B"],
  ["V4 TVL", "$645.56M"],
]

const stocks = [
  { name: "SpaceX", ticker: "SPACEX", category: "Private markets", price: "$421.38", change: "+3.84%", tone: "up", mark: "X", points: "M1 31 C12 28 17 35 27 28 S39 23 48 27 S59 13 70 17 S83 8 96 11", fill: "rgba(122,220,160,.12)" },
  { name: "Circle Internet Group", ticker: "CRCL", category: "Technology", price: "$196.49", change: "-1.62%", tone: "down", mark: "◎", points: "M1 15 C12 17 16 9 27 14 S39 20 50 15 S63 26 73 21 S85 24 96 31", fill: "rgba(240,113,131,.10)" },
  { name: "SanDisk", ticker: "SNDK", category: "Semiconductors", price: "$62.74", change: "+6.19%", tone: "up", mark: "S", points: "M1 29 C11 24 16 28 25 25 S35 29 46 17 S61 19 70 11 S85 14 96 4", fill: "rgba(122,220,160,.12)" },
  { name: "Alphabet", ticker: "GOOGL", category: "Technology", price: "$174.22", change: "-0.48%", tone: "down", mark: "G", points: "M1 10 C12 14 16 11 27 17 S40 13 50 19 S63 17 71 26 S85 22 96 28", fill: "rgba(240,113,131,.10)" },
]

const tokens = [
  { rank: "01", symbol: "ETH", name: "Ethereum", mark: "◆", color: "bg-[#6670ef]", price: "$2,486.32", h: "+0.38%", d: "+2.84%", fdv: "$299.17B", volume: "$8.42B", tone: "up", points: "M1 29 C12 26 18 25 26 27 S38 20 48 22 S58 11 68 16 S82 8 96 3" },
  { rank: "02", symbol: "USDC", name: "USD Coin", mark: "$", color: "bg-[#2775ca]", price: "$1.00", h: "0.00%", d: "+0.01%", fdv: "$73.29B", volume: "$3.18B", tone: "up", points: "M1 16 C13 16 18 17 28 16 S40 16 50 16 S63 16 73 15 S86 16 96 15" },
  { rank: "03", symbol: "USDT", name: "Tether USD", mark: "₮", color: "bg-[#26a17b]", price: "$1.00", h: "-0.01%", d: "-0.02%", fdv: "$142.34B", volume: "$6.77B", tone: "down", points: "M1 12 C11 13 20 12 28 15 S41 13 50 16 S61 12 71 18 S85 14 96 20" },
  { rank: "04", symbol: "WBTC", name: "Wrapped Bitcoin", mark: "₿", color: "bg-[#f39b27]", price: "$104,842.00", h: "+0.64%", d: "+1.92%", fdv: "$10.31B", volume: "$442.17M", tone: "up", points: "M1 30 C10 26 17 28 25 22 S36 25 45 17 S57 20 66 12 S78 14 96 4" },
  { rank: "05", symbol: "LINK", name: "Chainlink", mark: "⬡", color: "bg-[#2a5ada]", price: "$15.71", h: "-0.22%", d: "-3.47%", fdv: "$10.07B", volume: "$518.29M", tone: "down", points: "M1 9 C13 12 17 14 27 12 S39 19 49 16 S61 25 72 22 S85 27 96 30" },
]

function Sparkline({ points, color, fill }: SparkProps) {
  const area = `${points} L96 36 L1 36 Z`
  return (
    <svg viewBox="0 0 97 38" preserveAspectRatio="none" className="h-9 w-full overflow-visible" aria-hidden="true">
      <path d={area} fill={fill ?? "transparent"} />
      <path d={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Logo({ mark, color }: { mark: string; color: string }) {
  return <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${color}`}>{mark}</span>
}

export default function MarketTerminal() {
  const [activeTab, setActiveTab] = useState("Tokens")
  const [activeFilter, setActiveFilter] = useState("Popular")
  const [query, setQuery] = useState("")
  const visibleTokens = tokens.filter((token) => `${token.name} ${token.symbol}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <main className="min-h-[100dvh] bg-[#0b0b0e] px-4 py-5 text-[#f1f0f3] sm:px-7 sm:py-7 lg:px-10">
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#727079]">
            <button aria-label="Open display settings" className="rounded-lg p-2 transition-colors hover:bg-[#19181d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b]"><SlidersHorizontal size={15} /></button>
            <button aria-label="Open market menu" className="rounded-lg p-2 transition-colors hover:bg-[#19181d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b]"><Grid2X2 size={15} /></button>
          </div>
        </header>

        <section className="no-scrollbar -mx-4 mb-8 flex overflow-x-auto border-y border-[#242329] sm:mx-0 sm:rounded-xl sm:border">
          <div className="flex min-w-[690px] flex-1">
            {metrics.map(([label, value], index) => (
              <div key={label} className={`min-w-[138px] flex-1 px-4 py-4 ${index ? "border-l border-[#242329]" : ""}`}>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.16em] text-[#696770]">{label}</p>
                <p className="font-display text-[17px] font-medium tracking-[-.025em] text-[#efedf1]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-9">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5"><h2 className="font-display text-[19px] font-semibold">Stocks</h2><span className="rounded-full bg-[#3b1836] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.13em] text-[#dd75bb]">New</span></div>
            <button className="text-[11px] font-medium text-[#938d9a] transition-colors hover:text-[#e8a2d4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b] focus-visible:outline-offset-4">View all <span className="ml-1 text-[#c34b9b]">→</span></button>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
            {stocks.map((stock) => {
              const line = stock.tone === "up" ? "#7bdca0" : "#ed7184"
              return <article key={stock.ticker} className="min-w-[236px] rounded-xl border border-[#29272e] bg-[#111115] p-4 transition-colors hover:border-[#49404c] sm:min-w-0">
                <div className="mb-5 flex items-start justify-between"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3b3840] bg-[#1b1a20] text-sm font-semibold text-[#dedbe2]">{stock.mark}</span><div><p className="text-[12px] font-medium text-[#ebe9ee]">{stock.name}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.13em] text-[#6e6b75]">{stock.ticker}</p></div></div><span className="text-[9px] text-[#68666e]">USD</span></div>
                <p className="mb-1 text-[9px] uppercase tracking-[.15em] text-[#65636b]">{stock.category}</p><div className="flex items-end justify-between gap-3"><div><p className="font-display text-[21px] font-medium tracking-[-.04em] text-[#f4f2f5]">{stock.price}</p><p className={`mt-1 flex items-center gap-1 text-[10px] ${stock.tone === "up" ? "text-[#7bdca0]" : "text-[#ed7184]"}`}>{stock.tone === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{stock.change} <span className="text-[#66636d]">24h</span></p></div><div className="w-[78px]"><Sparkline points={stock.points} color={line} fill={stock.fill} /></div></div>
              </article>
            })}
          </div>
        </section>

        <section className="mb-9 grid gap-4 border-y border-[#242329] py-5 md:grid-cols-[minmax(190px,.7fr)_1.8fr] md:items-center md:gap-10">
          <div><div className="flex items-center gap-2"><CircleDollarSign size={16} className="text-[#c45aa4]" /><h2 className="font-display text-[18px] font-semibold">Earn</h2></div><p className="mt-1 text-[11px] text-[#77737e]">Deposit for yield with no lockup</p></div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[["USDT", "3.25% APY", "bg-[#26a17b]"], ["USDC", "4.20% APY", "bg-[#2775ca]"], ["ETH", "1.75% APY", "bg-[#6670ef]"]].map(([symbol, apy, color]) => <button key={symbol} className="flex items-center justify-between rounded-lg border border-[#2a282f] bg-[#111115] px-3 py-2.5 text-left transition-colors hover:border-[#69506a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b]"><span className="flex items-center gap-2.5"><Logo mark={symbol === "ETH" ? "◆" : symbol === "USDC" ? "$" : "₮"} color={color} /><span className="text-[12px] font-medium">{symbol}</span></span><span className="text-[11px] text-[#aaa5b0]">{apy}</span></button>)}
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-4 border-b border-[#29272e] pb-0 md:flex-row md:items-end md:justify-between">
            <nav className="no-scrollbar flex gap-5 overflow-x-auto" aria-label="Market sections">{["Tokens", "Auctions", "Pools", "Transactions"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`relative whitespace-nowrap pb-3 text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b] ${activeTab === tab ? "text-[#f4edf4] after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-[#c34b9b]" : "text-[#77737e] hover:text-[#d2ced5]"}`}>{tab}</button>)}</nav>
            <div className="flex items-center gap-2 pb-2">
              <div className="flex items-center rounded-lg border border-[#2a282f] bg-[#111115] px-2.5 py-1.5"><Search size={13} className="mr-2 text-[#68656e]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search markets" className="w-[100px] bg-transparent text-[11px] text-white outline-none placeholder:text-[#68656e]" /></div>
              <button aria-label="Change chart period" className="flex items-center gap-2 rounded-lg border border-[#2a282f] bg-[#111115] px-2.5 py-2 text-[10px] text-[#a7a2ac] hover:border-[#554257] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b]">1D <ChevronDown size={12} /></button>
              <button aria-label="Toggle table display" className="rounded-lg border border-[#2a282f] bg-[#111115] p-2 text-[#77737e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b]"><BarChart3 size={13} /></button>
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {["Popular", "Stocks", "Commodities", "ETFs"].map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full border px-3 py-1.5 text-[10px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c34b9b] ${activeFilter === filter ? "border-[#8e3d78] bg-[#3b1836] text-[#e4a0d0]" : "border-[#2a282f] text-[#77737e] hover:border-[#534454] hover:text-[#d7d2da]"}`}>{filter}</button>)}
            <span className="ml-auto hidden text-[10px] text-[#5f5c64] sm:inline">{visibleTokens.length} markets</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#29272e] bg-[#101014]">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead><tr className="border-b border-[#29272e] text-[9px] uppercase tracking-[.15em] text-[#68656e]"><th className="w-14 px-4 py-3 font-medium">#</th><th className="px-3 py-3 font-medium">Token</th><th className="px-3 py-3 text-right font-medium">Price</th><th className="px-3 py-3 text-right font-medium">1H</th><th className="px-3 py-3 text-right font-medium">1D</th><th className="px-3 py-3 text-right font-medium">FDV</th><th className="px-3 py-3 text-right font-medium">↓ Volume</th><th className="w-32 px-4 py-3 text-right font-medium">1D chart</th></tr></thead>
              <tbody>{visibleTokens.map((token) => <tr key={token.symbol} className="border-b border-[#242329] last:border-0 transition-colors hover:bg-[#17161b]"><td className="px-4 py-4 font-mono text-[10px] text-[#625f68]">{token.rank}</td><td className="px-3 py-4"><div className="flex items-center gap-2.5"><Logo mark={token.mark} color={token.color} /><div><p className="text-[12px] font-medium text-[#efedf1]">{token.name}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.14em] text-[#69666f]">{token.symbol}</p></div></div></td><td className="px-3 py-4 text-right font-display text-[13px] font-medium text-[#f5f3f6]">{token.price}</td><td className={`px-3 py-4 text-right text-[11px] ${token.h.startsWith("+") ? "text-[#7bdca0]" : token.h.startsWith("-") ? "text-[#ed7184]" : "text-[#99959f]"}`}>{token.h}</td><td className={`px-3 py-4 text-right text-[11px] ${token.d.startsWith("+") ? "text-[#7bdca0]" : "text-[#ed7184]"}`}>{token.d}</td><td className="px-3 py-4 text-right text-[11px] text-[#aaa6ae]">{token.fdv}</td><td className="px-3 py-4 text-right text-[11px] text-[#aaa6ae]">{token.volume}</td><td className="px-4 py-4"><div className="ml-auto w-[90px]"><Sparkline points={token.points} color={token.tone === "up" ? "#7bdca0" : "#ed7184"} /></div></td></tr>)}</tbody>
            </table>
            {!visibleTokens.length && <div className="px-5 py-12 text-center text-xs text-[#77737e]">No markets match “{query}”.</div>}
          </div>
          <p className="mt-5 pb-8 text-center text-[10px] uppercase tracking-[.15em] text-[#4e4b54]">Market data refreshed 12 seconds ago · USD</p>
        </section>
      </div>
    </main>
  )
}