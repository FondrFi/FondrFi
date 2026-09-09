import { ArrowUpRight, Coins, Globe2, Layers3, ShieldCheck } from "lucide-react"

const markets = [
  {
    icon: Coins,
    label: "Crypto",
    title: "Native digital assets",
    description: "Discover supported crypto assets and inspect indicative routes into the network’s reference unit.",
    tone: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: Layers3,
    label: "Tokenized equities",
    title: "Market exposure, onchain",
    description: "Explore verified tokenized stock and ETF references where availability and route data are supported.",
    tone: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: Globe2,
    label: "Real-world assets",
    title: "A wider market surface",
    description: "A focused foundation for bringing more real-world market categories closer to onchain users.",
    tone: "text-violet-500 bg-violet-500/10 border-violet-500/20",
  },
]

export function MarketAccessSection() {
  return (
    <section id="market-access" className="w-full max-w-6xl mx-auto px-4 py-28 scroll-mt-24 md:py-36">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-secondary/20 p-6 dark:border-white/10 dark:bg-white/[0.025] sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-72 w-72 rounded-full bg-sky-500/10 blur-[100px]" />

        <div className="relative grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end md:gap-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Market access
            </div>
            <h2 className="max-w-lg text-4xl font-display font-semibold leading-[1.06] tracking-tight text-foreground md:text-5xl">
              One surface for a broader market.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:justify-self-end">
            FondrFi brings different asset categories into one focused experience while keeping the source, route, and availability visible.
          </p>
        </div>

        <div className="relative mt-10 grid gap-3 md:grid-cols-3">
          {markets.map((market) => {
            const Icon = market.icon
            return (
              <article key={market.label} className="rounded-3xl border border-border/70 bg-background/70 p-5 transition-colors hover:border-primary/30 hover:bg-background sm:p-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${market.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{market.label}</p>
                <h3 className="mt-2 text-xl font-display font-medium text-foreground">{market.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{market.description}</p>
              </article>
            )
          })}
        </div>

        <div className="relative mt-4 flex flex-col gap-4 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Not every asset has a live route. FondrFi marks unavailable data instead of filling the gap with guesses.
          </p>
          <a href="/explore" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary hover:underline">
            Browse verified assets
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}