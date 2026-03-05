export interface DepositSlot {
  shieldedAddress: string;
  userId: string;
  token: string;
  amount: bigint;
  status: "pending" | "confirmed" | "cancelled";
  encryptedRate?: string;
  createdAt: number;
  epochId: number;
}

export interface LendIntent {
  intentId: string;
  userId: string;
  token: string;
  amount: bigint;
  encryptedRate: string;
  shieldedAddress: string;
  epochId: number;
  createdAt: number;
}

export interface BorrowIntent {
  intentId: string;
  borrower: string;
  token: string;
  amount: bigint;
  encryptedMaxRate: string;
  collateralToken: string;
  collateralAmount: bigint;
  status: "pending" | "proposed" | "matched" | "cancelled" | "rejected";
  createdAt: number;
}

export interface MatchedTick {
  lender: string;
  lendIntentId: string;
  amount: bigint;
  rate: number;
}

export interface MatchProposal {
  proposalId: string;
  borrowIntentId: string;
  borrower: string;
  token: string;
  principal: bigint;
  matchedTicks: MatchedTick[];
  effectiveBorrowerRate: number;
  collateralToken: string;
  collateralAmount: bigint;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: number;
  expiresAt: number;
}

export interface Loan {
  loanId: string;
  borrower: string;
  token: string;
  principal: bigint;
  matchedTicks: MatchedTick[];
  effectiveBorrowerRate: number;
  collateralToken: string;
  collateralAmount: bigint;
  maturity: number;
  status: "active" | "repaid" | "defaulted";
  repaidAmount: bigint;
}
