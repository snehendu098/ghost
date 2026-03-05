import { Context } from "hono";
import { authenticate } from "../auth";
import { state } from "../state";
import type { DepositSlot, LendIntent } from "../types";

export const initDepositLend = async (c: Context) => {
  try {
    const { account, token, amount } = await c.req.json();

    if (!account || !token || !amount)
      return c.json({ error: "Missing required fields" }, 400);

    state.expireOldSlots();

    const slotId = crypto.randomUUID();

    const slot: DepositSlot = {
      slotId,
      userId: account.toLowerCase(),
      token: token.toLowerCase(),
      amount: BigInt(amount),
      status: "pending",
      createdAt: Date.now(),
      epochId: state.currentEpoch,
    };

    state.depositSlots.set(slotId, slot);

    return c.json({ slotId, epochId: state.currentEpoch });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};

export const confirmDepositLend = async (c: Context) => {
  try {
    const { account, slotId, encryptedRate, timestamp, auth } =
      await c.req.json();

    if (!account || !slotId || !encryptedRate || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Confirm Deposit",
      { account, slotId, encryptedRate, timestamp },
      auth,
      account
    );

    const slot = state.depositSlots.get(slotId);
    if (!slot) return c.json({ error: "Slot not found" }, 404);
    if (slot.status === "cancelled")
      return c.json({ error: "Slot expired" }, 410);
    if (slot.status === "confirmed")
      return c.json({ error: "Slot already confirmed" }, 409);
    if (slot.userId !== account.toLowerCase())
      return c.json({ error: "Not slot owner" }, 403);

    // Check TTL
    if (Date.now() - slot.createdAt > 10 * 60 * 1000) {
      slot.status = "cancelled";
      return c.json({ error: "Slot expired" }, 410);
    }

    slot.encryptedRate = encryptedRate;
    slot.status = "confirmed";

    state.creditBalance(account, slot.token, slot.amount);

    const intentId = crypto.randomUUID();
    const intent: LendIntent = {
      intentId,
      userId: account.toLowerCase(),
      token: slot.token,
      amount: slot.amount,
      encryptedRate,
      epochId: state.currentEpoch,
      createdAt: Date.now(),
    };

    state.activeBuffer.set(intentId, intent);
    slot.intentId = intentId;

    return c.json({
      status: "sealed_bid_accepted",
      intentId,
      epochId: state.currentEpoch,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};

export const cancelLend = async (c: Context) => {
  try {
    const { account, slotId, timestamp, auth } = await c.req.json();

    if (!account || !slotId || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Cancel Lend",
      { account, slotId, timestamp },
      auth,
      account
    );

    const slot = state.depositSlots.get(slotId);
    if (!slot) return c.json({ error: "Slot not found" }, 404);
    if (slot.userId !== account.toLowerCase())
      return c.json({ error: "Not slot owner" }, 403);

    if (!slot.intentId || !state.activeBuffer.has(slot.intentId))
      return c.json({ error: "No active intent for this slot" }, 409);

    // Queue transfer for CRE to execute
    const transferId = state.queueTransfer(
      account,
      slot.token,
      slot.amount.toString(),
      "cancel-lend"
    );

    state.activeBuffer.delete(slot.intentId);
    state.debitBalance(account, slot.token, slot.amount);
    slot.status = "cancelled";

    return c.json({ status: "cancelled", transferId });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};
