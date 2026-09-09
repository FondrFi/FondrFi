import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight, Check, CircleHelp, Loader2, RefreshCw, ShieldCheck, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { ROBINHOOD_CHAIN } from "@/lib/robinhood-chain"

interface ConnectWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function WalletMark({ name, icon }: { name: string; icon?: string }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (icon && !imageFailed) {
    return (
      <img
        src={icon}
        alt=""
        className="h-10 w-10 rounded-xl object-cover"
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Wallet className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{name}</span>
    </span>
  )
}

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const {
    connect,
    status,
    error,
    availableWallets,
    refreshWallets,
  } = useWallet()
  const [connectError, setConnectError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (open) {
      setConnectError(null)
      void refreshWallets()
    }
  }, [open, refreshWallets])

  const handleConnect = async (walletId: string) => {
    setConnectError(null)
    try {
      await connect(walletId)
      onOpenChange(false)
    } catch (connectionError) {
      setConnectError(connectionError instanceof Error ? connectionError.message : "Wallet connection was rejected.")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshWallets()
    } finally {
      setIsRefreshing(false)
    }
  }

  const displayError = connectError || error
  const isConnecting = status === "connecting"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[430px] gap-0 overflow-hidden border-border/70 bg-background p-0 shadow-2xl">
        <DialogHeader className="border-b border-border/60 px-6 pb-5 pt-6">
          <div className="mb-5 flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}fondrfi-logo.png`}
              alt="FondrFi"
              className="h-10 w-10 rounded-xl object-contain"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">FondrFi</p>
              <p className="text-sm font-medium text-foreground">Self-custody trading</p>
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold tracking-tight">Connect a wallet</DialogTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Choose a wallet to continue. FondrFi never takes custody of your assets.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold">{ROBINHOOD_CHAIN.name}</p>
                <p className="text-[11px] text-muted-foreground">Network ready</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Chain {ROBINHOOD_CHAIN.id}
            </span>
          </div>
        </DialogHeader>

        <div className="px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Available wallets</p>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing || isConnecting}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {availableWallets.length > 0 ? (
            <div className="space-y-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => void handleConnect(wallet.id)}
                  disabled={isConnecting}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-60"
                >
                  <WalletMark name={wallet.name} icon={wallet.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="truncate">{wallet.name}</span>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        Detected
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Connect this wallet to FondrFi
                    </span>
                  </span>
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-5 py-6 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold">No wallet detected</p>
              <p className="mx-auto mt-1 max-w-[270px] text-xs leading-relaxed text-muted-foreground">
                Install MetaMask, Robinhood Wallet, Rabby, or another EVM wallet, then refresh this list.
              </p>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh wallets
              </button>
            </div>
          )}

          {displayError && (
            <p role="alert" className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm leading-relaxed text-destructive">
              {displayError}
            </p>
          )}

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>You stay in control. FondrFi only requests your public address and transactions you approve.</span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <CircleHelp className="h-3.5 w-3.5" />
            <span>Only connect wallets you trust.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}