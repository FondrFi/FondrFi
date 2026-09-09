import { Router, type IRouter } from "express";
import { GetPortfolioPricesBody, GetPortfolioPricesResponse } from "@workspace/api-zod";
import { getVerifiedAssetCatalog } from "./assets";

const router: IRouter = Router();

const ZEROX_PRICE_URL = "https://api.0x.org/swap/allowance-holder/price";
const ROBINHOOD_CHAIN_ID = "4663";
const USDG_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_ASSETS_PER_IP_PER_WINDOW = 300;
const MAX_GLOBAL_ASSETS_PER_WINDOW = 1_500;
const MAX_RATE_LIMIT_KEYS = 5_000;
const MAX_CONCURRENT_UPSTREAM_REQUESTS = 24;
const ipAssetRequests = new Map<string, number[]>();
let globalAssetRequests: number[] = [];
let activeUpstreamRequests = 0;
let lastRateLimitCleanupAt = 0;

type ZeroExPrice = {
  buyAmount?: string;
  liquidityAvailable?: boolean;
  route?: { fills?: Array<{ source?: string }> };
};

function cleanRateLimitMap(requests: Map<string, number[]>, now: number) {
  for (const [trackedKey, timestamps] of requests) {
    const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (recentTimestamps.length === 0) requests.delete(trackedKey);
    else requests.set(trackedKey, recentTimestamps);
  }
}

function consumesTooMuchBudget(requests: Map<string, number[]>, key: string, limit: number, cost = 1) {
  const now = Date.now();
  if (now - lastRateLimitCleanupAt > 5_000) {
    cleanRateLimitMap(ipAssetRequests, now);
    globalAssetRequests = globalAssetRequests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    lastRateLimitCleanupAt = now;
  }

  const recentTimestamps = (requests.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (!requests.has(key) && requests.size >= MAX_RATE_LIMIT_KEYS) {
    const oldestTrackedKey = requests.keys().next().value;
    if (oldestTrackedKey) requests.delete(oldestTrackedKey);
  }
  if (recentTimestamps.length + cost > limit) return true;
  for (let index = 0; index < cost; index += 1) recentTimestamps.push(now);
  requests.set(key, recentTimestamps);
  return false;
}

function consumesGlobalBudget(cost: number) {
  const now = Date.now();
  globalAssetRequests = globalAssetRequests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (globalAssetRequests.length + cost > MAX_GLOBAL_ASSETS_PER_WINDOW) return true;
  for (let index = 0; index < cost; index += 1) globalAssetRequests.push(now);
  return false;
}

function isPositiveInteger(value: unknown): value is string {
  return typeof value === "string" && /^[1-9][0-9]*$/.test(value);
}

export async function getPrice(
  asset: { address: string; sellAmount: string },
  taker: string | null,
  apiKey: string,
): Promise<{
  address: string;
  available: boolean;
  buyAmount: string | null;
  source: string | null;
  error: string | null;
}> {
  if (asset.address.toLowerCase() === USDG_ADDRESS.toLowerCase()) {
    return {
      address: asset.address,
      available: true,
      buyAmount: asset.sellAmount,
      source: "USDG reference",
      error: null,
    };
  }

  const params = new URLSearchParams({
    chainId: ROBINHOOD_CHAIN_ID,
    sellToken: asset.address,
    buyToken: USDG_ADDRESS,
    sellAmount: asset.sellAmount,
  });
  if (taker) params.set("taker", taker);

  if (activeUpstreamRequests >= MAX_CONCURRENT_UPSTREAM_REQUESTS) {
    return {
      address: asset.address,
      available: false,
      buyAmount: null,
      source: null,
      error: "Price service is busy. Try refreshing shortly.",
    };
  }

  activeUpstreamRequests += 1;
  try {
    const response = await fetch(`${ZEROX_PRICE_URL}?${params.toString()}`, {
      headers: {
        "0x-api-key": apiKey,
        "0x-version": "v2",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      if (detail.includes("NOT_AUTHORIZED_FOR_TRADE") || detail.includes("legal restrictions")) {
        return {
          address: asset.address,
          available: false,
          buyAmount: null,
          source: null,
          error: "Unavailable for this wallet or region.",
        };
      }
      return {
        address: asset.address,
        available: false,
        buyAmount: null,
        source: null,
        error: "No live market route is available.",
      };
    }

    const raw = await response.json() as ZeroExPrice;
    if (!raw.buyAmount || !isPositiveInteger(raw.buyAmount) || raw.liquidityAvailable === false) {
      return {
        address: asset.address,
        available: false,
        buyAmount: null,
        source: null,
        error: "No live market route is available.",
      };
    }

    const sources = [...new Set(raw.route?.fills?.map((fill) => fill.source).filter((source): source is string => Boolean(source)) ?? [])];
    return {
      address: asset.address,
      available: true,
      buyAmount: raw.buyAmount,
      source: sources.length ? sources.join(" · ") : "0x aggregated",
      error: null,
    };
  } catch {
    return {
      address: asset.address,
      available: false,
      buyAmount: null,
      source: null,
      error: "Price service is temporarily unavailable.",
    };
  } finally {
    activeUpstreamRequests -= 1;
  }
}

export async function getPricesWithConcurrency(
  assets: Array<{ address: string; sellAmount: string }>,
  taker: string | null,
  apiKey: string,
) {
  const results = new Array<Awaited<ReturnType<typeof getPrice>>>(assets.length);
  let nextIndex = 0;
  const workerCount = Math.min(6, assets.length);
  const worker = async () => {
    while (nextIndex < assets.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await getPrice(assets[index], taker, apiKey);
    }
  };
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

router.post("/portfolio/prices", async (req, res): Promise<void> => {
  const parsed = GetPortfolioPricesBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "Invalid portfolio price request");
    res.status(400).json({ error: "Invalid portfolio price request." });
    return;
  }

  const { taker, assets } = parsed.data;
  let catalog;
  try {
    catalog = await getVerifiedAssetCatalog();
  } catch (error) {
    req.log.error({ err: error }, "Portfolio price request could not load the verified asset catalog");
    res.status(503).json({ error: "The verified asset catalog is temporarily unavailable." });
    return;
  }

  const verifiedAssets = new Map(catalog.assets.map((asset) => [asset.address.toLowerCase(), asset]));
  const requestedAddresses = new Set<string>();
  for (const asset of assets) {
    const normalizedAddress = asset.address.toLowerCase();
    const verifiedAsset = verifiedAssets.get(normalizedAddress);
    if (
      !verifiedAsset ||
      requestedAddresses.has(normalizedAddress) ||
      asset.sellAmount !== (10n ** BigInt(verifiedAsset.decimals)).toString()
    ) {
      res.status(400).json({ error: "Portfolio prices can only be requested once per verified asset using its one-token base amount." });
      return;
    }
    requestedAddresses.add(normalizedAddress);
  }

  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  if (
    consumesTooMuchBudget(ipAssetRequests, clientIp, MAX_ASSETS_PER_IP_PER_WINDOW, assets.length) ||
    consumesGlobalBudget(assets.length)
  ) {
    res.status(429).json({ error: "Too many portfolio refreshes. Please wait a minute and try again." });
    return;
  }

  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) {
    req.log.warn("Portfolio price request rejected because ZEROX_API_KEY is not configured");
    res.status(503).json({ error: "Live portfolio prices are not configured yet." });
    return;
  }

  const prices = await getPricesWithConcurrency(assets, taker, apiKey);
  res.json(GetPortfolioPricesResponse.parse({
    prices,
    refreshedAt: new Date(),
  }));
});

export default router;