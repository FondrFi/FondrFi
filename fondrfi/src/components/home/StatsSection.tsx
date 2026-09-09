import { ArrowRight } from "lucide-react"

function StatCard({ label, value, valueColor = "text-foreground" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex h-36 flex-col justify-between rounded-3xl border border-border/70 bg-background/70 p-6 transition-colors hover:border-primary/25 hover:bg-background dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`text-4xl font-display font-semibold ${valueColor}`}>{value}</span>
    </div>
  )
}

export function StatsSection() {
  return (
    <section id="about" className="w-full max-w-6xl mx-auto px-4 py-28 md:py-36 scroll-mt-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col items-start">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
            FondrFi protocol stats
          </div>
          <h2 className="text-4xl font-display font-semibold leading-[1.06] tracking-tight text-foreground md:text-5xl">
            One gateway for
            <span className="block text-muted-foreground">onchain markets.</span>
          </h2>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
            FondrFi brings crypto, tokenized equities, and real-world assets into one focused trading experience.
          </p>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Built around Robinhood Chain, it keeps discovery, swaps, and liquidity within reach—without making the experience feel complicated.
          </p>
          <a href="#trade" className="group mt-9 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:bg-foreground/90">
            Trade without fees
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <div className="rounded-[1.75rem] border border-border/70 bg-secondary/20 p-5 dark:border-white/10 dark:bg-white/[0.02] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">FondrFi at a glance</span>
            <span className="text-xs text-muted-foreground">Robinhood Chain</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard label="App trading fees" value="0%" valueColor="text-primary" />
            <StatCard label="Market types" value="3" />
            <StatCard label="Access window" value="24/7" />
            <StatCard label="Network focus" value="1 chain" valueColor="text-primary" />
          </div>
        </div>
      </div>
    </section>
  )
}