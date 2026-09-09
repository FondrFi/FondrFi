import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, CheckCircle2, ExternalLink, Info, Loader2, Settings2, TriangleAlert } from "lucide-react"
import { getSwapQuote, useGetSwapAssets, type SwapQuote } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { TokenSelectDialog, type Token } from "./TokenSelectDialog"
import { TokenAvatar } from "./TokenAvatar"
import { ConnectWalletDialog } from "../wallet/ConnectWalletDialog"
import { useWallet } from "@/contexts/wallet-context"
import { MAINNET_TOKENS, ROBINHOOD_CHAIN, formatTokenAmount, parseTokenAmount } from "@/lib/robinhood-chain"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TransactionState =
  | { phase: "idle" }
  | { phase: "approving"; hash?: string }
  | { phase: "requote" }
  | { phase: "swapping"; hash?: string }
  | { phase: "pending"; hash: string; message: string }
  | { phase: "confirmed"; hash: string }
  | { phase: "failed"; message: string; hash?: string }

type QuoteRequest = {
  sellToken: Token
  buyToken: Token
  sellAmount: string
  taker: string
  slippageBps: number
}

function quoteFingerprint({ sellToken, buyToken, sellAmount, taker, slippageBps }: QuoteRequest) {
  return [
    sellToken.address.toLowerCase(),
    buyToken.address.toLowerCase(),
    sellAmount,
    taker.toLowerCase(),
    slippageBps,
  ].join(":")
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Something went wrong. Please try again."
}

function isPendingReceiptError(message: string) {
  return message.includes("still pending")
}

