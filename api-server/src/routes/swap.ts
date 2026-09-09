import { Router, type IRouter } from "express";
import { GetSwapQuoteBody, GetSwapQuoteResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const ZEROX_QUOTE_URL = "https://api.0x.org/swap/allowance-holder/quote";
const ROBINHOOD_CHAIN_ID = "4663";
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_QUOTES_PER_IP_PER_WINDOW = 60;
const MAX_QUOTES_PER_TAKER_PER_WINDOW = 30;
const MAX_RATE_LIMIT_KEYS = 5_000;
const quoteRequests = new Map<string, number[]>();
let lastRateLimitCleanupAt = 0;

function isRateLimited(key: string, limit: number) {
  const now = Date.now();
  if (now - lastRateLimitCleanupAt > 5_000) {
    for (const [trackedKey, timestamps] of quoteRequests) {
      const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
      if (recentTimestamps.length === 0) quoteRequests.delete(trackedKey);
      else quoteRequests.set(trackedKey, recentTimestamps);
    }
    lastRateLimitCleanupAt = now;
  }

  const requestsInWindow = (quoteRequests.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (requestsInWindow.length === 0 && !quoteRequests.has(key) && quoteRequests.size >= MAX_RATE_LIMIT_KEYS) {
    return true;
  }
  requestsInWindow.push(now);
  quoteRequests.set(key, requestsInWindow);
  return requestsInWindow.length > limit;
}

type ZeroExQuote = {
  sellAmount?: string;
  buyAmount?: string;
  minBuyAmount?: string;
  liquidityAvailable?: boolean;
  allowanceTarget?: string;
  issues?: { allowance?: { spender?: string } };
  route?: { fills?: Array<{ source?: string }> };
  transaction?: {
    to?: string;
    data?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
  };
};

router.post("/swap/quote", async (req, res): Promise<void> => {
  const parsed = GetSwapQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "Invalid swap quote request");
    res.status(400).json({ error: "Invalid swap quote request." });
    return;
  }

  const { sellToken, buyToken, sellAmount, taker, slippageBps } = parsed.data;
  if (sellToken.toLowerCase() === buyToken.toLowerCase()) {
    res.status(400).json({ error: "Choose two different tokens." });
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(`ip:${clientIp}`, MAX_QUOTES_PER_IP_PER_WINDOW) || isRateLimited(`taker:${taker.toLowerCase()}`, MAX_QUOTES_PER_TAKER_PER_WINDOW)) {
    res.status(429).json({ error: "Too many quote requests. Please wait a minute and try again." });
    return;
  }

  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) {
    req.log.warn("0x quote request rejected because ZEROX_API_KEY is not configured");
    res.status(503).json({ error: "Live quotes are not configured yet. Add ZEROX_API_KEY to enable swapping." });
    return;
  }

  const params = new URLSearchParams({
    chainId: ROBINHOOD_CHAIN_ID,
    sellToken,
    buyToken,
    sellAmount,
    taker,
    slippageBps: String(slippageBps),
  });

  try {
    const quoteResponse = await fetch(`${ZEROX_QUOTE_URL}?${params.toString()}`, {
      headers: {
        "0x-api-key": apiKey,
        "0x-version": "v2",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!quoteResponse.ok) {
      const detail = await quoteResponse.text();
      req.log.warn({ providerStatus: quoteResponse.status, detail: detail.slice(0, 300) }, "0x quote provider returned an error");
      if (detail.includes("NOT_AUTHORIZED_FOR_TRADE") || detail.includes("legal restrictions")) {
        res.status(403).json({ error: "This stock token is unavailable for this wallet or region due to trading restrictions." });
        return;
      }
      const status = quoteResponse.status === 429 || quoteResponse.status >= 500 ? 503 : 400;
      res.status(status).json({ error: "No executable route is available for this pair and amount." });
      return;
    }

    const raw = (await quoteResponse.json()) as ZeroExQuote;
    const transaction = raw.transaction;
    if (
      !raw.liquidityAvailable ||
      !raw.sellAmount ||
      !raw.buyAmount ||
      !raw.minBuyAmount ||
      !transaction?.to ||
      !transaction.data ||
      transaction.value == null
    ) {
      req.log.warn("0x quote response did not contain an executable route");
      res.status(400).json({ error: "No executable route is available for this pair and amount." });
      return;
    }

    const quote = GetSwapQuoteResponse.parse({
      sellAmount: raw.sellAmount,
      buyAmount: raw.buyAmount,
      minBuyAmount: raw.minBuyAmount,
      liquidityAvailable: true,
      allowanceTarget: raw.allowanceTarget ?? raw.issues?.allowance?.spender ?? null,
      sources: [...new Set(raw.route?.fills?.map((fill) => fill.source).filter((source): source is string => Boolean(source)) ?? [])],
      transaction: {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value,
        gas: transaction.gas ?? null,
        gasPrice: transaction.gasPrice ?? null,
      },
    });

    res.json(quote);
  } catch (error) {
    req.log.error({ err: error }, "0x quote request failed");
    res.status(503).json({ error: "The quote service is temporarily unavailable. Please try again." });
  }
});

export default router;