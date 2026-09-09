import { useState } from "react"
import {
  ArrowUpRight,
  CircleHelp,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

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
  tone: "mint" | "blue" | "violet"
}

const explorerUrl = "https://robinhoodchain.blockscout.com"
const walletAddress = "0x71F4eC4e38a0A5d756F7241BfF91B9C0aB4d9c52"

const holdings: Holding[] = [
  { id: "eth", name: "Ether", symbol: "ETH", category: "crypto", balance: "2.00", price: "$2,450.00", value: "$4,900.00", allocation: 88.28, tone: "mint" },
  { id: "usdg", name: "Global Dollar", symbol: "USDG", category: "crypto", balance: "25.00", price: "$1.00", value: "$25.00", allocation: 0.45, tone: "mint" },
  { id: "nvda", name: "NVIDIA", symbol: "NVDA", category: "stock", balance: "3.00", price: "$208.48", value: "$625.44", allocation: 11.27, tone: "blue" },
  { id: "spy", name: "SPDR S&P 500 ETF Trust", symbol: "SPY", category: "etf", balance: "1.00", tone: "violet" },
]

function categoryLabel(category: Category) {
  if (category === "stock") return "Stock token"
  if (category === "etf") return "ETF token"
  return "Crypto"
}

function toneClasses(tone: Holding["tone"]) {
  if (tone === "blue") return { avatar: "bg-[#e5f2f5] text-[#1d6c79]", dot: "bg-[#55aab1]", bar: "bg-[#55aab1]" }
  if (tone === "violet") return { avatar: "bg-[#eeeafb] text-[#6d5c9d]", dot: "bg-[#9585c4]", bar: "bg-[#9585c4]" }
  return { avatar: "bg-[#dff4e9] text-[#138653]", dot: "bg-[#2eae74]", bar: "bg-[#2eae74]" }
}

