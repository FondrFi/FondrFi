import { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { Search, Menu, Wallet, ChevronDown, Check, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectWalletDialog } from "../wallet/ConnectWalletDialog"
import { useTheme } from "next-themes"
import { shortenAddress } from "@/lib/robinhood-chain"
import { useWallet } from "@/contexts/wallet-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_LINKS = [
  { name: "Trade", path: "/" },
  { name: "Explore", path: "/explore" },
  { name: "Earn", path: "/earn" },
  { name: "Portfolio", path: "/portfolio" },
  { name: "Docs", path: "/docs" },
  { name: "Whitepaper", path: "/whitepaper" },
]

const BRAND_LOGO = `${import.meta.env.BASE_URL}fondrfi-logo.png`

export function Navbar() {
  const [location] = useLocation()
  const [walletOpen, setWalletOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { address, isOnRobinhoodChain, switchToRobinhoodChain, disconnect } = useWallet()
  const handleChangeWallet = async () => {
    await disconnect()
    setWalletOpen(true)
  }

  useEffect(() => setMounted(true), [])

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src={BRAND_LOGO}
                alt="FondrFi"
                className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-xl hidden sm:inline-block tracking-tight text-foreground">
                FondrFi
              </span>
            </Link>
            <div className="hidden md:flex gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground ${
                    location === link.path ? "text-foreground bg-secondary/50" : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex-1 flex justify-center px-4 max-w-md mx-auto hidden lg:flex">
            <div className="relative w-full max-w-[320px] group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search tokens, pools..."
                className="w-full h-9 pl-9 pr-4 rounded-full bg-secondary/50 border border-transparent focus:outline-none focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm"
              />
              <div className="absolute right-2 top-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-background border border-border/50 text-muted-foreground pointer-events-none">
                /
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full hidden sm:flex"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {address ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className={`hidden sm:flex rounded-full h-9 gap-2 border-border/50 px-3 ${!isOnRobinhoodChain ? "border-amber-500/40 text-amber-600 dark:text-amber-300" : ""}`}>
                      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-white">R</div>
                      <span className="text-sm font-medium">{isOnRobinhoodChain ? "Robinhood" : "Wrong network"}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-2">
                    <DropdownMenuItem className="rounded-lg p-2 cursor-pointer" onClick={() => void switchToRobinhoodChain()}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">R</div>
                          <span>Robinhood Chain</span>
                        </div>
                        {isOnRobinhoodChain && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full h-9 gap-2 border-border/50 px-3 bg-secondary/50">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-blue-500" />
                      <span className="text-sm font-medium hidden sm:inline-block">{shortenAddress(address)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-2">
                     <DropdownMenuItem className="rounded-lg p-2 cursor-pointer" onClick={() => void handleChangeWallet()}>
                       Change wallet
                     </DropdownMenuItem>
                     <DropdownMenuItem className="rounded-lg p-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => void disconnect()}>
                      Disconnect wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button 
                variant="default" 
                className="rounded-full h-9 px-4 sm:px-5 font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                onClick={() => setWalletOpen(true)}
              >
                Connect
              </Button>
            )}

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full ml-1">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] rounded-xl p-2 mt-2">
                {NAV_LINKS.map(link => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link href={link.path} className="w-full rounded-lg p-2.5 cursor-pointer font-medium">
                      {link.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {mounted && (
                  <DropdownMenuItem 
                    className="w-full rounded-lg p-2.5 cursor-pointer font-medium mt-1 border-t border-border"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <ConnectWalletDialog 
        open={walletOpen}
        onOpenChange={setWalletOpen}
      />
    </>
  )
}
