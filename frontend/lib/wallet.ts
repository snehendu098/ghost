import { createPublicClient, http } from "viem";
import { arcTestnet, baseSepolia, sepolia, avalancheFuji } from "viem/chains";

export const supportedChains = [
  arcTestnet,
  baseSepolia,
  sepolia,
  avalancheFuji,
] as const;

export const USDC_ADDRESSES: Record<number, `0x${string}` | null> = {
  [arcTestnet.id]: "0x3600000000000000000000000000000000000000",
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  [avalancheFuji.id]: "0x5425890298aed601595a70AB815c96711a31Bc65",
};

// ── Chain logos (CoinMarketCap static assets) ──

export const CHAIN_LOGOS: Record<number, string> = {
  [arcTestnet.id]: "/arc.png",
  [baseSepolia.id]: "/base.png",
  [sepolia.id]: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  [avalancheFuji.id]: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
};

export const USDC_LOGO = "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png";

// ── Public clients per chain ──

export function createChainPublicClient(chainId: number) {
  const chain = supportedChains.find((c) => c.id === chainId);
  if (!chain) throw new Error(`Unsupported chain: ${chainId}`);
  return createPublicClient({ chain, transport: http() });
}

// ── ERC-20 minimal ABI ──

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
