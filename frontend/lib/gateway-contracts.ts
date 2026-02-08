export interface NetworkConfig {
  RPC: string;
  GatewayWallet: string;
  GatewayMinter: string;
  USDCAddress: string;
}

export interface ChainConfig {
  domain: number;
  name: string;
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
    testnet: {
      RPC: "https://avalanche-fuji-c-chain-rpc.publicnode.com",
      GatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
      GatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
      USDCAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    },
  },
];

export function getDomainName(domain: number): string {
  return gatewayChains.find((c) => c.domain === domain)?.name ?? `Domain ${domain}`;
}
