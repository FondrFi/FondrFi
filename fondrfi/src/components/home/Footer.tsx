import { ArrowUpRight } from "lucide-react"
import { SiTelegram, SiX } from "react-icons/si"
import { Link } from "wouter"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Trade", href: "#trade" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "About FondrFi", href: "#about" },
      { label: "Robinhood Chain", href: "#about" },
      { label: "Market access", href: "#market-access" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Whitepaper", href: "/whitepaper" },
      { label: "FAQ", href: "#faq" },
    ],
  },
]

function FooterLink({ href, label }: { href: string; label: string }) {
  const content = (
    <>
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
    </>
  )

  if (href.startsWith("/") || href.startsWith("#")) {
    const target = href.startsWith("#") ? `/${href}` : href
    return <Link href={target} className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">{content}</Link>
  }

  return <a href={href} className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">{content}</a>
}

export function Footer() {
  return (
    <footer id="footer" className="mt-8 border-t border-border bg-secondary/20 scroll-mt-24">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-14 md:grid-cols-[1.3fr_2fr] md:py-20">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-3 text-2xl font-display font-semibold text-foreground">
            <img src={`${import.meta.env.BASE_URL}fondrfi-logo.png`} alt="FondrFi" className="h-10 w-10 object-contain" />
            FondrFi
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            A focused DeFi gateway for crypto, tokenized equities, and real-world assets on Robinhood Chain.
          </p>
          <div className="mt-7 flex items-center gap-3">
            <a aria-label="FondrFi on X" href="https://x.com/fondrfi" target="_blank" rel="noreferrer" className="rounded-full border border-border bg-background p-2.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <SiX className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 FondrFi. Interface preview for onchain market exploration.</span>
          <Link href="/#trade" className="transition-colors hover:text-primary">Back to trade</Link>
        </div>
      </div>
    </footer>
  )
}