import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "wouter"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Check,
  CircleHelp,
  Coins,
  ExternalLink,
  Info,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConnectWalletDialog } from "@/components/wallet/ConnectWalletDialog"
import { useWallet } from "@/contexts/wallet-context"
import {
  formatTokenAmount,
  parseTokenAmount,
  ROBINHOOD_CHAIN,
  type MainnetToken,
} from "@/lib/robinhood-chain"
import {
  decodeUint256,
  encodeAddress,
  encodeCall,
  encodeUint256,
  FONDRFI_STAKING_CONFIG,
  isContractAddress,
  isStakingConfigured,
} from "@/lib/staking-config"

const BALANCE_OF_SELECTOR = "0x70a08231"
const MAX_DISPLAY_DECIMALS = 4

type Position = {
  walletBalance: bigint | null
  stakedBalance: bigint | null
  pendingRewards: bigint | null
  allowance: bigint | null
}

type TransactionState =
  | { phase: "idle" }
  | { phase: "approving" | "staking" | "unstaking" | "claiming"; hash?: string }
  | { phase: "pending"; hash: string; kind: "approval" | "stake" | "unstake" | "claim"; message: string }
  | { phase: "confirmed"; hash: string }
  | { phase: "failed"; hash?: string; message: string }

const EMPTY_POSITION: Position = {
  walletBalance: null,
  stakedBalance: null,
  pendingRewards: null,
  allowance: null,
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again."
}

function isPendingMessage(message: string) {
  return /still pending|pending/i.test(message)
}

function formatAmount(value: bigint | null, suffix = "") {
  if (value == null) return "Unavailable"
  return `${formatTokenAmount(value, FONDRFI_STAKING_CONFIG.token.decimals, MAX_DISPLAY_DECIMALS)}${suffix ? ` ${suffix}` : ""}`
}

function formatTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())
}

function createToken(): MainnetToken | null {
  const address = FONDRFI_STAKING_CONFIG.token.address
  if (!isContractAddress(address)) return null
  return {
    id: "fondrfi",
    address,
    symbol: FONDRFI_STAKING_CONFIG.token.symbol,
    name: FONDRFI_STAKING_CONFIG.token.name,
    decimals: FONDRFI_STAKING_CONFIG.token.decimals,
    category: "crypto",
    logoUrl: null,
  }
}

function TokenMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-[#07110d] shadow-lg shadow-primary/20 ${small ? "h-9 w-9" : "h-14 w-14"}`}
    >
      <img
        src={`${import.meta.env.BASE_URL}fondrfi-logo.png`}
        alt="FondrFi logo"
        className={`${small ? "h-6 w-6" : "h-9 w-9"} object-contain`}
      />
    </span>
  )
}

