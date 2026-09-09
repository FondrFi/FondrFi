import { Router, type IRouter } from "express";
import { GetExploreMarketsBody, GetExploreMarketsResponse } from "@workspace/api-zod";
import { getVerifiedAssetCatalog } from "./assets";
import { getPrice } from "./portfolio";

const router: IRouter = Router();

const MARKET_CACHE_TTL_MS = 20_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_IP_PER_WINDOW = 120;
const MAX_ASSETS_PER_IP_PER_WINDOW = 180;
const MAX_GLOBAL_ASSETS_PER_WINDOW = 1_000;
const MAX_RATE_LIMIT_KEYS = 5_000;
const MAX_WORKERS_PER_REQUEST = 6;

type MarketPrice = Awaited<ReturnType<typeof getPrice>>;
type CachedMarket = {
  expiresAt: number;
  price: MarketPrice;
  refreshedAt: Date;
};

const marketCache = new Map<string, CachedMarket>();
const inFlightMarkets = new Map<string, Promise<CachedMarket>>();
const ipRequests = new Map<string, number[]>();
const ipAssetRequests = new Map<string, number[]>();
let globalAssetRequests: number[] = [];
let lastRateLimitCleanupAt = 0;

function cleanRateLimitMap(now: number) {
  for (const requests of [ipRequests, ipAssetRequests]) {
    for (const [trackedKey, timestamps] of requests) {
      const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
      if (recentTimestamps.length === 0) requests.delete(trackedKey);
      else requests.set(trackedKey, recentTimestamps);
    }
  }
  globalAssetRequests = globalAssetRequests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
}

function recordIpBudget(requests: Map<string, number[]>, key: string, limit: number, cost: number) {
  const now = Date.now();
  if (now - lastRateLimitCleanupAt > 5_000) {
    cleanRateLimitMap(now);
    lastRateLimitCleanupAt = now;
  }

  const recentTimestamps = (requests.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (!requests.has(key) && requests.size >= MAX_RATE_LIMIT_KEYS) {
    const oldestTrackedKey = requests.keys().next().value;
    if (oldestTrackedKey) requests.delete(oldestTrackedKey);
  }

  if (recentTimestamps.length + cost > limit) return false;
  for (let index = 0; index < cost; index += 1) recentTimestamps.push(now);
  requests.set(key, recentTimestamps);
  return true;
}

function exceedsRequestRateLimit(key: string) {
  return !recordIpBudget(ipRequests, key, MAX_REQUESTS_PER_IP_PER_WINDOW, 1);
}

function exceedsUpstreamRateLimit(key: string, cost: number) {
  if (
    (ipAssetRequests.get(key)?.length ?? 0) + cost > MAX_ASSETS_PER_IP_PER_WINDOW ||
    globalAssetRequests.length + cost > MAX_GLOBAL_ASSETS_PER_WINDOW
  ) {
    return true;
  }
  if (!recordIpBudget(ipAssetRequests, key, MAX_ASSETS_PER_IP_PER_WINDOW, cost)) return true;
  const now = Date.now();
  for (let index = 0; index < cost; index += 1) globalAssetRequests.push(now);
  return false;
}

function getCachedPrice(address: string) {
  const cached = marketCache.get(address.toLowerCase());
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    marketCache.delete(address.toLowerCase());
    return null;
  }
  return cached;
}

function cachePrice(price: MarketPrice, refreshedAt: Date) {
  const cached = {
    price,
    expiresAt: Date.now() + MARKET_CACHE_TTL_MS,
    refreshedAt,
  };
  marketCache.set(price.address.toLowerCase(), cached);
  return cached;
}

function getOrLoadMarket(
  asset: { address: string; decimals: number },
  apiKey: string,
) {
  const key = asset.address.toLowerCase();
  const cached = getCachedPrice(key);
  if (cached) return Promise.resolve(cached);

  const inFlight = inFlightMarkets.get(key);
  if (inFlight) return inFlight;

  const request = getPrice({
    address: asset.address,
    sellAmount: (10n ** BigInt(asset.decimals)).toString(),
  }, null, apiKey)
    .then((price) => cachePrice(price, new Date()))
    .finally(() => inFlightMarkets.delete(key));
  inFlightMarkets.set(key, request);
  return request;
}

async function loadMarketsWithConcurrency(
  assets: Array<{ address: string; decimals: number }>,
  apiKey: string,
) {
  const results = new Array<CachedMarket>(assets.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < assets.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await getOrLoadMarket(assets[index], apiKey);
    }
  };
  await Promise.all(Array.from(
    { length: Math.min(MAX_WORKERS_PER_REQUEST, assets.length) },
    () => worker(),
  ));
  return results;
}

router.post("/explore/markets", async (req, res): Promise<void> => {
  const parsed = GetExploreMarketsBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "Invalid Explore market request");
    res.status(400).json({ error: "Invalid Explore market request." });
    return;
  }

  const requestedAddresses = parsed.data.addresses.map((address) => address.toLowerCase());
  if (new Set(requestedAddresses).size !== requestedAddresses.length) {
    res.status(400).json({ error: "Each Explore asset can only be requested once." });
    return;
  }

  let catalog;
  try {
    catalog = await getVerifiedAssetCatalog();
  } catch (error) {
    req.log.error({ err: error }, "Explore market request could not load the verified asset catalog");
    res.status(503).json({ error: "The verified asset catalog is temporarily unavailable." });
    return;
  }

  const verifiedAssets = new Map(catalog.assets.map((asset) => [asset.address.toLowerCase(), asset]));
  const assets = requestedAddresses
    .map((address) => verifiedAssets.get(address))
    .filter((asset): asset is (typeof catalog.assets)[number] => Boolean(asset));
  if (assets.length !== requestedAddresses.length) {
    res.status(400).json({ error: "Explore markets can only be requested for verified Robinhood Chain assets." });
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  if (exceedsRequestRateLimit(clientIp)) {
    res.status(429).json({ error: "Too many market refreshes. Please wait a minute and try again." });
    return;
  }

  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) {
    req.log.warn("Explore market request rejected because ZEROX_API_KEY is not configured");
    res.status(503).json({ error: "Live Explore market data is not configured yet." });
    return;
  }

  const upstreamMissCount = assets.filter((asset) => (
    !getCachedPrice(asset.address) &&
    !inFlightMarkets.has(asset.address.toLowerCase())
  )).length;
  if (upstreamMissCount > 0 && exceedsUpstreamRateLimit(clientIp, upstreamMissCount)) {
    res.status(429).json({ error: "Too many uncached market requests. Please wait a minute and try again." });
    return;
  }

  const loadedMarkets = await loadMarketsWithConcurrency(assets, apiKey);
  const resolvedMarkets = new Map(loadedMarkets.map((market) => [
    market.price.address.toLowerCase(),
    market,
  ]));
  const selectedMarkets = requestedAddresses.map((address) => resolvedMarkets.get(address)).filter(
      (market): market is CachedMarket => Boolean(market),
    );
  res.json(GetExploreMarketsResponse.parse({
    markets: selectedMarkets.map((market) => market.price),
    refreshedAt: new Date(Math.min(...selectedMarkets.map((market) => market.refreshedAt.getTime()))),
  }));
});

export default router;