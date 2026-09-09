import { SiX } from "react-icons/si";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background pt-16 pb-12 mt-12">
       <div className="w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-8 w-full md:w-1/3">
             <div className="flex items-center gap-2">
                <img src={`${import.meta.env.BASE_URL}fondrfi-logo.png`} alt="FondrFi" className="w-9 h-9 object-contain" />
                <span className="font-display font-semibold text-xl tracking-tight">FondrFi</span>
             </div>
             <div className="flex items-center gap-5 text-muted-foreground">
                <a aria-label="FondrFi on X" href="https://x.com/fondrfi" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors"><SiX className="w-5 h-5" /></a>
             </div>
             <div className="text-sm text-muted-foreground">
               © {new Date().getFullYear()} FondrFi Labs
             </div>
          </div>
          
          <div className="w-full md:w-2/3 grid grid-cols-2 sm:grid-cols-4 gap-8">
             <div className="flex flex-col gap-4">
               <h4 className="font-semibold text-sm text-foreground mb-1">Products</h4>
                <Link href="/#trade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Trade</Link>
                <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
                <Link href="/portfolio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
             </div>
             <div className="flex flex-col gap-4">
               <h4 className="font-semibold text-sm text-foreground mb-1">Protocol</h4>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
                <Link href="/whitepaper" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Whitepaper</Link>
                <Link href="/#market-access" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Market access</Link>
                <Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
             </div>
             <div className="flex flex-col gap-4">
               <h4 className="font-semibold text-sm text-foreground mb-1">Company</h4>
                <Link href="/#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
                <Link href="/earn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Earn readiness</Link>
             </div>
             <div className="flex flex-col gap-4">
               <h4 className="font-semibold text-sm text-foreground mb-1">Need help?</h4>
                <Link href="/docs#safety" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Safety guide</Link>
                <Link href="/docs#trading" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Trading guide</Link>
                <a href="https://x.com/fondrfi" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ask on X</a>
             </div>
          </div>
       </div>
    </footer>
  )
}
