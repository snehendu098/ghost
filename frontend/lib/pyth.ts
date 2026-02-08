// Pyth Hermes price feed IDs for each token
export const PYTH_FEED_IDS: Record<string, string> = {
  btc: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  eth: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  bnb: "2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
  sol: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  usdt: "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
  usdc: "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  avax: "93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7",
  pol: "ffd11c5a1cfd42f80afb2df4d9f264c15f956d68153335374ec10722edd70472",
  arb: "3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5",
  op: "385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf",
  dai: "b0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd",
  link: "8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221",
};

// Reverse mapping: feed ID -> token ID
const FEED_TO_TOKEN: Record<string, string> = {};
for (const [tokenId, feedId] of Object.entries(PYTH_FEED_IDS)) {
  FEED_TO_TOKEN[feedId] = tokenId;
}

const HERMES_BASE = "https://hermes.pyth.network";

interface PythParsedPrice {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

function parsePythPrice(data: PythParsedPrice): number {
  return parseInt(data.price.price) * Math.pow(10, data.price.expo);
}

function buildFeedParams(): string {
  return Object.values(PYTH_FEED_IDS)
    .map((id) => `ids[]=${id}`)
    .join("&");
}

function parsePriceUpdate(parsed: PythParsedPrice[]): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const item of parsed) {
    const tokenId = FEED_TO_TOKEN[item.id];
    if (tokenId) {
      const p = parsePythPrice(item);
      if (p > 0) prices[tokenId] = p;
    }
  }
  return prices;
}

export async function fetchLatestPrices(): Promise<Record<string, number>> {
  const url = `${HERMES_BASE}/v2/updates/price/latest?${buildFeedParams()}&parsed=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pyth fetch failed: ${res.status}`);
  const data = await res.json();
  return parsePriceUpdate(data.parsed || []);
}

export function createPriceStream(
  onUpdate: (prices: Record<string, number>) => void,
  onError?: (error: Event) => void
): EventSource {
  const url = `${HERMES_BASE}/v2/updates/price/stream?${buildFeedParams()}&parsed=true&allow_unordered=true&benchmarks_only=false`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const prices = parsePriceUpdate(data.parsed || []);
      if (Object.keys(prices).length > 0) {
        onUpdate(prices);
      }
    } catch {
      // silently ignore parse errors
    }
  };

  if (onError) es.onerror = onError;

  return es;
}
