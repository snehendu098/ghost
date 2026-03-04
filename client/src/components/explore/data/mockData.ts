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
  { name: "Infinity", ticker: "INF", apy: 6.33, iconBg: "bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500", iconText: "" },
  { name: "Forward Industries...", ticker: "fwdSOL", apy: 6.33, iconBg: "bg-purple-600", iconText: "F" },
  { name: "BybitSOL", ticker: "bbSOL", apy: 5.97, iconBg: "bg-zinc-800", iconText: "" },
  { name: "BULK Staked SOL", ticker: "BulkSOL", apy: 5.95, iconBg: "bg-amber-500", iconText: "" },
  { name: "Ghost SOL", ticker: "gSOL", apy: 8.12, iconBg: "bg-indigo-600", iconText: "" },
  { name: "Marinade", ticker: "mSOL", apy: 7.34, iconBg: "bg-emerald-600", iconText: "" },
  { name: "Jito", ticker: "jitoSOL", apy: 7.89, iconBg: "bg-amber-500", iconText: "" },
  { name: "BlazeStake", ticker: "bSOL", apy: 7.56, iconBg: "bg-red-500", iconText: "" },
];

export const lstTableData: LSTRow[] = [
  { rank: 1, name: "Ghost SOL", ticker: "gSOL", icon: "👻", apy: 8.12, solStaked: 2450000, marketCap: 385000000, holders: 12450, commission: 5 },
  { rank: 2, name: "Sanctum Infinity", ticker: "INF", icon: "✨", apy: 8.45, solStaked: 1890000, marketCap: 297000000, holders: 9870, commission: 0 },
  { rank: 3, name: "Jito Staked SOL", ticker: "jitoSOL", icon: "⚡", apy: 7.89, solStaked: 5670000, marketCap: 891000000, holders: 34200, commission: 4 },
  { rank: 4, name: "Marinade Staked SOL", ticker: "mSOL", icon: "🧪", apy: 7.34, solStaked: 8120000, marketCap: 1276000000, holders: 45600, commission: 6 },
  { rank: 5, name: "BlazeStake SOL", ticker: "bSOL", icon: "🔥", apy: 7.56, solStaked: 1230000, marketCap: 193000000, holders: 8900, commission: 5 },
  { rank: 6, name: "Lido Staked SOL", ticker: "stSOL", icon: "🌊", apy: 6.98, solStaked: 3450000, marketCap: 542000000, holders: 21300, commission: 10 },
  { rank: 7, name: "Cogent SOL", ticker: "cgntSOL", icon: "🧠", apy: 7.21, solStaked: 890000, marketCap: 140000000, holders: 5670, commission: 7 },
  { rank: 8, name: "Helius Staked SOL", ticker: "hSOL", icon: "☀️", apy: 7.67, solStaked: 1560000, marketCap: 245000000, holders: 7800, commission: 5 },
  { rank: 9, name: "Jupiter SOL", ticker: "jupSOL", icon: "🪐", apy: 7.45, solStaked: 4230000, marketCap: 664000000, holders: 28900, commission: 0 },
  { rank: 10, name: "Orca Staked SOL", ticker: "oSOL", icon: "🐋", apy: 7.12, solStaked: 670000, marketCap: 105000000, holders: 4300, commission: 8 },
];
