import { ArrowUpRight, BookOpenCheck, ChartNoAxesCombined, MessagesSquare, Sparkles } from "lucide-react"

const links = [
  { icon: Sparkles, eyebrow: "Start here", number: "01", title: "How it works", desc: "Get a concise overview of trading on FondrFi and Robinhood Chain", href: "#how-it-works", tone: "text-emerald-300 bg-emerald-400/10 border-emerald-300/20" },
  { icon: ChartNoAxesCombined, eyebrow: "Market view", number: "02", title: "Market notes", desc: "See the tokenized stock references around the live swap experience", href: "#trade", tone: "text-sky-300 bg-sky-400/10 border-sky-300/20" },
  { icon: BookOpenCheck, eyebrow: "Build your edge", number: "03", title: "Product guide", desc: "Explore the trading, routing, liquidity, and API capabilities", href: "#features", tone: "text-violet-300 bg-violet-400/10 border-violet-300/20" },
  { icon: MessagesSquare, eyebrow: "Keep exploring", number: "04", title: "Stay connected", desc: "Find FondrFi's product links and ecosystem entry points below", href: "#footer", tone: "text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-300/20" },
]

export function ExploreSection() {
  return (
    <section id="explore" className="w-full max-w-6xl mx-auto px-4 py-28 scroll-mt-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-secondary/20 p-5 dark:border-white/10 dark:bg-[#121212] sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Navigate the protocol
            </div>
            <h2 className="max-w-xl text-4xl font-display font-semibold tracking-tight text-foreground md:text-5xl">
              Explore the FondrFi Universe
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Follow the path that matches how you want to participate in onchain markets.
          </p>
        </div>

        <div className="relative grid gap-3 md:grid-cols-2">
          {links.map((link) => {
            const Icon = link.icon

            return (
              <a
                key={link.number}
                href={link.href}
                className="group relative min-h-52 overflow-hidden rounded-3xl border border-border/70 bg-background/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-background hover:shadow-2xl hover:shadow-black/10 dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-white/20 dark:hover:bg-white/[0.07] dark:hover:shadow-black/20 sm:p-6"
              >
                <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border ${link.tone} transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      <span>{link.eyebrow}</span>
                      <span className="h-px w-5 bg-border" />
                      <span>{link.number}</span>
                    </div>
                    <h3 className="text-2xl font-display font-medium text-foreground transition-colors group-hover:text-primary">
                      {link.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {link.desc}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground dark:border-white/10">
                    <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
                <div className="pointer-events-none absolute -bottom-14 -right-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
