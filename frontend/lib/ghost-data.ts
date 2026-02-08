// ── Ghost Protocol Mock Data (USDC-only) ──

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── Types ──

export type CreditTier = "New" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export interface CreditScore {
  score: number;
  tier: CreditTier;
  collateralRequired: number;
  repayments: number;
  totalVolume: number;
  defaults: number;
  ghostPointsBoost: number;
}

export interface Market {
  id: string;
  asset: string;
  symbol: string;
  epochNumber: number;
  epochEndsIn: number;
  seniorRate: number;
  juniorRate: number;
  totalSupply: number;
  totalDemand: number;
  utilization: number;
}

export interface Epoch {
  number: number;
  status: "active" | "completed";
  seniorRate: number;
  juniorRate: number;
  matchedVolume: number;
  duration: string;
  market: string;
}

export type Tranche = "senior" | "junior";

export interface LendPosition {
  id: string;
  market: string;
  tranche: Tranche;
  amount: number;
  rate: number;
  duration: number;
  status: "active" | "matched" | "pending";
  earnings: number;
  epoch: number;
}

export interface BorrowPosition {
  id: string;
  market: string;
  amount: number;
  rate: number;
  collateralAsset: string;
  collateralAmount: number;
  healthRatio: number;
  liquidationPrice: number;
  dueDate: string;
  epoch: number;
}

export interface LoanHistory {
  id: string;
  type: "lend" | "borrow";
  market: string;
  amount: number;
  rate: number;
  status: "repaid" | "late" | "default";
  creditImpact: number;
  date: string;
  duration: string;
}

// ── Constants ──

export const COLLATERAL_TIERS: { maxScore: number; collateral: number }[] = [
  { maxScore: 100, collateral: 150 },
  { maxScore: 200, collateral: 145 },
  { maxScore: 300, collateral: 135 },
  { maxScore: 400, collateral: 125 },
  { maxScore: 500, collateral: 115 },
  { maxScore: 600, collateral: 105 },
  { maxScore: 1000, collateral: 100 },
];

export function getCollateralRequired(score: number): number {
  for (const tier of COLLATERAL_TIERS) {
    if (score <= tier.maxScore) return tier.collateral;
  }
  return 100;
}

export function getCreditTier(score: number): CreditTier {
  if (score < 100) return "New";
  if (score < 200) return "Bronze";
  if (score < 400) return "Silver";
  if (score < 600) return "Gold";
  if (score < 800) return "Platinum";
  return "Diamond";
}

// ── Mock Generators (USDC only) ──

export function getMockCreditScore(): CreditScore {
  const score = 650;
  return {
    score,
    tier: getCreditTier(score),
    collateralRequired: getCollateralRequired(score),
    repayments: 47,
    totalVolume: 284_500,
    defaults: 0,
    ghostPointsBoost: 85,
  };
}

export function getMockMarkets(): Market[] {
  return [
    {
      id: "usdc-market",
      asset: "usdc",
      symbol: "USDC",
      epochNumber: 24,
      epochEndsIn: 14 * 3600 + 32 * 60,
      seniorRate: 4.2,
      juniorRate: 8.7,
      totalSupply: 12_400_000,
      totalDemand: 9_800_000,
      utilization: 79,
    },
  ];
}

export function getMockEpochs(): Epoch[] {
  const rand = seededRandom(42);
  const epochs: Epoch[] = [];

  for (let i = 24; i >= 13; i--) {
    epochs.push({
      number: i,
      status: i === 24 ? "active" : "completed",
      seniorRate: 3.5 + rand() * 2,
      juniorRate: 7 + rand() * 4,
      matchedVolume: 2_000_000 + rand() * 8_000_000,
      duration: "7 days",
      market: "usdc-market",
    });
  }
  return epochs;
}

export function getMockLendPositions(): LendPosition[] {
  return [
    {
      id: "lp-1",
      market: "usdc-market",
      tranche: "senior",
      amount: 5_000,
      rate: 4.2,
      duration: 90,
      status: "matched",
      earnings: 52.12,
      epoch: 24,
    },
    {
      id: "lp-2",
      market: "usdc-market",
      tranche: "junior",
      amount: 2_000,
      rate: 8.7,
      duration: 30,
      status: "active",
      earnings: 14.27,
      epoch: 24,
    },
    {
      id: "lp-3",
      market: "usdc-market",
      tranche: "senior",
      amount: 1_500,
      rate: 4.2,
      duration: 180,
      status: "pending",
      earnings: 0,
      epoch: 24,
    },
  ];
}

export function getMockActiveBorrows(): BorrowPosition[] {
  return [
    {
      id: "bp-1",
      market: "usdc-market",
      amount: 10_000,
      rate: 5.1,
      collateralAsset: "eth",
      collateralAmount: 5.2,
      healthRatio: 1.45,
      liquidationPrice: 1_480,
      dueDate: "Mar 15, 2026",
      epoch: 23,
    },
    {
      id: "bp-2",
      market: "usdc-market",
      amount: 3_000,
      rate: 4.8,
      collateralAsset: "eth",
      collateralAmount: 1.6,
      healthRatio: 1.22,
      liquidationPrice: 1_650,
      dueDate: "Feb 28, 2026",
      epoch: 22,
    },
  ];
}

export function getMockLoanHistory(): LoanHistory[] {
  const rand = seededRandom(hashStr("loanhistory"));
  const statuses: ("repaid" | "late" | "default")[] = ["repaid", "repaid", "repaid", "repaid", "repaid", "repaid", "repaid", "repaid", "repaid", "repaid", "repaid", "late", "repaid", "repaid", "repaid"];
  const history: LoanHistory[] = [];

  for (let i = 0; i < 15; i++) {
    const status = statuses[i];
    const isLend = rand() > 0.4;
    const amount = 500 + Math.floor(rand() * 15000);
    history.push({
      id: `loan-${i + 1}`,
      type: isLend ? "lend" : "borrow",
      market: "usdc-market",
      amount,
      rate: 3.5 + rand() * 6,
      status,
      creditImpact: status === "repaid" ? Math.floor(10 + rand() * 20) : status === "late" ? Math.floor(-20 - rand() * 30) : Math.floor(-100 - rand() * 150),
      date: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i % 12]} ${Math.floor(1 + rand() * 28)}, 2026`,
      duration: `${[30, 60, 90, 180][Math.floor(rand() * 4)]}d`,
    });
  }
  return history;
}

// ── Formatting helpers ──

export function fmtCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtUsd(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toFixed(4)}`;
  return "$0.00";
}

export function getMarketSymbol(marketId: string): string {
  return marketId === "usdc-market" ? "USDC" : marketId;
}

export function getMarketAsset(marketId: string): string {
  return marketId === "usdc-market" ? "usdc" : "usdc";
}
