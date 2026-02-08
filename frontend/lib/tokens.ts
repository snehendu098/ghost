export interface Token {
  id: string;
  symbol: string;
  name: string;
  color: string;
  price: number;
  networks: string[];
}

export interface Network {
  id: string;
  name: string;
  color: string;
}

export const tokens: Token[] = [
  { id: "btc", symbol: "BTC", name: "Bitcoin", color: "#f7931a", price: 70338, networks: ["ethereum", "bnb", "avalanche", "arbitrum"] },
  { id: "eth", symbol: "ETH", name: "Ethereum", color: "#627eea", price: 2053, networks: ["ethereum", "arbitrum", "optimism", "base", "polygon"] },
  { id: "bnb", symbol: "BNB", name: "BNB", color: "#f0b90b", price: 662.29, networks: ["bnb", "ethereum"] },
  { id: "sol", symbol: "SOL", name: "Solana", color: "#9945ff", price: 87.98, networks: ["solana", "ethereum"] },
  { id: "usdt", symbol: "USDT", name: "Tether", color: "#26a17b", price: 1, networks: ["ethereum", "bnb", "avalanche", "polygon", "arbitrum", "optimism", "solana"] },
  { id: "usdc", symbol: "USDC", name: "USD Coin", color: "#2775ca", price: 1, networks: ["ethereum", "bnb", "avalanche", "polygon", "arbitrum", "optimism", "solana", "base"] },
  { id: "avax", symbol: "AVAX", name: "Avalanche", color: "#e84142", price: 9.17, networks: ["avalanche", "ethereum"] },
  { id: "pol", symbol: "POL", name: "Polygon", color: "#8247e5", price: 0.098, networks: ["polygon", "ethereum"] },
  { id: "arb", symbol: "ARB", name: "Arbitrum", color: "#28a0f0", price: 0.12, networks: ["arbitrum", "ethereum"] },
  { id: "op", symbol: "OP", name: "Optimism", color: "#ff0420", price: 0.19, networks: ["optimism", "ethereum"] },
  { id: "dai", symbol: "DAI", name: "Dai", color: "#f5ac37", price: 1, networks: ["ethereum", "polygon", "arbitrum", "optimism"] },
  { id: "link", symbol: "LINK", name: "Chainlink", color: "#2a5ada", price: 8.86, networks: ["ethereum", "polygon", "arbitrum", "optimism", "avalanche"] },
];

export const networks: Network[] = [
  { id: "ethereum", name: "Ethereum", color: "#627eea" },
  { id: "bnb", name: "BNB Chain", color: "#f0b90b" },
  { id: "polygon", name: "Polygon", color: "#8247e5" },
  { id: "arbitrum", name: "Arbitrum", color: "#28a0f0" },
  { id: "optimism", name: "Optimism", color: "#ff0420" },
  { id: "avalanche", name: "Avalanche", color: "#e84142" },
  { id: "solana", name: "Solana", color: "#9945ff" },
  { id: "base", name: "Base", color: "#0052ff" },
];

export function getTokenById(id: string) {
  return tokens.find((t) => t.id === id);
}

export function getNetworkById(id: string) {
  return networks.find((n) => n.id === id);
}

export function getTokensForNetwork(networkId: string) {
  return tokens.filter((t) => t.networks.includes(networkId));
}

export function getRate(fromId: string, toId: string) {
  const from = getTokenById(fromId);
  const to = getTokenById(toId);
  if (!from || !to || to.price === 0) return 0;
  return from.price / to.price;
}
