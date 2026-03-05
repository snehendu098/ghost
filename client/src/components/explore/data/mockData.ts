export interface FeaturedLST {
  name: string;
  ticker: string;
  apy: number;
  iconBg: string;
  iconText: string;
}

export interface LSTRow {
  rank: number;
  name: string;
  ticker: string;
  icon: string;
  apy: number;
  solStaked: number;
  marketCap: number;
  holders: number;
  commission: number;
}

export const featuredLSTs: FeaturedLST[] = [
  { name: "Ghost USD", ticker: "gUSD", apy: 0, iconBg: "bg-gradient-to-br from-green-400 to-emerald-600", iconText: "$" },
  { name: "Ghost ETH", ticker: "gETH", apy: 0, iconBg: "bg-gradient-to-br from-blue-400 to-indigo-600", iconText: "Ξ" },
];

export const lstTableData: LSTRow[] = [
  { rank: 1, name: "Ghost USD", ticker: "gUSD", icon: "💵", apy: 0, solStaked: 0, marketCap: 0, holders: 0, commission: 0 },
  { rank: 2, name: "Ghost ETH", ticker: "gETH", icon: "💎", apy: 0, solStaked: 0, marketCap: 0, holders: 0, commission: 0 },
];
