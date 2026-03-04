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
