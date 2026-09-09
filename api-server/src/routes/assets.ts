import { Router, type IRouter } from "express";
import { GetSwapAssetsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const ROBINHOOD_CHAIN_ID = 4663;
const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const RHJ_ASSET_REGISTRY_URL = "https://api.robinhood.com/rhj/assets";
const ASSET_CACHE_TTL_MS = 5 * 60_000;

type AssetCategory = "crypto" | "stock" | "etf";

type SwapAsset = {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  category: AssetCategory;
  logoUrl: string | null;
  isNative: boolean;
};

type RobinhoodRegistryAsset = {
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimals?: number;
  logoUrl?: string;
  status?: string;
  deployments?: Array<{
    contractAddress?: string;
    chainId?: number;
  }>;
};

type SwapAssetCatalog = {
  assets: SwapAsset[];
  refreshedAt: Date;
};

const ETF_SYMBOLS = new Set([
  "BND", "EWT", "GLD", "INDA", "SCHD", "SHY", "SLV", "SMH", "SOXX", "SPMO", "SPY", "VTI", "XLK",
]);

// Crypto contract addresses are listed in the official Robinhood Chain contracts
// page or were previously verified against the Robinhood Chain Blockscout registry.
const CRYPTO_ASSETS: SwapAsset[] = [
  {
    id: "eth",
    address: NATIVE_TOKEN_ADDRESS,
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    isNative: true,
  },
  {
    id: "weth",
    address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    isNative: false,
  },
  {
    id: "usdg",
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    symbol: "USDG",
    name: "Global Dollar",
    decimals: 6,
    category: "crypto",
    logoUrl: "https://globaldollar.com/favicon.ico",
    isNative: false,
  },
  {
    id: "usde",
    address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    symbol: "USDe",
    name: "Ethena USDe",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/33613/small/USDE.png",
    isNative: false,
  },
  {
    id: "link",
    address: "0x492641F648a4986844848E0beFE66D14817bCE34",
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
    category: "crypto",
    logoUrl: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
    isNative: false,
  },
];

let cachedCatalog: SwapAssetCatalog | null = null;
let cacheExpiresAt = 0;

function isAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function toStockAsset(asset: RobinhoodRegistryAsset): SwapAsset | null {
  const decimals = asset.tokenDecimals;
  if (
    asset.status !== "ASSET_STATUS_ACTIVE" ||
    !asset.tokenSymbol ||
    !asset.tokenName ||
    typeof decimals !== "number" ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 36
  ) {
    return null;
  }

  const deployment = asset.deployments?.find((candidate) => candidate.chainId === ROBINHOOD_CHAIN_ID && isAddress(candidate.contractAddress));
  if (!deployment?.contractAddress) return null;

  const symbol = asset.tokenSymbol.trim();
  const name = asset.tokenName.replace(/\s*•\s*Robinhood Token$/i, "").trim();
  if (!symbol || !name) return null;

  return {
    id: `rhj-${deployment.contractAddress.toLowerCase()}`,
    address: deployment.contractAddress,
    symbol,
    name,
    decimals,
    category: ETF_SYMBOLS.has(symbol.toUpperCase()) ? "etf" : "stock",
    logoUrl: typeof asset.logoUrl === "string" && asset.logoUrl.startsWith("https://") ? asset.logoUrl : null,
    isNative: false,
  };
}

async function loadAssetCatalog(): Promise<SwapAssetCatalog> {
  const response = await fetch(RHJ_ASSET_REGISTRY_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Robinhood asset registry returned ${response.status}`);
  }

  const payload = await response.json() as { assets?: unknown };
  if (!Array.isArray(payload.assets)) {
    throw new Error("Robinhood asset registry returned an invalid response.");
  }

  const seenAddresses = new Set(CRYPTO_ASSETS.map((asset) => asset.address.toLowerCase()));
  const stockAssets = payload.assets
    .map((asset) => toStockAsset(asset as RobinhoodRegistryAsset))
    .filter((asset): asset is SwapAsset => asset !== null)
    .filter((asset) => {
      const key = asset.address.toLowerCase();
      if (seenAddresses.has(key)) return false;
      seenAddresses.add(key);
      return true;
    })
    .sort((left, right) => left.symbol.localeCompare(right.symbol));

  return GetSwapAssetsResponse.parse({
    assets: [...CRYPTO_ASSETS, ...stockAssets],
    refreshedAt: new Date(),
  });
}

export async function getVerifiedAssetCatalog() {
  if (cachedCatalog && Date.now() < cacheExpiresAt) {
    return cachedCatalog;
  }

  try {
    const catalog = await loadAssetCatalog();
    cachedCatalog = catalog;
    cacheExpiresAt = Date.now() + ASSET_CACHE_TTL_MS;
    return catalog;
  } catch (error) {
    if (cachedCatalog) return cachedCatalog;
    throw error;
  }
}

router.get("/swap/assets", async (_req, res): Promise<void> => {
  try {
    res.json(await getVerifiedAssetCatalog());
  } catch (error) {
    _req.log.error({ err: error }, "Robinhood asset registry request failed");
    res.status(503).json({ error: "The Robinhood asset registry is temporarily unavailable. Please try again." });
  }
});

export default router;