export function SwapCard() {
  const [sellToken, setSellToken] = useState<Token>(MAINNET_TOKENS[0])
  const [buyToken, setBuyToken] = useState<Token>(MAINNET_TOKENS.find((token) => token.symbol === "USDG") ?? MAINNET_TOKENS[1])
  const [sellAmount, setSellAmount] = useState("")
  const [selectingFor, setSelectingFor] = useState<"sell" | "buy" | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)
  const [slippageBps, setSlippageBps] = useState(50)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)
  const [transactionState, setTransactionState] = useState<TransactionState>({ phase: "idle" })
  const [notice, setNotice] = useState<string | null>(null)
  const [isExecutionLocked, setIsExecutionLocked] = useState(false)
  const executionLock = useRef(false)
  const quoteRequestId = useRef(0)
  const activeQuoteFingerprint = useRef<string | null>(null)

  const {
    address,
    isOnRobinhoodChain,
    status,
    getBalance,
    getAllowance,
    approve,
    sendTransaction,
    switchToRobinhoodChain,
    waitForReceipt,
  } = useWallet()

  const assetCatalog = useGetSwapAssets()
  const tokens = assetCatalog.data?.assets ?? MAINNET_TOKENS
  const catalogError = assetCatalog.isError
    ? "The full asset registry is unavailable right now. You can still use the verified core assets."
    : null

  const refreshBalances = useCallback(async () => {
    if (!address || !isOnRobinhoodChain) {
      setBalances({})
      setBalanceError(null)
      return
    }

    setIsBalanceLoading(true)
    setBalanceError(null)
    const selectedTokens = [...new Map([sellToken, buyToken].map((token) => [token.id, token])).values()]
    const results = await Promise.allSettled(selectedTokens.map(async (token) => [token.id, await getBalance(token)] as const))
    const nextBalances: Record<string, string> = {}
    let hasFailure = false
    for (const result of results) {
      if (result.status === "fulfilled") {
        nextBalances[result.value[0]] = result.value[1]
      } else {
        hasFailure = true
      }
    }
    setBalances(nextBalances)
    if (hasFailure) setBalanceError("Unable to refresh one or more balances. Check your wallet connection and try again.")
    setIsBalanceLoading(false)
  }, [address, buyToken, getBalance, isOnRobinhoodChain, sellToken])

  const invalidateQuote = useCallback(() => {
    quoteRequestId.current += 1
    activeQuoteFingerprint.current = null
    setQuote(null)
    setQuoteError(null)
    setIsQuoteLoading(false)
  }, [])

  const fetchQuoteFor = useCallback(async (request: QuoteRequest, requestId: number) => {
    const { sellToken: nextSellToken, buyToken: nextBuyToken, sellAmount: nextSellAmount, taker, slippageBps: nextSlippageBps } = request
    const baseAmount = parseTokenAmount(nextSellAmount, nextSellToken.decimals)
    if (baseAmount <= 0n) throw new Error("Enter an amount greater than zero.")

    setIsQuoteLoading(true)
    setQuoteError(null)
    try {
      const nextQuote = await getSwapQuote({
        sellToken: nextSellToken.address,
        buyToken: nextBuyToken.address,
        sellAmount: baseAmount.toString(),
        taker,
        slippageBps: nextSlippageBps,
      })
      if (quoteRequestId.current !== requestId) return null
      setQuote(nextQuote)
      activeQuoteFingerprint.current = quoteFingerprint(request)
      return nextQuote
    } catch (error) {
      if (quoteRequestId.current === requestId) {
        setQuote(null)
        activeQuoteFingerprint.current = null
        setQuoteError(getErrorMessage(error))
      }
      throw error
    } finally {
      if (quoteRequestId.current === requestId) setIsQuoteLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshBalances()
  }, [refreshBalances])

  useEffect(() => {
    const requestId = ++quoteRequestId.current
    activeQuoteFingerprint.current = null
    if (executionLock.current) return
    setQuote(null)
    setQuoteError(null)
    setNotice(null)
    setTransactionState({ phase: "idle" })

    if (!address || !isOnRobinhoodChain || !sellAmount || sellToken.address === buyToken.address) {
      return
    }

    let active = true
    const timeout = window.setTimeout(() => {
      void fetchQuoteFor({ sellToken, buyToken, sellAmount, taker: address, slippageBps }, requestId)
        .catch(() => undefined)
        .finally(() => {
          if (!active) return
        })
    }, 550)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [address, buyToken, fetchQuoteFor, isOnRobinhoodChain, sellAmount, sellToken, slippageBps])

  const buyAmount = useMemo(
    () => quote ? formatTokenAmount(BigInt(quote.buyAmount), buyToken.decimals) : "",
    [buyToken.decimals, quote],
  )
  const minReceived = useMemo(
    () => quote ? formatTokenAmount(BigInt(quote.minBuyAmount), buyToken.decimals) : "",
    [buyToken.decimals, quote],
  )
  const estimatedGas = useMemo(() => {
    if (!quote?.transaction.gas || !quote.transaction.gasPrice) return null
    return formatTokenAmount(BigInt(quote.transaction.gas) * BigInt(quote.transaction.gasPrice), 18, 8)
  }, [quote])

  const handleSellChange = (value: string) => {
    if (!isExecutionLocked && (value === "" || /^\d*\.?\d*$/.test(value))) {
      invalidateQuote()
      setSellAmount(value)
    }
  }

  const handleSwapTokens = () => {
    if (isExecutionLocked) return
    invalidateQuote()
    setSellToken(buyToken)
    setBuyToken(sellToken)
    setSellAmount("")
  }

  const handleSelectToken = (token: Token) => {
    if (isExecutionLocked) return
    invalidateQuote()
    if (selectingFor === "sell") setSellToken(token)
    if (selectingFor === "buy") setBuyToken(token)
    setSellAmount("")
    setSelectingFor(null)
  }

  const handleMax = () => {
    if (isExecutionLocked) return
    const balance = balances[sellToken.id]
    if (balance) {
      invalidateQuote()
      setSellAmount(balance)
    }
  }

  const handleExecuteSwap = async () => {
    if (!address) {
      setWalletOpen(true)
      return
    }
    if (!isOnRobinhoodChain) {
      try {
        await switchToRobinhoodChain()
      } catch (error) {
        setTransactionState({ phase: "failed", message: getErrorMessage(error) })
      }
      return
    }
    const currentFingerprint = quoteFingerprint({ sellToken, buyToken, sellAmount, taker: address, slippageBps })
    if (!quote || !quote.liquidityAvailable || activeQuoteFingerprint.current !== currentFingerprint || executionLock.current) return

    const quoteSnapshot = quote
    const sellTokenSnapshot = sellToken
    const buyTokenSnapshot = buyToken
    const amountSnapshot = sellAmount
    const slippageSnapshot = slippageBps
    let submittedHash: string | undefined
    let keepLocked = false

    executionLock.current = true
    setIsExecutionLocked(true)
    setNotice(null)
    try {
      if (!sellTokenSnapshot.isNative) {
        const spender = quoteSnapshot.allowanceTarget
        if (!spender) {
          throw new Error("This route did not include a verified allowance target.")
        }
        const allowance = await getAllowance(sellTokenSnapshot, spender)
        if (allowance < BigInt(quoteSnapshot.sellAmount)) {
          setTransactionState({ phase: "approving" })
          submittedHash = await approve(sellTokenSnapshot, spender, BigInt(quoteSnapshot.sellAmount))
          setTransactionState({ phase: "approving", hash: submittedHash })
          const approvalReceipt = await waitForReceipt(submittedHash)
          if (approvalReceipt.status !== "success") {
            throw new Error("Token approval reverted on Robinhood Chain.")
          }

          let confirmedAllowance = 0n
          for (let attempt = 0; attempt < 12; attempt += 1) {
            confirmedAllowance = await getAllowance(sellTokenSnapshot, spender)
            if (confirmedAllowance >= BigInt(quoteSnapshot.sellAmount)) break
            await new Promise((resolve) => window.setTimeout(resolve, 1_000))
          }
          if (confirmedAllowance < BigInt(quoteSnapshot.sellAmount)) {
            throw new Error("Approval was confirmed, but the updated allowance is not visible yet. Wait a few seconds and try again.")
          }

          setTransactionState({ phase: "requote" })
          const refreshRequestId = ++quoteRequestId.current
          activeQuoteFingerprint.current = null
          setQuote(null)
          const refreshedQuote = await fetchQuoteFor({
            sellToken: sellTokenSnapshot,
            buyToken: buyTokenSnapshot,
            sellAmount: amountSnapshot,
            taker: address,
            slippageBps: slippageSnapshot,
          }, refreshRequestId)
          if (!refreshedQuote) throw new Error("Your quote changed while it was refreshing. Review the new quote and try again.")
          setTransactionState({ phase: "idle" })
          setNotice(`Approval confirmed. The quote was refreshed—review it and click Swap again to submit the trade.`)
          await refreshBalances()
          return
        }
      }

      setTransactionState({ phase: "swapping" })
      submittedHash = await sendTransaction(quoteSnapshot.transaction)
      setTransactionState({ phase: "swapping", hash: submittedHash })
      const receipt = await waitForReceipt(submittedHash)
      if (receipt.status !== "success") {
        throw new Error("Swap reverted on Robinhood Chain.")
      }
      setTransactionState({ phase: "confirmed", hash: submittedHash })
      setNotice("Swap confirmed on Robinhood Chain.")
      setSellAmount("")
      setQuote(null)
      await refreshBalances()
    } catch (error) {
      const message = getErrorMessage(error)
      if (submittedHash && isPendingReceiptError(message)) {
        keepLocked = true
        setTransactionState({ phase: "pending", hash: submittedHash, message: "Transaction is still pending. Track it in Blockscout before taking another action." })
      } else {
        setTransactionState({ phase: "failed", message, hash: submittedHash })
      }
    } finally {
      if (!keepLocked) {
        executionLock.current = false
        setIsExecutionLocked(false)
      }
    }
  }

  const transactionHref = transactionState.phase !== "idle" && "hash" in transactionState && transactionState.hash
    ? `${ROBINHOOD_CHAIN.explorerUrl}/tx/${transactionState.hash}`
    : null

  const actionLabel = (() => {
    if (!address) return "Connect wallet"
    if (!isOnRobinhoodChain) return "Switch to Robinhood Chain"
    if (transactionState.phase === "pending") return "Transaction pending"
    if (transactionState.phase === "approving") return `Approving ${sellToken.symbol}...`
    if (transactionState.phase === "requote") return "Refreshing quote..."
    if (transactionState.phase === "swapping") return "Confirming swap..."
    if (transactionState.phase === "confirmed") return "Swap confirmed"
    if (!sellAmount) return "Enter an amount"
    if (isQuoteLoading) return "Finding best route..."
    if (quoteError) return "Quote unavailable"
    if (!quote) return "Waiting for quote"
    if (!quote.liquidityAvailable) return "No liquidity available"
    return `Swap ${sellToken.symbol} for ${buyToken.symbol}`
  })()

  const actionDisabled = Boolean(
    address && isOnRobinhoodChain && (
      isExecutionLocked ||
      !sellAmount ||
      isQuoteLoading ||
      !quote ||
      !quote.liquidityAvailable ||
      transactionState.phase === "confirmed"
    ),
  )

  return (
    <>
      <div className="w-full max-w-[480px] mx-auto p-4 sm:p-6 bg-background/60 backdrop-blur-3xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl shadow-primary/5 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <button className="text-foreground font-medium border-b-2 border-foreground pb-1">Swap</button>
            <span className="text-muted-foreground font-medium pb-1 cursor-not-allowed" title="Coming soon">Limit</span>
            <span className="text-muted-foreground font-medium pb-1 cursor-not-allowed" title="Coming soon">Send</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isExecutionLocked} className="h-8 w-8 rounded-full hover:bg-secondary">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px] rounded-xl p-2 bg-background/95 backdrop-blur-xl">
              <DropdownMenuLabel>Transaction Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">Slippage tolerance <Info className="w-3 h-3" /></span>
                  <span className="font-medium">{(slippageBps / 100).toFixed(slippageBps % 100 ? 1 : 0)}%</span>
                </div>
                <div className="flex gap-2">
                  {[10, 50, 100].map((value) => (
                    <Button
                      key={value}
                      variant={slippageBps === value ? "secondary" : "outline"}
                      size="sm"
                      disabled={isExecutionLocked}
                      className="flex-1 rounded-lg"
                  onClick={() => {
                    invalidateQuote()
                    setSlippageBps(value)
                  }}
                    >
                      {(value / 100).toFixed(value % 100 ? 1 : 0)}%
                    </Button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="bg-secondary/50 rounded-2xl p-4 transition-colors focus-within:bg-secondary/80 border border-transparent hover:border-border/50">
          <div className="flex justify-between mb-2"><label className="text-sm text-muted-foreground">Sell</label></div>
          <div className="flex items-center justify-between gap-4">
            <input
              inputMode="decimal"
              type="text"
              placeholder="0"
              value={sellAmount}
              disabled={isExecutionLocked}
              onChange={(event) => handleSellChange(event.target.value)}
              className="bg-transparent text-4xl w-full outline-none font-medium placeholder:text-muted focus:placeholder:text-transparent text-foreground overflow-hidden text-ellipsis whitespace-nowrap disabled:opacity-70"
            />
            <Button variant="outline" disabled={isExecutionLocked} className="shrink-0 rounded-full bg-background border-border/50 shadow-sm hover:bg-background/90 pr-2 pl-3 gap-2 h-10" onClick={() => setSelectingFor("sell")}>
               <TokenAvatar token={sellToken} size="sm" />
              <span className="font-medium">{sellToken.symbol}</span><ArrowDown className="w-4 h-4 opacity-50 ml-1" />
            </Button>
          </div>
          <div className="flex justify-end mt-2 min-h-[20px]">
            {address && isOnRobinhoodChain && (
              <span className="text-sm text-muted-foreground flex gap-2">
                Balance: {isBalanceLoading ? "…" : balances[sellToken.id] ?? "—"}
                <button disabled={isExecutionLocked} onClick={handleMax} className="text-primary hover:underline font-medium disabled:opacity-50">Max</button>
              </span>
            )}
          </div>
        </div>

        <div className="relative h-2 w-full flex items-center justify-center z-10">
          <button aria-label="Switch sell and buy tokens" disabled={isExecutionLocked} className="absolute p-2 bg-background border border-border/50 rounded-xl text-foreground hover:bg-secondary transition-colors shadow-sm z-10 group disabled:opacity-50" onClick={handleSwapTokens}>
            <ArrowDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        <div className="bg-secondary/50 rounded-2xl p-4 transition-colors border border-transparent hover:border-border/50">
          <div className="flex justify-between mb-2"><label className="text-sm text-muted-foreground">Buy</label></div>
          <div className="flex items-center justify-between gap-4">
            <div className="text-4xl w-full font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{isQuoteLoading ? "…" : buyAmount || "0"}</div>
            <Button variant="outline" disabled={isExecutionLocked} className="shrink-0 rounded-full bg-background border-border/50 shadow-sm hover:bg-background/90 pr-2 pl-3 gap-2 h-10" onClick={() => setSelectingFor("buy")}>
               <TokenAvatar token={buyToken} size="sm" />
              <span className="font-medium">{buyToken.symbol}</span><ArrowDown className="w-4 h-4 opacity-50 ml-1" />
            </Button>
          </div>
          <div className="flex justify-end mt-2 min-h-[20px]">
            {address && isOnRobinhoodChain && <span className="text-sm text-muted-foreground">Balance: {isBalanceLoading ? "…" : balances[buyToken.id] ?? "—"}</span>}
          </div>
        </div>

        {(quote || quoteError || balanceError || notice || transactionState.phase === "failed" || transactionState.phase === "pending" || transactionState.phase === "confirmed") && (
          <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/20 p-3 text-sm">
            {quote && (
              <div className="space-y-2 text-muted-foreground">
                <div className="flex justify-between"><span>Minimum received</span><span className="font-medium text-foreground">{minReceived} {buyToken.symbol}</span></div>
                <div className="flex justify-between"><span>Slippage</span><span className="font-medium text-foreground">{(slippageBps / 100).toFixed(slippageBps % 100 ? 1 : 0)}%</span></div>
                <div className="flex justify-between gap-3"><span>Estimated network fee</span><span className="font-medium text-foreground text-right">{estimatedGas ? `~${estimatedGas} ETH` : "Calculated by wallet at confirmation"}</span></div>
                <div className="flex justify-between gap-3"><span>Route</span><span className="font-medium text-foreground text-right">{quote.sources.length ? quote.sources.join(" · ") : "0x aggregated"}</span></div>
              </div>
            )}
            {(quoteError || balanceError || transactionState.phase === "failed") && (
              <div className="mt-2 flex gap-2 text-destructive">
                <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{quoteError || balanceError || (transactionState.phase === "failed" ? transactionState.message : "")}</span>
              </div>
            )}
            {notice && <p className="mt-2 text-primary">{notice}</p>}
            {transactionState.phase === "pending" && transactionHref && (
              <a href={transactionHref} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-between text-amber-600 dark:text-amber-300 hover:underline">
                <span>{transactionState.message}</span><ExternalLink className="ml-2 h-4 w-4 shrink-0" />
              </a>
            )}
            {transactionState.phase === "confirmed" && transactionHref && (
              <a href={transactionHref} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-between text-primary hover:underline">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Swap confirmed</span><ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        <div className="mt-4">
          <Button className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" variant={!address || !isOnRobinhoodChain ? "default" : quoteError ? "secondary" : "default"} disabled={actionDisabled} onClick={() => void handleExecuteSwap()}>
            {(status === "connecting" || isQuoteLoading || transactionState.phase === "approving" || transactionState.phase === "requote" || transactionState.phase === "swapping") && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {actionLabel}
          </Button>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          Each ERC-20 approval is limited to this swap amount. Your wallet estimates the final network fee before confirmation.
        </p>
      </div>

      <TokenSelectDialog
        open={selectingFor !== null && !isExecutionLocked}
        onOpenChange={(open) => !open && setSelectingFor(null)}
        onSelect={handleSelectToken}
        selectedTokenId={selectingFor === "sell" ? sellToken.id : buyToken.id}
        balances={balances}
        tokens={tokens}
        isCatalogLoading={assetCatalog.isLoading}
        catalogError={catalogError}
      />
      <ConnectWalletDialog open={walletOpen} onOpenChange={setWalletOpen} />
    </>
  )
}