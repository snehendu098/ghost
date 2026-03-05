import type { DepositSlot, LendIntent, BorrowIntent, MatchProposal, Loan, PendingTransfer, CreditScore, CreditTier } from "./types";

const SLOT_TTL_MS = 10 * 60 * 1000; // 10 minutes

class State {
  depositSlots: Map<string, DepositSlot> = new Map(); // slotId → slot
  activeBuffer: Map<string, LendIntent> = new Map(); // intentId → intent
  balances: Map<string, Map<string, bigint>> = new Map(); // user → token → amount
  borrowIntents: Map<string, BorrowIntent> = new Map(); // intentId → intent
  matchProposals: Map<string, MatchProposal> = new Map(); // proposalId → proposal
  loans: Map<string, Loan> = new Map(); // loanId → loan
  pendingTransfers: Map<string, PendingTransfer> = new Map();
  creditScores: Map<string, CreditScore> = new Map();
  currentEpoch: number = 1;

  queueTransfer(recipient: string, token: string, amount: string, reason: PendingTransfer["reason"]): string {
    const id = crypto.randomUUID();
    this.pendingTransfers.set(id, {
      id,
      recipient: recipient.toLowerCase(),
      token: token.toLowerCase(),
      amount,
      reason,
      createdAt: Date.now(),
      status: "pending",
    });
    return id;
  }

  creditBalance(user: string, token: string, amount: bigint): void {
    const u = user.toLowerCase();
    const t = token.toLowerCase();
    if (!this.balances.has(u)) this.balances.set(u, new Map());
    const m = this.balances.get(u)!;
    m.set(t, (m.get(t) ?? 0n) + amount);
  }

  debitBalance(user: string, token: string, amount: bigint): boolean {
    const bal = this.getBalance(user, token);
    if (bal < amount) return false;
    const u = user.toLowerCase();
    const t = token.toLowerCase();
    this.balances.get(u)!.set(t, bal - amount);
    return true;
  }

  getBalance(user: string, token: string): bigint {
    return (
      this.balances.get(user.toLowerCase())?.get(token.toLowerCase()) ?? 0n
    );
  }

  getCreditScore(user: string): CreditScore {
    const addr = user.toLowerCase();
    let score = this.creditScores.get(addr);
    if (!score) {
      score = { address: addr, tier: "bronze", loansRepaid: 0, loansDefaulted: 0 };
      this.creditScores.set(addr, score);
    }
    return score;
  }

  upgradeTier(user: string): void {
    const score = this.getCreditScore(user);
    const order: CreditTier[] = ["bronze", "silver", "gold", "platinum"];
    const idx = order.indexOf(score.tier);
    if (idx < order.length - 1) score.tier = order[idx + 1];
  }

  downgradeTier(user: string): void {
    const score = this.getCreditScore(user);
    const order: CreditTier[] = ["bronze", "silver", "gold", "platinum"];
    const idx = order.indexOf(score.tier);
    if (idx > 0) score.tier = order[idx - 1];
  }

  expireOldSlots(): number {
    const now = Date.now();
    let expired = 0;
    for (const [addr, slot] of this.depositSlots) {
      if (slot.status === "pending" && now - slot.createdAt > SLOT_TTL_MS) {
        slot.status = "cancelled";
        expired++;
      }
    }
    return expired;
  }
}

export const state = new State();

export function getCollateralMultiplier(tier: CreditTier): number {
  switch (tier) {
    case "platinum": return 1.2;
    case "gold": return 1.5;
    case "silver": return 1.8;
    case "bronze": return 2.0;
  }
}
