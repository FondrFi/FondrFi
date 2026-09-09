import { useEffect } from "react"
import { Link } from "wouter"
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  LockKeyhole,
  Network,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { Footer } from "@/components/home/Footer"
import { Badge } from "@/components/ui/badge"

const sections = [
  { id: "start", label: "Start here" },
  { id: "trade", label: "Trading on Robinhood Chain" },
  { id: "earn", label: "Earn and staking" },
  { id: "safety", label: "Safety model" },
  { id: "launch", label: "Launch status" },
]

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("/")) {
    return <Link href={href} className="font-medium text-primary hover:underline">{children}</Link>
  }
  return <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{children}</a>
}

function InfoCard({ icon: Icon, label, value, detail }: { icon: typeof ShieldCheck; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="mt-3 font-display text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  )
}

export function Docs() {
  useEffect(() => {
    document.title = "Docs · FondrFi"
    const description = "Learn how FondrFi works, from trading verified assets to the future FONDRFI staking pool."
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "description"
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [])

  return (
    <>
      <main className="relative flex-1 overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-12 h-96 w-96 rounded-full bg-primary/10 blur-[130px]" />
          <div className="absolute right-0 top-72 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[150px]" />
        </div>

        <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-16">
          <div className="max-w-3xl">
            <Badge variant="outline" className="rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-primary">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              FondrFi documentation
            </Badge>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
              A clearer path to onchain markets.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Everything you need to understand FondrFi before connecting a wallet or signing a transaction.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={Network} label="Network" value="Robinhood Chain" detail="The default network for FondrFi activity." />
            <InfoCard icon={ShieldCheck} label="Custody" value="Self-custody" detail="Your wallet holds the keys and approves every action." />
            <InfoCard icon={LockKeyhole} label="FONDRFI staking" value="Pre-launch" detail="Contract details will be published after deployment." />
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <aside className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">On this page</p>
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex">
                    <ChevronRight className="h-3.5 w-3.5 text-primary" />
                    {section.label}
                  </a>
                ))}
              </nav>
              <div className="mt-7 hidden rounded-2xl border border-primary/20 bg-primary/10 p-4 lg:block">
                <p className="text-sm font-semibold">Ready to explore?</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Browse verified assets with no wallet connection required.</p>
                <Link href="/explore" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Open Explore <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </aside>

            <article className="min-w-0 max-w-3xl space-y-14">
              <section id="start" className="scroll-mt-24">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">01 · Start here</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">FondrFi in one minute</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  FondrFi is a non-custodial DeFi gateway for crypto, tokenized equities, and real-world assets on Robinhood Chain. It helps you discover verified assets, inspect available market routes, and interact from the wallet you already own.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    ["01", "Connect", "Choose a compatible browser wallet only when you are ready to trade or interact."],
                    ["02", "Verify", "Confirm the network, token, amount, allowance, and transaction details in your wallet."],
                    ["03", "Control", "Sign or reject each action yourself. FondrFi never takes custody of your assets."],
                  ].map(([number, title, copy]) => (
                    <div key={number} className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                      <span className="font-mono text-xs font-semibold text-primary">{number}</span>
                      <h3 className="mt-5 text-sm font-semibold">{title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="trade" className="scroll-mt-24 border-t border-border/70 pt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">02 · Trade</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Trading on Robinhood Chain</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  The Trade screen uses verified asset metadata and refreshed route data. Indicative prices are shown only when FondrFi can identify a valid route; a missing route is shown as unavailable instead of being estimated.
                </p>
                <ol className="mt-7 space-y-4">
                  {[
                    ["Choose a pair", "Select a verified asset from the token registry and review its symbol, contract, and decimals."],
                    ["Review the quote", "Check the route, minimum received, slippage, allowance target, and wallet network before signing."],
                    ["Approve the exact amount", "For ERC-20 tokens, FondrFi requests only the amount required for this trade—not an unlimited allowance."],
                    ["Submit the swap", "After approval, the quote is refreshed. Review the new quote and submit the swap as a separate wallet confirmation."],
                  ].map(([title, copy], index) => (
                    <li key={title} className="flex gap-4 rounded-2xl border border-border/70 bg-background/60 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">{index + 1}</span>
                      <div>
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 text-sm text-muted-foreground"><DocLink href="/explore">Explore live markets</DocLink> to inspect assets without connecting a wallet.</p>
              </section>

              <section id="earn" className="scroll-mt-24 border-t border-border/70 pt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">03 · Earn</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">FONDRFI staking</h2>
                <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <div>
                      <h3 className="font-semibold">The staking pool is not live yet</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        FONDRFI and its staking contract will be deployed separately. Until the official addresses and ABI details are published, the Earn page stays in pre-launch mode and cannot send a staking transaction.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  After launch, the Earn flow will read token balance, allowance, staked position, and pending rewards from Robinhood Chain. Stake, unstake, and claim actions will be exact-amount transactions with receipt tracking and recovery when a wallet transaction remains pending.
                </p>
                <Link href="/earn" className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary">View Earn readiness <ArrowRight className="h-4 w-4" /></Link>
              </section>

              <section id="safety" className="scroll-mt-24 border-t border-border/70 pt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">04 · Safety</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">A safety model you can inspect</h2>
                <div className="mt-6 space-y-3">
                  {[
                    ["Your wallet stays yours", "FondrFi uses the browser wallet you choose. It does not ask for seed phrases or private keys."],
                    ["Network checks happen first", "Actions are scoped to Robinhood Chain. A wrong-network wallet must be switched before reads or writes continue."],
                    ["Data is labeled honestly", "Unavailable history, routes, APY, TVL, and rewards are not replaced with guesses or static numbers."],
                    ["Transactions are trackable", "When a transaction is submitted, its hash can be followed in Robinhood Chain Blockscout."],
                  ].map(([title, copy]) => (
                    <div key={title} className="flex gap-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p></div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="launch" className="scroll-mt-24 border-t border-border/70 pt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">05 · Launch status</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">What is confirmed today</h2>
                <div className="mt-6 divide-y divide-border/70 rounded-2xl border border-border/70 bg-background/60">
                  {[
                    ["Robinhood Chain network", "Configured"],
                    ["Verified asset discovery and market routes", "Available"],
                    ["FONDRFI token contract", "Awaiting deployment"],
                    ["FONDRFI staking contract", "Awaiting deployment"],
                    ["Tokenomics and reward parameters", "To be published"],
                  ].map(([label, status]) => (
                    <div key={label} className="flex items-center justify-between gap-4 px-4 py-4 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status === "Available" || status === "Configured" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{status}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  For the product vision and protocol architecture, read the <DocLink href="/whitepaper">FondrFi Whitepaper</DocLink>. It is a living pre-launch document and will be updated when deployment facts are final.
                </p>
              </section>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}