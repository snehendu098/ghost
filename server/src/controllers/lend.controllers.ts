import { Context } from "hono";
import { authenticate } from "../auth";
import { state } from "../state";
import * as externalApi from "../external-api";
import type { DepositSlot, LendIntent } from "../types";

export const initDepositLend = async (c: Context) => {
  try {
    const { account, token, amount } = await c.req.json();

    if (!account || !token || !amount)
      return c.json({ error: "Missing required fields" }, 400);

    state.expireOldSlots();

    const result = await externalApi.generateShieldedAddress();
    const shieldedAddress: string = result.shieldedAddress;

    const slot: DepositSlot = {
      shieldedAddress,
      userId: account.toLowerCase(),
      token: token.toLowerCase(),
      amount: BigInt(amount),
      status: "pending",
      createdAt: Date.now(),
      epochId: state.currentEpoch,
    };

    state.depositSlots.set(shieldedAddress.toLowerCase(), slot);

    return c.json({ shieldedAddress, epochId: state.currentEpoch });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};

export const confirmDepositLend = async (c: Context) => {
  try {
    const { account, shieldedAddress, encryptedRate, timestamp, auth } =
      await c.req.json();

    if (!account || !shieldedAddress || !encryptedRate || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Confirm Deposit",
      { account, shieldedAddress, encryptedRate, timestamp },
      auth,
      account
    );

    const slot = state.depositSlots.get(shieldedAddress.toLowerCase());
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
      shieldedAddress: shieldedAddress.toLowerCase(),
      epochId: state.currentEpoch,
      createdAt: Date.now(),
    };

    state.activeBuffer.set(intentId, intent);

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
    const { account, shieldedAddress, timestamp, auth } = await c.req.json();

    if (!account || !shieldedAddress || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Cancel Lend",
      { account, shieldedAddress, timestamp },
      auth,
      account
    );

    const slot = state.depositSlots.get(shieldedAddress.toLowerCase());
    if (!slot) return c.json({ error: "Slot not found" }, 404);
    if (slot.userId !== account.toLowerCase())
      return c.json({ error: "Not slot owner" }, 403);

    // Find intent in activeBuffer
    let intentId: string | null = null;
    for (const [id, intent] of state.activeBuffer) {
      if (intent.shieldedAddress === shieldedAddress.toLowerCase()) {
        intentId = id;
        break;
      }
    }
    if (!intentId)
      return c.json({ error: "No active intent for this address" }, 409);

    // Pool transfers funds back to user via private transfer
    const transfer = await externalApi.privateTransfer(
      undefined,
      account,
      slot.token,
      slot.amount.toString()
    );

    state.activeBuffer.delete(intentId);
    state.debitBalance(account, slot.token, slot.amount);
    slot.status = "cancelled";

    return c.json({ status: "cancelled", transactionId: transfer.transaction_id });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};
