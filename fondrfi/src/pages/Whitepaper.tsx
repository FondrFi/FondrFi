import { useEffect } from "react"
import { Link } from "wouter"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleAlert,
  ExternalLink,
  FileText,
  Layers3,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Footer } from "@/components/home/Footer"
import { Badge } from "@/components/ui/badge"

const contents = [
  ["01", "Executive summary", "summary"],
  ["02", "The opportunity", "opportunity"],
  ["03", "Protocol design", "design"],
  ["04", "FONDRFI token", "token"],
  ["05", "Earn and staking", "staking"],
  ["06", "Security and risks", "security"],
  ["07", "Roadmap", "roadmap"],
]

function PaperSection({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/70 pt-12 first:border-0 first:pt-0">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        <span className="font-mono">{number}</span>
        <span className="h-px w-8 bg-primary/30" />
        <span>FondrFi paper</span>
      </div>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      <div className="mt-5 space-y-4 text-[15px] leading-8 text-muted-foreground">{children}</div>
    </section>
  )
}

export function Whitepaper() {
  useEffect(() => {
    document.title = "Whitepaper · FondrFi"
    const description = "Read the FondrFi pre-launch whitepaper: protocol architecture, market access, FONDRFI utility, staking, and risk principles."
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
          <div className="absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-[150px]" />
          <div className="absolute right-[-8rem] top-[26rem] h-[34rem] w-[34rem] rounded-full bg-blue-500/10 blur-[150px]" />
        </div>

        <section className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pb-28 md:pt-12">
          <div className="flex items-center justify-between gap-4">
            <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to docs</Link>
            <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:inline-flex"><FileText className="h-3.5 w-3.5" /> Pre-launch edition</span>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <Badge variant="outline" className="rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-primary">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                FondrFi whitepaper
              </Badge>
              <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold tracking-tight md:text-7xl">
                An open gateway to onchain markets.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                A pre-launch protocol brief for a self-custodial way to discover, trade, and eventually earn across crypto, tokenized equities, and real-world assets.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-2">Draft v0.1</span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-2">August 2026</span>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-amber-300">Deployment facts pending</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4 backdrop-blur-xl"><Network className="h-5 w-5 text-primary" /><p className="mt-5 text-xs text-muted-foreground">Settlement layer</p><p className="mt-1 font-display text-lg font-semibold">Robinhood Chain</p></div>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4 backdrop-blur-xl"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-5 text-xs text-muted-foreground">Control model</p><p className="mt-1 font-display text-lg font-semibold">Non-custodial</p></div>
            </div>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-center">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contents</p>
              <nav className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-4 lg:block lg:space-y-1">
                {contents.map(([number, label, id]) => (
                  <a key={id} href={`#${id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <span className="font-mono text-primary">{number}</span>{label}
                  </a>
                ))}
              </nav>
              <div className="mt-7 hidden rounded-2xl border border-border/70 bg-secondary/20 p-4 lg:block">
                <BookOpen className="h-4 w-4 text-primary" />
                <p className="mt-4 text-sm font-semibold">Living document</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Contract addresses, reward mechanics, and token parameters will be updated when verified.</p>
              </div>
            </aside>

            <article className="min-w-0 space-y-12">
              <PaperSection id="summary" number="01" title="Executive summary">
                <p>FondrFi is building a focused gateway for onchain market access on Robinhood Chain. The product brings verified asset discovery, route-aware trading, portfolio visibility, and a future native earning layer into one self-custodial interface.</p>
                <p>The core principle is simple: make powerful onchain actions easier to understand without hiding the underlying facts. FondrFi labels indicative data, surfaces unavailable values honestly, keeps approval scope explicit, and leaves final control with the user’s wallet.</p>
                <div className="grid gap-3 pt-3 sm:grid-cols-3">
                  {[
                    [Layers3, "Discover", "Verified crypto, stock-token, and ETF metadata."],
                    [ArrowRight, "Route", "Indicative market access with clear availability."],
                    [LockKeyhole, "Control", "Every write action requires the user’s signature."],
                  ].map(([Icon, title, copy]) => (
                    <div key={title as string} className="rounded-2xl border border-border/70 bg-secondary/20 p-4"><Icon className="h-4 w-4 text-primary" /><h3 className="mt-4 text-sm font-semibold text-foreground">{title as string}</h3><p className="mt-2 text-xs leading-relaxed">{copy as string}</p></div>
                  ))}
                </div>
              </PaperSection>

              <PaperSection id="opportunity" number="02" title="The opportunity">
                <p>Onchain markets are becoming more diverse: users may move between crypto assets, tokenized public-market exposure, and real-world assets without leaving the same settlement environment. Yet the user experience is often fragmented across wallets, explorers, quote screens, and protocol-specific interfaces.</p>
                <p>FondrFi’s opportunity is not to replace the chain or take custody of assets. It is to provide a legible control surface: a place where a user can understand what an asset is, what route is available, what will be approved, and what the chain actually confirmed.</p>
                <p>This approach also creates a higher standard for product truth. When history, liquidity, APY, or valuation is not available from a trusted source, the interface should say so. A quiet unavailable state is more useful than false precision.</p>
              </PaperSection>

              <PaperSection id="design" number="03" title="Protocol design">
                <p>FondrFi is designed as a non-custodial application layer on top of Robinhood Chain and compatible onchain protocols. Wallet connections remain in the browser. Read operations are used to display balances, routes, and positions; write operations are submitted to the user’s wallet for review and signature.</p>
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-secondary/20">
                  {[
                    ["Asset registry", "Verified token metadata, categories, decimals, and explorer references."],
                    ["Market access", "Indicative USDG routes for supported assets, with unavailable states when no verified route exists."],
                    ["Wallet layer", "EIP-1193-compatible browser wallets with Robinhood Chain network and account checks."],
                    ["Earn layer", "A future FONDRFI staking contract surfaced through a separately validated configuration boundary."],
                  ].map(([title, copy]) => <div key={title} className="border-b border-border/70 px-5 py-4 last:border-0"><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-xs leading-relaxed">{copy}</p></div>)}
                </div>
              </PaperSection>

              <PaperSection id="token" number="04" title="The FONDRFI token">
                <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5">
                  <div className="flex items-start gap-3"><CircleAlert className="mt-1 h-5 w-5 shrink-0 text-amber-300" /><div><h3 className="font-semibold text-foreground">Token deployment is pending</h3><p className="mt-2 text-sm leading-relaxed">The FONDRFI token has not been deployed. Contract address, supply, allocation, vesting, launch timing, and market-making parameters are intentionally not specified in this edition.</p></div></div>
                </div>
                <p>FONDRFI is intended to be the native community asset associated with the FondrFi ecosystem. Its final utility and economic parameters will only be documented after the deployment design is approved and the relevant contracts are independently verified.</p>
                <p>Until then, any third-party token claiming to be the official FONDRFI asset should be treated as unverified. FondrFi will publish the official address through its documented channels and the application once available.</p>
              </PaperSection>

              <PaperSection id="staking" number="05" title="Earn and staking">
                <p>The Earn surface is being prepared for a real FONDRFI staking pool. The intended interaction is direct and transparent: a user connects on Robinhood Chain, reviews the live position, approves only the amount they choose, and signs stake, unstake, or claim transactions individually.</p>
                <p>The pool is not active in this pre-launch edition. No APY, TVL, reward rate, or pending reward value is presented as fact. Once deployed, those values will be populated only from the verified contract interface or a documented trusted source.</p>
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5"><p className="text-sm font-semibold text-foreground">Read the implementation status in the app.</p><Link href="/earn" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Open Earn <ArrowRight className="h-4 w-4" /></Link></div>
              </PaperSection>

              <PaperSection id="security" number="06" title="Security and risks">
                <p>Users should treat every onchain transaction as consequential. FondrFi does not guarantee execution, market availability, token value, rewards, or protocol solvency. Wallet prompts, gas costs, slippage, smart-contract bugs, oracle or route failures, and chain congestion can all affect an outcome.</p>
                <div className="space-y-3">
                  {[
                    ["Contract risk", "Smart contracts can contain vulnerabilities or behave differently than expected. Review verified addresses and independent audits when available."],
                    ["Market risk", "Tokenized assets and crypto can lose value. Indicative routes are not guarantees of execution or liquidity."],
                    ["Configuration risk", "Only official deployment details should activate the Earn contract adapter. Placeholder or unverified addresses must never be used."],
                    ["Operational risk", "A pending transaction may require time to confirm. Use the transaction hash and Blockscout to reconcile its final state."],
                  ].map(([title, copy]) => <div key={title} className="flex gap-3 rounded-2xl border border-border/70 bg-secondary/20 p-4"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" /><div><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-sm leading-relaxed">{copy}</p></div></div>)}
                </div>
              </PaperSection>

              <PaperSection id="roadmap" number="07" title="Roadmap">
                <p>FondrFi is progressing in observable milestones rather than promising dates before the underlying contracts and data sources are ready.</p>
                <div className="space-y-3">
                  {[
                    ["Now", "Verified market discovery, indicative route visibility, non-custodial wallet flows, and a launch-ready Earn experience."],
                    ["Next", "Publish the official FONDRFI token and staking deployments, ABI details, economics, and verification references."],
                    ["Then", "Activate live staking reads and transactions after contract validation and mainnet testing."],
                  ].map(([title, copy], index) => <div key={title} className="flex gap-4 rounded-2xl border border-border/70 bg-background/60 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">{index + 1}</span><div><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-sm leading-relaxed">{copy}</p></div></div>)}
                </div>
                <p className="pt-2 text-sm">This whitepaper is a living pre-launch document. For practical usage, continue to the <Link href="/docs" className="font-medium text-primary hover:underline">FondrFi docs</Link>.</p>
              </PaperSection>

              <div className="border-t border-border/70 pt-8 text-xs leading-relaxed text-muted-foreground">
                <p>Nothing in this document is financial, legal, tax, or investment advice. Product capabilities, token utility, and protocol parameters may change before launch. Verify all official links and contract addresses through FondrFi’s published channels.</p>
                <a href="https://robinhoodchain.blockscout.com" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline">Robinhood Chain Blockscout <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}