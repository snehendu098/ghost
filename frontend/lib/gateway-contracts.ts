import { baseSepolia, arcTestnet, sepolia, avalancheFuji } from "viem/chains";

export interface NetworkConfig {
  RPC: string;
  GatewayWallet: string;
  GatewayMinter: string;
  USDCAddress: string;
}

export interface ChainConfig {
  domain: number;
  name: string;
  shortName: string;
  chainId: number;
  iconId: string;
  testnet: NetworkConfig;
}

export const GATEWAY_CONFIG = {
  TESTNET_URL: "https://gateway-api-testnet.circle.com/v1",
  MAINNET_URL: "https://gateway-api.circle.com/v1",
};

export const gatewayChains: ChainConfig[] = [
  {
    domain: 0,
    name: "Ethereum Sepolia",
    shortName: "Ethereum",
    chainId: sepolia.id,
    iconId: "eth",
    testnet: {
      RPC: "https://ethereum-sepolia-rpc.publicnode.com",
      GatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
      GatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
      USDCAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    },
  },
  {
    domain: 6,
    name: "Base Sepolia",
    shortName: "Base",
    chainId: baseSepolia.id,
    iconId: "base",
    testnet: {
      RPC: "https://base-sepolia-rpc.publicnode.com",
      GatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
      GatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
      USDCAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    },
  },
  {
    domain: 1,
    name: "Avalanche Fuji",
    shortName: "Avalanche",
    chainId: avalancheFuji.id,
    iconId: "avax",
    testnet: {
      RPC: "https://avalanche-fuji-c-chain-rpc.publicnode.com",
      GatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
      GatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
      USDCAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    },
  },
  {
    domain: 26,
    name: "Arc Testnet",
    shortName: "Arc",
    chainId: arcTestnet.id,
    iconId: "arc",
    testnet: {
      RPC: arcTestnet.rpcUrls.default.http[0],
      GatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
      GatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
      USDCAddress: "0x3600000000000000000000000000000000000000",
    },
  },
];

// All gateway chains are depositable on testnet
export const depositableChains = gatewayChains;

export function getDomainName(domain: number): string {
  return gatewayChains.find((c) => c.domain === domain)?.name ?? `Domain ${domain}`;
}

export function getGatewayChainByDomainId(domain: number): ChainConfig | undefined {
  return gatewayChains.find((c) => c.domain === domain);
}

export function getGatewayChainByChainId(chainId: number): ChainConfig | undefined {
  return gatewayChains.find((c) => c.chainId === chainId);
}

// ERC20 approve ABI fragment
export const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Gateway Wallet deposit ABI fragment
export const GATEWAY_DEPOSIT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