function DataValue({ value, note }: { value: string; note?: string }) {
  return (
    <div>
      <p className={`font-display text-2xl font-semibold tracking-tight ${value === "Unavailable" ? "text-muted-foreground" : ""}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

export function Earn() {
  const [walletOpen, setWalletOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [position, setPosition] = useState<Position>(EMPTY_POSITION)
  const [isReading, setIsReading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [readError, setReadError] = useState<string | null>(null)
  const [isCheckingPending, setIsCheckingPending] = useState(false)
  const [transaction, setTransaction] = useState<TransactionState>({ phase: "idle" })
  const loadRequestId = useRef(0)
  const executionLock = useRef(false)
  const reconciliationLock = useRef(false)

  const {
    address,
    status,
    isOnRobinhoodChain,
    getAllowance,
    readContract,
    approve,
    sendTransaction,
    getTransactionReceipt,
    waitForReceipt,
    switchToRobinhoodChain,
  } = useWallet()

  const config = FONDRFI_STAKING_CONFIG
  const token = useMemo(() => createToken(), [])
  const configured = isStakingConfigured(config)
  const tokenAddress = config.token.address
  const stakingAddress = config.staking.address
  const selectors = config.selectors
  const isBusy = transaction.phase !== "idle" && transaction.phase !== "confirmed" && transaction.phase !== "failed"

  useEffect(() => {
    document.title = "Earn · FondrFi"
    const description = "Stake FONDRFI on Robinhood Chain when the official FondrFi staking contract launches."
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "description"
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [])

  const loadPosition = useCallback(async () => {
    const requestId = ++loadRequestId.current
    if (!configured || !token || !isContractAddress(stakingAddress) || !isContractAddress(tokenAddress) || !address || !isOnRobinhoodChain) {
      setPosition(EMPTY_POSITION)
      setReadError(null)
      setLastUpdated(null)
      setIsReading(false)
      return
    }

    setIsReading(true)
    setReadError(null)
    try {
      const [rawWalletBalance, allowance, rawStakedBalance, rawPendingRewards] = await Promise.all([
        readContract(tokenAddress, encodeCall(BALANCE_OF_SELECTOR, encodeAddress(address))),
        getAllowance(token, stakingAddress),
        selectors.stakedBalance
          ? readContract(stakingAddress, encodeCall(selectors.stakedBalance, encodeAddress(address)))
          : Promise.reject(new Error("Staked balance selector is not configured.")),
        selectors.pendingRewards
          ? readContract(stakingAddress, encodeCall(selectors.pendingRewards, encodeAddress(address)))
          : Promise.reject(new Error("Pending rewards selector is not configured.")),
      ])

      if (loadRequestId.current !== requestId) return
      setPosition({
        walletBalance: decodeUint256(rawWalletBalance),
        allowance,
        stakedBalance: decodeUint256(rawStakedBalance),
        pendingRewards: decodeUint256(rawPendingRewards),
      })
      setLastUpdated(formatTime())
    } catch (error) {
      if (loadRequestId.current !== requestId) return
      setPosition(EMPTY_POSITION)
      setReadError(getErrorMessage(error))
    } finally {
      if (loadRequestId.current === requestId) setIsReading(false)
    }
  }, [address, configured, getAllowance, isOnRobinhoodChain, readContract, selectors.pendingRewards, selectors.stakedBalance, stakingAddress, token, tokenAddress])

  useEffect(() => {
    void loadPosition()
    return () => {
      loadRequestId.current += 1
    }
  }, [loadPosition])

  const amountValue = useMemo(() => {
    if (!amount.trim() || !token) return null
    try {
      return parseTokenAmount(amount, token.decimals)
    } catch {
      return null
    }
  }, [amount, token])

  const amountError = amount.trim() && amountValue == null ? "Enter a valid amount with up to 18 decimals." : null
  const walletBalance = position.walletBalance
  const stakedBalance = position.stakedBalance
  const canStakeAmount = amountValue != null && walletBalance != null && amountValue > 0n && amountValue <= walletBalance
  const canUnstakeAmount = amountValue != null && stakedBalance != null && amountValue > 0n && amountValue <= stakedBalance
  const hasRewards = position.pendingRewards != null && position.pendingRewards > 0n

  const runTransaction = async (action: "stake" | "unstake" | "claim") => {
    if (executionLock.current) return
    if (!configured || !token || !isContractAddress(stakingAddress) || !address || !isOnRobinhoodChain) return
    if (action !== "claim" && (!amountValue || amountValue <= 0n)) {
      setTransaction({ phase: "failed", message: "Enter an amount before continuing." })
      return
    }
    if (action === "stake" && !canStakeAmount) {
      setTransaction({ phase: "failed", message: walletBalance == null ? "Your token balance is unavailable." : "The amount is greater than your available FONDRFI balance." })
      return
    }
    if (action === "unstake" && !canUnstakeAmount) {
      setTransaction({ phase: "failed", message: stakedBalance == null ? "Your staked balance is unavailable." : "The amount is greater than your staked FONDRFI balance." })
      return
    }

    const selector = action === "stake" ? selectors.stake : action === "unstake" ? selectors.unstake : selectors.claim
    if (!selector) {
      setTransaction({ phase: "failed", message: `The ${action} method is not configured yet.` })
      return
    }

    executionLock.current = true
    let submittedHash: string | undefined
    let submittedKind: "approval" | "stake" | "unstake" | "claim" = action
    try {
      if (action === "stake") {
        const currentAllowance = await getAllowance(token, stakingAddress)
        if (currentAllowance < (amountValue ?? 0n)) {
          setTransaction({ phase: "approving" })
          submittedHash = await approve(token, stakingAddress, amountValue ?? 0n)
          submittedKind = "approval"
          setTransaction({ phase: "approving", hash: submittedHash })
          const approvalReceipt = await waitForReceipt(submittedHash)
          if (approvalReceipt.status !== "success") throw new Error("FONDRFI approval reverted on Robinhood Chain.")
        }
      }

      const phase = action === "stake" ? "staking" : action === "unstake" ? "unstaking" : "claiming"
      setTransaction({ phase })
      const data = action === "claim"
        ? encodeCall(selector)
        : encodeCall(selector, encodeUint256(amountValue ?? 0n))
      submittedHash = await sendTransaction({
        to: stakingAddress,
        data,
        value: "0",
      })
      submittedKind = action
      setTransaction({ phase, hash: submittedHash })
      const receipt = await waitForReceipt(submittedHash)
      if (receipt.status !== "success") {
        throw new Error(`${action === "stake" ? "Stake" : action === "unstake" ? "Unstake" : "Claim"} reverted on Robinhood Chain.`)
      }
      setTransaction({ phase: "confirmed", hash: submittedHash })
      setAmount("")
      await loadPosition()
    } catch (error) {
      const message = getErrorMessage(error)
      if (submittedHash && isPendingMessage(message)) {
        setTransaction({ phase: "pending", hash: submittedHash, kind: submittedKind, message: "Transaction is still pending. FondrFi will keep checking it before enabling another action." })
      } else {
        setTransaction({ phase: "failed", hash: submittedHash, message })
      }
    } finally {
      executionLock.current = false
    }
  }

  const reconcilePendingTransaction = useCallback(async () => {
    if (transaction.phase !== "pending" || reconciliationLock.current) return
    reconciliationLock.current = true
    setIsCheckingPending(true)
    try {
      const receipt = await getTransactionReceipt(transaction.hash)
      if (receipt.status === "pending") return
      if (receipt.status === "reverted") {
        setTransaction({
          phase: "failed",
          hash: transaction.hash,
          message: `${transaction.kind === "approval" ? "Approval" : transaction.kind === "stake" ? "Stake" : transaction.kind === "unstake" ? "Unstake" : "Claim"} reverted on Robinhood Chain.`,
        })
        return
      }

      setTransaction({ phase: "confirmed", hash: transaction.hash })
      if (transaction.kind !== "approval") setAmount("")
      await loadPosition()
    } catch (error) {
      setTransaction((current) => current.phase === "pending"
        ? { ...current, message: `Status check failed: ${getErrorMessage(error)} FondrFi will try again.` }
        : current)
    } finally {
      reconciliationLock.current = false
      setIsCheckingPending(false)
    }
  }, [getTransactionReceipt, loadPosition, transaction])

  useEffect(() => {
    if (transaction.phase !== "pending") return
    void reconcilePendingTransaction()
    const interval = window.setInterval(() => void reconcilePendingTransaction(), 5_000)
    return () => window.clearInterval(interval)
  }, [reconcilePendingTransaction, transaction.phase])

  const transactionHash = "hash" in transaction ? transaction.hash : undefined
  const transactionHref = transactionHash ? `${ROBINHOOD_CHAIN.explorerUrl}/tx/${transactionHash}` : null
  const isPending = transaction.phase === "pending"
  const isSuccess = transaction.phase === "confirmed"
  const actionDisabled = !configured || !address || !isOnRobinhoodChain || isBusy || isPending
  const stakedShare = stakedBalance != null && walletBalance != null && stakedBalance + walletBalance > 0n
    ? Number((stakedBalance * 10_000n) / (stakedBalance + walletBalance)) / 100
    : null

  const primaryAction = !configured
    ? "Staking opens after launch"
    : !address
      ? "Connect wallet to stake"
      : !isOnRobinhoodChain
        ? "Switch to Robinhood Chain"
        : isPending
          ? "Transaction pending"
          : isBusy
            ? transaction.phase === "approving" ? "Approving exact amount..." : "Confirming transaction..."
            : amountError
              ? "Enter a valid amount"
              : !canStakeAmount
                ? "Enter amount to stake"
                : position.allowance != null && amountValue != null && position.allowance < amountValue
                  ? "Approve exact amount"
                  : "Stake FONDRFI"

  return (
    <>
      <main className="relative flex-1 overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute right-0 top-16 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[140px]" />
          <div className="absolute left-1/2 top-[34rem] h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-400/5 blur-[100px]" />
        </div>

        <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-16">
          <div className="mb-9 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-primary">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Earn
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-primary" : "bg-amber-400"}`} />
                  {configured ? "Live · Robinhood Chain" : "Launch-ready · Robinhood Chain"}
                </span>
              </div>
              <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
                Put your FONDRFI to work.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                A transparent home for the FondrFi community to stake, earn, and keep control of every transaction.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 backdrop-blur-xl">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Non-custodial
              </span>
              {address && (
                <button
                  type="button"
                  onClick={() => void loadPosition()}
                  disabled={isReading || !configured}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                  aria-label="Refresh staking position"
                >
                  {isReading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {lastUpdated ? `Updated ${lastUpdated}` : "Refresh"}
                </button>
              )}
            </div>
          </div>

          <div className={`mb-6 overflow-hidden rounded-[2rem] border p-6 shadow-xl md:p-8 ${configured ? "border-primary/25 bg-gradient-to-r from-primary/10 via-background/80 to-cyan-400/5 shadow-primary/5" : "border-amber-400/25 bg-gradient-to-r from-amber-400/10 via-background/80 to-primary/5 shadow-amber-500/5"}`}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${configured ? "border-primary/20 bg-primary/10 text-primary" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
                  {configured ? <ShieldCheck className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold">{configured ? "Official staking pool is live" : "Staking pool is being prepared"}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${configured ? "border-primary/25 bg-primary/10 text-primary" : "border-amber-400/25 bg-amber-400/10 text-amber-300"}`}>
                      {configured ? "Live" : "Pre-launch"}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {configured
                      ? "Verified contract configuration is active. Position data comes directly from Robinhood Chain, and every transaction is confirmed in your wallet."
                      : "The official FONDRFI token and staking contract are not deployed yet. This page is ready for launch, but no wallet transaction will be sent until verified contract details are configured."}
                  </p>
                </div>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
                  <span className="block text-muted-foreground">Live APY</span>
                  <strong className="mt-1 block font-medium">Unavailable</strong>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
                  <span className="block text-muted-foreground">Pool TVL</span>
                  <strong className="mt-1 block font-medium">Unavailable</strong>
                </div>
              </div>
            </div>
          </div>

          {readError && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Staking position could not be read</p>
                <p className="mt-1 text-destructive/80">{readError}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 rounded-full border-destructive/20" onClick={() => void loadPosition()}>
                Try again
              </Button>
            </div>
          )}

          {isSuccess && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20"><Check className="h-4 w-4" /></div>
              <p className="flex-1">Transaction confirmed on Robinhood Chain.</p>
              {transactionHref && <a href={transactionHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium hover:underline">View transaction <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>
          )}

          {transaction.phase === "failed" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Transaction not completed</p>
                <p className="mt-1 text-destructive/80">{transaction.message}</p>
              </div>
              {transactionHref && <a href={transactionHref} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-medium hover:underline">Blockscout <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>
          )}

          {isPending && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              <div className="flex-1">
                <p className="font-medium">Transaction is still pending</p>
                <p className="mt-1 text-blue-700/80 dark:text-blue-200/80">{transaction.message}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => void reconcilePendingTransaction()} disabled={isCheckingPending} className="inline-flex items-center gap-1 font-medium hover:underline disabled:opacity-60">
                  {isCheckingPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Check status
                </button>
                {transactionHref && <a href={transactionHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium hover:underline">Track <ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-background/75 shadow-2xl shadow-primary/5 backdrop-blur-2xl">
              <div className="border-b border-border/70 px-6 py-6 md:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Stake pool</p>
                    <div className="mt-4 flex items-center gap-3">
                      <TokenMark />
                      <div>
                        <h2 className="font-display text-2xl font-semibold">FONDRFI</h2>
                        <p className="mt-1 text-sm text-muted-foreground">FondrFi community staking</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-right">
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-primary/80">Network</span>
                    <strong className="mt-1 block text-xs font-semibold text-primary">Robinhood</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="stake-amount" className="text-sm font-medium">Amount</label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
                      disabled={!configured || walletBalance == null || isBusy || isPending}
                      onClick={() => walletBalance != null && setAmount(formatTokenAmount(walletBalance, config.token.decimals, MAX_DISPLAY_DECIMALS))}
                    >
                      Use max
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      id="stake-amount"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                      disabled={!configured || isBusy || isPending}
                      aria-describedby="stake-amount-help"
                      className="min-w-0 flex-1 bg-transparent font-display text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background/70 py-1.5 pl-1.5 pr-3">
                      <TokenMark small />
                      <span className="text-sm font-semibold">{config.token.symbol}</span>
                    </div>
                  </div>
                  <div id="stake-amount-help" className="mt-3 flex min-h-5 items-center justify-between gap-3 text-xs">
                    <span className={amountError ? "text-destructive" : "text-muted-foreground"}>{amountError ?? (configured ? "Enter the amount to stake or unstake." : "Amount entry unlocks after launch.")}</span>
                    {walletBalance != null && <span className="shrink-0 text-muted-foreground">Balance {formatAmount(walletBalance)}</span>}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    size="lg"
                    className="h-12 rounded-xl font-semibold shadow-lg shadow-primary/10"
                    disabled={actionDisabled || !canStakeAmount}
                    onClick={() => void runTransaction("stake")}
                  >
                    <ArrowUpFromLine />
                    {primaryAction}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl font-semibold"
                    disabled={actionDisabled || !canUnstakeAmount}
                    onClick={() => void runTransaction("unstake")}
                  >
                    <ArrowDownToLine />
                    Unstake amount
                  </Button>
                </div>

                {!address ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Connect a wallet when you are ready</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Your wallet stays in your control. FondrFi never takes custody of your tokens.</p>
                    </div>
                    <Button size="sm" variant="secondary" className="rounded-full" onClick={() => setWalletOpen(true)}>Connect</Button>
                  </div>
                ) : !isOnRobinhoodChain ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Switch networks before interacting</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Staking is only available on Robinhood Chain mainnet.</p>
                    </div>
                    <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void switchToRobinhoodChain()}>Switch</Button>
                  </div>
                ) : (
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Approvals are exact-amount only. You will review each wallet confirmation before tokens move.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border/70 bg-background/75 p-6 shadow-2xl shadow-primary/5 backdrop-blur-2xl md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your position</p>
                    <h2 className="mt-2 font-display text-2xl font-semibold">Track your share</h2>
                  </div>
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Wallet balance</p>
                    <DataValue value={formatAmount(walletBalance, config.token.symbol)} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Currently staked</p>
                    <DataValue value={formatAmount(stakedBalance, config.token.symbol)} note={stakedShare != null ? `${stakedShare.toFixed(2)}% of your tracked position` : undefined} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Pending rewards</p>
                    <DataValue value={formatAmount(position.pendingRewards, config.token.symbol)} />
                  </div>
                </div>
                <div className="mt-7 border-t border-border/70 pt-6">
                  <Button
                    className="w-full rounded-xl"
                    variant={hasRewards ? "default" : "outline"}
                    disabled={actionDisabled || !hasRewards}
                    onClick={() => void runTransaction("claim")}
                  >
                    {transaction.phase === "claiming" ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {hasRewards ? "Claim rewards" : "No rewards to claim"}
                  </Button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/70 bg-secondary/20 p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><CircleHelp className="h-4 w-4" /></div>
                  <h2 className="font-display text-xl font-semibold">How Earn works</h2>
                </div>
                <div className="mt-6 space-y-5">
                  {[
                    ["01", "Connect", "Use your own wallet on Robinhood Chain."],
                    ["02", "Stake", "Approve only the exact FONDRFI amount you choose."],
                    ["03", "Earn", "Track and claim rewards directly from the pool."],
                  ].map(([number, title, copy]) => (
                    <div key={number} className="flex gap-3">
                      <span className="font-mono text-xs font-semibold text-primary">{number}</span>
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-4 text-xs leading-relaxed text-muted-foreground backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-5">
            <span className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Read-only values come from your wallet and the configured staking contract. No custody, no hidden approvals, no invented performance data.
            </span>
            {configured && stakingAddress && (
              <a href={`${ROBINHOOD_CHAIN.explorerUrl}/address/${stakingAddress}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground hover:text-primary hover:underline">
                View staking contract <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {!configured && (
              <Link href="/explore" className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground hover:text-primary hover:underline">
                Explore live markets <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </section>
      </main>

      <ConnectWalletDialog open={walletOpen} onOpenChange={setWalletOpen} />
      <span className="sr-only">Wallet status: {status}</span>
    </>
  )
}