import type { DepositSlot, LendIntent } from "./types";

const SLOT_TTL_MS = 10 * 60 * 1000; // 10 minutes

class State {
  depositSlots: Map<string, DepositSlot> = new Map(); // shieldedAddr → slot
  activeBuffer: Map<string, LendIntent> = new Map(); // intentId → intent
  balances: Map<string, Map<string, bigint>> = new Map(); // user → token → amount
  currentEpoch: number = 1;

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
