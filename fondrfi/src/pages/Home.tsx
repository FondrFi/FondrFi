import { useState } from "react"
import { SwapCard } from "@/components/swap/SwapCard"
import {
  SiApple,
  SiCoinbase,
  SiGoogle,
  SiMeta,
  SiNetflix,
  SiNvidia,
  SiTesla,
} from "react-icons/si"
import { StatsSection } from "@/components/home/StatsSection"
import { HowItWorksSection } from "@/components/home/HowItWorksSection"
import { MarketAccessSection } from "@/components/home/MarketAccessSection"
import { CapabilitiesSection } from "@/components/home/CapabilitiesSection"
import { ExploreSection } from "@/components/home/ExploreSection"
import { FAQSection } from "@/components/home/FAQSection"
import { Footer } from "@/components/home/Footer"

type MarketLogoKind = "nvda" | "apple" | "google" | "tesla" | "meta" | "nflx" | "coin"

const toneClasses = {
  primary: "bg-primary/10 border-primary/20 text-primary shadow-primary/5",
  "blue-500": "bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-blue-500/5",
  "blue-400": "bg-blue-400/10 border-blue-400/20 text-blue-400 shadow-blue-400/5",
  "orange-500": "bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-orange-500/5",
  "violet-500": "bg-violet-500/10 border-violet-500/20 text-violet-500 shadow-violet-500/5",
  "red-500": "bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/5",
  "cyan-500": "bg-cyan-500/10 border-cyan-500/20 text-cyan-500 shadow-cyan-500/5",
} as const

function MarketLogo({ kind }: { kind: MarketLogoKind }) {
  const props = { className: "h-7 w-7", "aria-hidden": true }

  if (kind === "nvda") return <SiNvidia {...props} />
  if (kind === "apple") return <SiApple {...props} />
  if (kind === "google") return <SiGoogle {...props} />
  if (kind === "tesla") return <SiTesla {...props} />
  if (kind === "meta") return <SiMeta {...props} />
  if (kind === "nflx") return <SiNetflix {...props} />
  return <SiCoinbase {...props} />
}

const marketStocks: Array<{
  ticker: string
  company: string
  price: string
  change: string
  logo: MarketLogoKind
  position: string
  size: string
  tone: keyof typeof toneClasses
  delay: string
}> = [
  { ticker: "NVDA", company: "NVIDIA", price: "$208.48", change: "-2.91%", logo: "nvda", position: "top-[15%] left-[10%]", size: "w-16 h-16", tone: "primary", delay: "1s" },
  { ticker: "AAPL", company: "Apple", price: "$310.34", change: "+0.32%", logo: "apple", position: "bottom-[20%] left-[15%]", size: "w-12 h-12", tone: "blue-500", delay: "2s" },
  { ticker: "GOOG", company: "Alphabet", price: "$344.59", change: "+0.83%", logo: "google", position: "top-[25%] right-[12%]", size: "w-14 h-14", tone: "blue-400", delay: "0.5s" },
  { ticker: "TSLA", company: "Tesla", price: "$348.95", change: "-3.83%", logo: "tesla", position: "bottom-[30%] right-[18%]", size: "w-10 h-10", tone: "orange-500", delay: "1.5s" },
  { ticker: "META", company: "Meta", price: "$559.02", change: "+1.66%", logo: "meta", position: "top-[8%] right-[28%]", size: "w-11 h-11", tone: "violet-500", delay: "2.4s" },
  { ticker: "NFLX", company: "Netflix", price: "$80.01", change: "+0.53%", logo: "nflx", position: "bottom-[14%] right-[34%]", size: "w-14 h-14", tone: "red-500", delay: "0.8s" },
  { ticker: "COIN", company: "Coinbase", price: "$179.48", change: "-3.76%", logo: "coin", position: "top-[42%] left-[4%]", size: "w-10 h-10", tone: "cyan-500", delay: "1.8s" },
]

export function Home() {
  const [activeTicker, setActiveTicker] = useState<string | null>(null)

  return (
    <div className="flex flex-col w-full bg-background">
      <div id="trade" className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-start pt-12 md:pt-24 pb-20 overflow-hidden scroll-mt-24">
        
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] animate-float opacity-50 dark:opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] animate-float-reverse opacity-50 dark:opacity-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[120px] animate-spin-slow opacity-50 dark:opacity-20" />
          
          {/* Tokenized stock references available on Robinhood Chain */}
          {marketStocks.map((stock, index) => {
            const isActive = activeTicker === stock.ticker

            return (
              <div
                key={stock.ticker}
                role="button"
                tabIndex={0}
                title={`${stock.ticker} ${stock.company} · ${stock.price}`}
                aria-label={`Show ${stock.ticker} market reference price`}
                onMouseEnter={() => setActiveTicker(stock.ticker)}
                onMouseLeave={() => setActiveTicker(null)}
                onFocus={() => setActiveTicker(stock.ticker)}
                onBlur={() => setActiveTicker(null)}
                className={`market-orb pointer-events-auto absolute ${stock.position} ${stock.size} ${toneClasses[stock.tone]} flex cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm shadow-lg ${index % 2 === 0 ? "animate-float" : "animate-float-reverse"} transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary/50 ${isActive ? "z-20 scale-110 blur-0 opacity-100" : "blur-[1.5px] opacity-55"}`}
                style={{ animationDelay: stock.delay }}
              >
                <span className={`transition-transform duration-500 ${isActive ? "scale-110" : ""}`}>
                  <MarketLogo kind={stock.logo} />
                </span>
                <span className={`pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-36 -translate-x-1/2 rounded-2xl border border-border/70 bg-background/95 p-3 text-left shadow-xl backdrop-blur-xl transition-all duration-300 ${isActive ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
                  <span className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toneClasses[stock.tone]}`}>
                      <MarketLogo kind={stock.logo} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-xs font-semibold text-foreground">{stock.ticker}</strong>
                      <span className="block truncate text-[10px] text-muted-foreground">{stock.company}</span>
                    </span>
                  </span>
                  <span className="mt-3 flex items-end justify-between gap-2">
                    <strong className="text-sm font-semibold text-foreground">{stock.price}</strong>
                    <span className={`text-[10px] font-medium ${stock.change.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}>{stock.change}</span>
                  </span>
                  <span className="mt-1 block text-[9px] text-muted-foreground">Market close · Aug 24</span>
                </span>
              </div>
            )
          })}
        </div>

        <div className="relative z-10 w-full px-4 text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-foreground mb-4">
            Swap anytime, anywhere.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-sans">
            Fast, secure, and low-fee trading on Robinhood Chain.
          </p>
        </div>

        <SwapCard />

        <div className="mt-16 text-center z-10 max-w-lg mx-auto px-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Buy and sell crypto with <span className="text-primary font-medium">zero app fees</span> on Robinhood Chain.
            Connect your wallet to start capitalizing on the future of finance.
          </p>
        </div>
      </div>

      <StatsSection />
      <HowItWorksSection />
      <CapabilitiesSection />
      <MarketAccessSection />
      <ExploreSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
