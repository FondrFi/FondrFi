import { ArrowRight, Monitor, Wallet, Zap, BarChart4, Code2, Network, CheckCircle2, Shield, Droplets, Globe, CreditCard, Send, ArrowDownToLine } from "lucide-react"
import { SiApple, SiNvidia, SiTesla } from "react-icons/si"

function TokenRow({ name, symbol, price, change, color }: { name: string, symbol: string, price: string, change: string, color: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">{symbol[0]}</div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground leading-tight">{name}</span>
          <span className="text-xs text-muted-foreground leading-none mt-1">{symbol}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-foreground leading-tight">{price}</span>
        <span className={`text-xs font-medium leading-none mt-1 ${color}`}>{change}</span>
      </div>
    </div>
  )
}

export function CapabilitiesSection() {
  return (
    <section id="features" className="w-full max-w-6xl mx-auto px-4 py-28 scroll-mt-24">
      <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-foreground mb-10">
        Built for all the ways you swap
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tile 1: Web App */}
         <div className="col-span-1 rounded-[1.75rem] p-8 md:p-9 flex flex-col justify-between bg-blue-50 dark:bg-[#152943] hover:bg-blue-100 dark:hover:bg-[#1b3555] border border-blue-200/80 dark:border-white/5 transition-colors overflow-hidden relative group min-h-[420px]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
               <Monitor className="w-5 h-5" />
               <span className="font-semibold text-sm">Web App</span>
             </div>
             <h3 className="text-3xl font-display font-medium text-foreground mb-3">Explore. Swap. Repeat.</h3>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">Discover crypto, tokenized equities, and real-world assets from one trading surface on Robinhood Chain.</p>
              <a href="#trade" className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors bg-blue-500/10 dark:bg-black/20 px-5 py-2.5 rounded-full border border-blue-500/20 dark:border-white/10 w-max">
                Start swapping <ArrowRight className="w-4 h-4" />
              </a>
           </div>
           <div className="mt-12 bg-background border border-border rounded-2xl p-5 flex flex-col gap-1 shadow-xl relative z-10 translate-y-6 group-hover:translate-y-2 transition-transform duration-500 w-full max-w-md mx-auto md:mr-auto md:ml-0">
              <TokenRow name="Ethereum" symbol="ETH" price="$2,471.70" change="-0.51%" color="text-red-500" />
              <TokenRow name="USD Coin" symbol="USDC" price="$1.00" change="0%" color="text-muted-foreground" />
              <TokenRow name="FondrFi" symbol="FNDR" price="$4.38" change="+0.41%" color="text-primary" />
           </div>
        </div>

        {/* Tile 2: Wallet */}
         <div className="col-span-1 rounded-[1.75rem] p-8 md:p-9 flex flex-col justify-between bg-fuchsia-50 dark:bg-[#321d34] hover:bg-fuchsia-100 dark:hover:bg-[#482346] border border-fuchsia-200/80 dark:border-white/5 transition-colors overflow-hidden relative group min-h-[420px]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 mb-4">
               <Wallet className="w-5 h-5" />
                <span className="font-semibold text-sm">Wallet-ready</span>
             </div>
              <h3 className="text-3xl font-display font-medium text-foreground mb-3">Your wallet. Your keys.</h3>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">Connect a compatible wallet only when you are ready to trade, while keeping every step clear and controlled.</p>
              <a href="#trade" className="flex items-center gap-2 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-300 hover:text-fuchsia-700 dark:hover:text-fuchsia-200 transition-colors bg-fuchsia-500/10 dark:bg-black/20 px-5 py-2.5 rounded-full border border-fuchsia-500/20 dark:border-white/10 w-max">
                Open trade <ArrowRight className="w-4 h-4" />
              </a>
           </div>
           <div className="mt-12 w-64 mx-auto md:ml-auto md:mr-0 bg-foreground text-background border border-border rounded-t-3xl rounded-b-xl p-6 shadow-2xl relative z-10 translate-y-8 group-hover:translate-y-4 transition-transform duration-500 flex flex-col items-center">
               <div className="text-sm text-background/70 mb-2 font-medium">FondrFi wallet</div>
               <div className="text-4xl font-display font-medium mb-1">Ready to swap</div>
               <div className="text-xs text-primary mb-8 font-medium">You stay in control</div>
              <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center hover:scale-105 transition-transform"><CreditCard className="w-5 h-5 text-background" /></div>
                 <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center hover:scale-105 transition-transform"><Send className="w-5 h-5 text-background" /></div>
                 <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center hover:scale-105 transition-transform"><ArrowDownToLine className="w-5 h-5 text-background" /></div>
              </div>
           </div>
        </div>

        {/* Tile 3: Pro */}
         <div className="col-span-1 rounded-[1.75rem] p-8 md:p-9 flex flex-col justify-between bg-indigo-50 dark:bg-[#251d4a] hover:bg-indigo-100 dark:hover:bg-[#32235c] border border-indigo-200/80 dark:border-white/5 transition-colors overflow-hidden relative group min-h-[340px]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4">
               <Zap className="w-5 h-5" />
                <span className="font-semibold text-sm">Smart routing</span>
             </div>
             <h3 className="text-3xl font-display font-medium text-foreground mb-3">Smarter swaps.<br/>Aggregated liquidity.</h3>
             <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">Enjoy fast swaps, smart protection, and deep liquidity across multiple chains.</p>
              <a href="#trade" className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors bg-indigo-500/10 dark:bg-black/20 px-5 py-2.5 rounded-full border border-indigo-500/20 dark:border-white/10 w-max">
                Try a swap <ArrowRight className="w-4 h-4" />
              </a>
           </div>
           <div className="mt-8 flex flex-wrap gap-3 relative z-10">
              <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"><CheckCircle2 className="w-4 h-4" /> Best swap</div>
               <div className="flex items-center gap-2 bg-background text-foreground px-4 py-2.5 rounded-xl text-sm border border-border shadow-sm"><Shield className="w-4 h-4 text-indigo-500" /> Clear routing</div>
               <div className="flex items-center gap-2 bg-background text-foreground px-4 py-2.5 rounded-xl text-sm border border-border shadow-sm"><Droplets className="w-4 h-4 text-indigo-500" /> Deep liquidity</div>
           </div>
        </div>

        {/* Tile 4: Liquidity */}
         <div className="col-span-1 rounded-[1.75rem] p-8 md:p-9 flex flex-col justify-between bg-emerald-50 dark:bg-[#11322d] hover:bg-emerald-100 dark:hover:bg-[#17463e] border border-emerald-200/80 dark:border-white/5 transition-colors overflow-hidden relative group min-h-[340px]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-4">
               <BarChart4 className="w-5 h-5" />
               <span className="font-semibold text-sm">Liquidity Provision</span>
             </div>
             <h3 className="text-3xl font-display font-medium text-foreground mb-3">Provide liquidity,<br/>earn fees.</h3>
             <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">Earn by powering onchain markets with Liquidity Pools.</p>
              <a href="#about" className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors bg-emerald-500/10 dark:bg-black/20 px-5 py-2.5 rounded-full border border-emerald-500/20 dark:border-white/10 w-max">
               Explore pools <ArrowRight className="w-4 h-4" />
              </a>
           </div>
            <div className="absolute right-0 bottom-0 w-56 h-56 pointer-events-none translate-x-4 translate-y-4 group-hover:scale-105 transition-transform duration-700">
               <div className="absolute top-8 right-16 w-20 h-20 bg-[#76b900] rounded-full flex items-center justify-center shadow-xl shadow-[#76b900]/30 animate-float text-white"><SiNvidia className="w-10 h-10" aria-label="NVIDIA" /></div>
               <div className="absolute bottom-16 right-8 w-14 h-14 bg-[#202124] rounded-full flex items-center justify-center shadow-xl shadow-black/30 animate-float-reverse text-white"><SiApple className="w-7 h-7" aria-label="Apple" /></div>
               <div className="absolute bottom-6 right-28 w-16 h-16 bg-[#e82127] rounded-full flex items-center justify-center shadow-xl shadow-[#e82127]/30 animate-float text-white" style={{animationDelay: '1s'}}><SiTesla className="w-8 h-8" aria-label="Tesla" /></div>
           </div>
        </div>

        {/* Tile 5: API */}
         <div className="col-span-1 rounded-[1.75rem] p-8 md:p-9 flex flex-col justify-between bg-orange-50 dark:bg-[#402218] hover:bg-orange-100 dark:hover:bg-[#5a2d1d] border border-orange-200/80 dark:border-white/5 transition-colors overflow-hidden relative group min-h-[340px]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-4">
               <Code2 className="w-5 h-5" />
               <span className="font-semibold text-sm">Trading API</span>
             </div>
             <h3 className="text-3xl font-display font-medium text-foreground mb-3">DeFi for your users,<br/>at no cost.</h3>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">Use FondrFi as a clear starting point for teams exploring programmable, onchain market access.</p>
              <a href="#explore" className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-300 hover:text-orange-700 dark:hover:text-orange-200 transition-colors bg-orange-500/10 dark:bg-black/20 px-5 py-2.5 rounded-full border border-orange-500/20 dark:border-white/10 w-max">
                Explore FondrFi <ArrowRight className="w-4 h-4" />
              </a>
           </div>
           <div className="absolute -right-4 -bottom-4 w-64 h-64 pointer-events-none opacity-30 dark:opacity-20 group-hover:scale-105 transition-transform duration-700">
              <div className="w-full h-full flex flex-col gap-6 p-8 justify-end">
                <div className="w-3/4 h-6 bg-orange-500 rounded-full shadow-lg" />
                <div className="w-full h-6 bg-orange-500 rounded-full shadow-lg" />
                <div className="w-5/6 h-6 bg-orange-500 rounded-full shadow-lg" />
                <div className="w-1/2 h-6 bg-orange-500 rounded-full shadow-lg" />
              </div>
           </div>
        </div>

        {/* Tile 6: Chain */}
         <div className="col-span-1 rounded-[1.75rem] p-8 md:p-9 flex flex-col justify-between bg-pink-50 dark:bg-[#441b35] hover:bg-pink-100 dark:hover:bg-[#5d2448] border border-pink-200/80 dark:border-white/5 transition-colors overflow-hidden relative group min-h-[340px]">
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-4">
               <Network className="w-5 h-5" />
               <span className="font-semibold text-sm">Robinhood Chain</span>
             </div>
             <h3 className="text-3xl font-display font-medium text-foreground mb-3">The DeFi chain.</h3>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">A focused environment for the next generation of tokenized markets, designed around Robinhood Chain.</p>
              <a href="#about" className="flex items-center gap-2 text-sm font-medium text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 transition-colors bg-pink-500/10 dark:bg-black/20 px-5 py-2.5 rounded-full border border-pink-500/20 dark:border-white/10 w-max">
                Learn more <ArrowRight className="w-4 h-4" />
              </a>
           </div>
           <div className="absolute -right-8 -bottom-8 w-64 h-64 pointer-events-none group-hover:scale-105 transition-transform duration-700">
              <div className="w-full h-full bg-gradient-to-br from-pink-500 to-rose-600 rounded-[3rem] rotate-12 flex items-center justify-center shadow-2xl opacity-90">
                 <Globe className="w-32 h-32 text-white/40" />
              </div>
           </div>
        </div>

      </div>
    </section>
  )
}