function TokenMark({ holding }: { holding: Holding }) {
  const colors = toneClasses(holding.tone)
  return (
    <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[11px] font-extrabold tracking-[-.04em] ${colors.avatar}`} aria-label={`${holding.symbol} logo`}>
      <span className="absolute inset-[5px] rounded-[9px] border border-current opacity-20" />
      {holding.symbol.slice(0, 2)}
    </span>
  )
}

function Sparkline() {
  return (
    <svg aria-hidden="true" viewBox="0 0 230 68" className="h-16 w-full overflow-visible">
      <path d="M2 53 C18 54 19 42 33 46 S52 57 65 42 S82 41 94 37 S110 48 124 29 S142 27 154 34 S170 30 181 22 S203 31 216 12 S224 13 228 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M2 53 C18 54 19 42 33 46 S52 57 65 42 S82 41 94 37 S110 48 124 29 S142 27 154 34 S170 30 181 22 S203 31 216 12 S224 13 228 4 V68 H2Z" fill="url(#area)" opacity=".16" />
      <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#38b77b" /><stop offset="1" stopColor="#38b77b" stopOpacity="0" /></linearGradient></defs>
    </svg>
  )
}

export function Redesign() {
  const [refreshing, setRefreshing] = useState(false)
  const [updated, setUpdated] = useState("10:42 AM")

  function refreshPortfolio() {
    if (refreshing) return
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setUpdated("just now")
    }, 700)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f8f4] text-[#16352b] [font-family:'Plus_Jakarta_Sans',system-ui,sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .portfolio-grid { background-image: linear-gradient(rgba(38,122,82,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(38,122,82,.055) 1px, transparent 1px); background-size: 30px 30px; }
        @media (prefers-reduced-motion: no-preference) { .portfolio-enter { animation: portfolio-enter .65s both cubic-bezier(.2,.8,.2,1); } .portfolio-delay { animation-delay: 90ms; } .portfolio-spin { animation: portfolio-spin .7s linear infinite; } }
        @keyframes portfolio-enter { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes portfolio-spin { to { transform:rotate(360deg) } }
      `}</style>
      <div className="portfolio-grid relative min-h-screen">
        <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-[#c9eddb] opacity-50 blur-3xl" />
        <section className="relative mx-auto w-full max-w-[1180px] px-5 py-7 sm:px-8 lg:py-11">
          <header className="portfolio-enter mb-9 flex flex-col gap-6 border-b border-[#d8e7dc] pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#168355]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d7f1e1]"><ShieldCheck className="h-3.5 w-3.5" /></span>
                FondrFi / Portfolio
              </div>
              <h1 className="max-w-[650px] font-['Outfit'] text-4xl font-semibold leading-[.98] tracking-[-.045em] text-[#16352b] sm:text-6xl">A clearer view of<br /><span className="text-[#299968]">what you hold.</span></h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-[#5e7468] sm:text-base">One calm place to understand your crypto, tokenized stocks, and ETFs on Robinhood Chain.</p>
            </div>
            <div className="flex items-center gap-3">
              <a href={`${explorerUrl}/address/${walletAddress}`} target="_blank" rel="noreferrer" className="group rounded-xl border border-[#cfe2d5] bg-[#fbfdfb]/80 px-3.5 py-2.5 font-['DM_Mono'] text-[11px] text-[#507064] transition-colors hover:border-[#65b88d] hover:text-[#168355]" aria-label="View wallet address in Blockscout">
                0x71C...9A2D <ArrowUpRight className="ml-1 inline h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <button type="button" onClick={refreshPortfolio} aria-label="Refresh portfolio" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfe2d5] bg-[#fbfdfb]/80 text-[#37745a] transition-colors hover:border-[#65b88d] hover:bg-[#e6f6eb]">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "portfolio-spin" : ""}`} />
              </button>
            </div>
          </header>

          <div className="grid gap-5 lg:grid-cols-[1.45fr_.8fr]">
            <section className="portfolio-enter relative overflow-hidden rounded-[26px] border border-[#b8dec7] bg-[#e5f6eb] p-6 shadow-[0_18px_50px_rgba(43,119,78,.08)] sm:p-8">
              <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[22px] border-[#c1e9d1] opacity-70" />
              <div className="relative flex h-full flex-col justify-between gap-10">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#478069]">Indicative total</p><p className="mt-3 font-['Outfit'] text-5xl font-semibold tracking-[-.06em] text-[#123d2b] sm:text-7xl">$5,550.44</p></div>
                  <span className="rounded-full bg-[#c9eed8] px-3 py-1.5 text-[11px] font-bold text-[#18764e]">USDG routes</span>
                </div>
                <div className="flex items-end justify-between gap-5">
                  <div className="w-[46%] max-w-[260px] text-[#299968]"><Sparkline /></div>
                  <p className="max-w-[210px] text-right text-xs leading-5 text-[#54806a]">3 assets valued<br />1 asset held aside</p>
                </div>
              </div>
            </section>
            <section className="portfolio-enter portfolio-delay rounded-[26px] border border-[#d8e7dc] bg-[#fbfdfb]/85 p-6 shadow-[0_18px_50px_rgba(43,119,78,.045)] sm:p-8">
              <div className="flex items-start justify-between"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#6d8278]">Holdings found</p><CircleHelp className="h-4 w-4 text-[#8ba196]" /></div>
              <p className="mt-5 font-['Outfit'] text-6xl font-semibold tracking-[-.06em] text-[#16352b]">4</p>
              <div className="mt-9 flex items-center justify-between border-t border-[#e2ece4] pt-4 text-[11px] text-[#71877c]"><span>Last checked</span><span className="font-['DM_Mono'] text-[#3c6b56]">{updated}</span></div>
            </section>
          </div>

          <section className="portfolio-enter portfolio-delay mt-5 overflow-hidden rounded-[26px] border border-[#d8e7dc] bg-[#fbfdfb]/90 shadow-[0_18px_50px_rgba(43,119,78,.05)]">
            <div className="flex flex-col gap-2 border-b border-[#e1ebe3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div><h2 className="font-['Outfit'] text-2xl font-semibold tracking-[-.03em]">Your holdings</h2><p className="mt-1 text-xs text-[#71877c]">Verified balances from Robinhood Chain</p></div>
              <span className="w-fit rounded-full bg-[#eef6f0] px-3 py-1.5 text-[11px] font-bold text-[#39775a]">4 assets</span>
            </div>
            <div className="hidden grid-cols-[1.5fr_.7fr_.7fr] border-b border-[#e9f0ea] px-7 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#91a399] sm:grid"><span>Asset</span><span>Balance</span><span className="text-right">Value</span></div>
            <div className="divide-y divide-[#e6eee8]">
              {holdings.map((holding) => {
                const colors = toneClasses(holding.tone)
                return <div key={holding.id} className="grid gap-4 px-5 py-5 transition-colors hover:bg-[#f3faf5] sm:grid-cols-[1.5fr_.7fr_.7fr] sm:items-center sm:px-7">
                  <div className="flex min-w-0 items-center gap-3.5"><TokenMark holding={holding} /><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-bold text-[#234a39]">{holding.name}</span><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} /></div><div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-[#7c9186]"><span className="font-['DM_Mono']">{holding.symbol}</span><span>·</span><span>{categoryLabel(holding.category)}</span>{holding.id !== "eth" && <><span>·</span><a href={`${explorerUrl}/address/${holding.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#168355] hover:underline">Contract <ExternalLink className="h-2.5 w-2.5" /></a></>}</div></div></div>
                  <div className="pl-[59px] sm:pl-0"><p className="text-sm font-semibold text-[#315544]">{holding.balance} {holding.symbol}</p><p className="mt-1 text-[11px] text-[#899b91]">{holding.price ? `${holding.price} per token` : "Price unavailable"}</p></div>
                  <div className="pl-[59px] sm:pl-0 sm:text-right"><p className={`text-base font-bold ${holding.value ? "text-[#214c37]" : "text-[#899b91]"}`}>{holding.value ?? "Unpriced"}</p>{holding.allocation !== undefined ? <div className="mt-2 flex items-center gap-2 sm:justify-end"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e4eee6]"><div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${Math.max(3, holding.allocation)}%` }} /></div><span className="w-11 text-right font-['DM_Mono'] text-[10px] text-[#83958b]">{holding.allocation.toFixed(2)}%</span></div> : <p className="mt-1 text-[11px] text-[#aa8e5b]">Excluded from total</p>}</div>
                </div>
              })}
            </div>
          </section>

          <footer className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#d8e7dc] bg-[#edf6ef]/70 px-5 py-4 text-[11px] leading-5 text-[#70867a] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="flex items-start gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#68a684]" />Balance reads stay in your browser. Live valuation sends your wallet address and held asset identifiers to 0x through FondrFi; balances are not stored. Values are indicative USDG routes, and unpriced assets are excluded.</span>
            <a href={`${explorerUrl}/address/${walletAddress}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#39775a] hover:text-[#168355] hover:underline">View wallet in Blockscout <ExternalLink className="h-3 w-3" /></a>
          </footer>
        </section>
      </div>
    </main>
  )
}