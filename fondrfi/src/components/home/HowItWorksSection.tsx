import { ArrowRight, Check, Eye, ShieldCheck, WalletCards } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: WalletCards,
    title: "Connect when ready",
    description: "Explore markets without a wallet. Connect a compatible wallet only when you want to interact.",
  },
  {
    number: "02",
    icon: Eye,
    title: "Review the route",
    description: "See the asset, quoted output, slippage, allowance, and network before anything reaches your wallet.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Sign and stay in control",
    description: "Approve the exact amount, confirm the action yourself, and track the result onchain.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 py-28 scroll-mt-24 md:py-36">
      <div className="grid items-end gap-8 md:grid-cols-[1.25fr_.75fr] md:gap-16">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
            How it works
          </div>
          <h2 className="max-w-2xl text-4xl font-display font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Simple by design.
            <span className="block text-muted-foreground">Onchain by default.</span>
          </h2>
        </div>
        <p className="max-w-sm text-base leading-relaxed text-muted-foreground md:justify-self-end">
          A clear path from discovery to execution—without hiding the details that matter when you move value onchain.
        </p>
      </div>

      <div className="relative mt-12 grid gap-3 md:grid-cols-3">
        <div className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <article key={step.number} className="group relative rounded-[1.75rem] border border-border/70 bg-secondary/20 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-secondary/40 md:p-7">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs font-semibold tracking-wider text-primary">{step.number}</span>
              </div>
              <h3 className="mt-10 text-xl font-display font-medium text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </article>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col gap-5 rounded-[1.75rem] border border-border/70 bg-background/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your keys stay yours.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">FondrFi never asks for a seed phrase or private key. Every wallet action is yours to approve or reject.</p>
          </div>
        </div>
        <a href="#trade" className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">
          Start with a swap
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  )
}