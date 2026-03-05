import { Context } from "hono";
import { authenticate } from "../auth";
import { state } from "../state";
import * as externalApi from "../external-api";
import type { BorrowIntent } from "../types";

export const submitBorrowIntent = async (c: Context) => {
  try {
    const {
      account,
      token,
      amount,
      collateralToken,
      collateralAmount,
      encryptedMaxRate,
      timestamp,
      auth,
    } = await c.req.json();

    if (
      !account ||
      !token ||
      !amount ||
      !collateralToken ||
      !collateralAmount ||
      !encryptedMaxRate ||
      !timestamp ||
      !auth
    )
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Submit Borrow",
      {
        account,
        token,
        amount,
        collateralToken,
        collateralAmount,
        encryptedMaxRate,
        timestamp,
      },
      auth,
      account
    );

    const intentId = crypto.randomUUID();
    const intent: BorrowIntent = {
      intentId,
      borrower: account.toLowerCase(),
      token: token.toLowerCase(),
      amount: BigInt(amount),
      encryptedMaxRate,
      collateralToken: collateralToken.toLowerCase(),
      collateralAmount: BigInt(collateralAmount),
      status: "pending",
      createdAt: Date.now(),
    };

    state.borrowIntents.set(intentId, intent);

    return c.json({ status: "borrow_intent_created", intentId });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};

export const cancelBorrow = async (c: Context) => {
  try {
    const { account, intentId, timestamp, auth } = await c.req.json();

    if (!account || !intentId || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Cancel Borrow",
      { account, intentId, timestamp },
      auth,
      account
    );

    const intent = state.borrowIntents.get(intentId);
    if (!intent) return c.json({ error: "Intent not found" }, 404);
    if (intent.borrower !== account.toLowerCase())
      return c.json({ error: "Not intent owner" }, 403);
    if (intent.status !== "pending")
      return c.json(
        { error: "Can only cancel pending intents" },
        409
      );

    // Return collateral
    const transfer = await externalApi.privateTransfer(
      undefined,
      account,
      intent.collateralToken,
      intent.collateralAmount.toString()
    );

    intent.status = "cancelled";

    return c.json({
      status: "cancelled",
      transactionId: transfer.transaction_id,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};

export const acceptProposal = async (c: Context) => {
  try {
    const { account, proposalId, timestamp, auth } = await c.req.json();

    if (!account || !proposalId || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Accept Proposal",
      { account, proposalId, timestamp },
      auth,
      account
    );

    const proposal = state.matchProposals.get(proposalId);
    if (!proposal) return c.json({ error: "Proposal not found" }, 404);
    if (proposal.borrower.toLowerCase() !== account.toLowerCase())
      return c.json({ error: "Not proposal owner" }, 403);
    if (proposal.status !== "pending")
      return c.json({ error: "Proposal not pending" }, 409);
    if (Date.now() > proposal.expiresAt)
      return c.json({ error: "Proposal expired" }, 410);

    // Create loan
    const loanId = crypto.randomUUID();
    state.loans.set(loanId, {
      loanId,
      borrower: proposal.borrower,
      token: proposal.token,
      principal: proposal.principal,
      matchedTicks: proposal.matchedTicks,
      effectiveBorrowerRate: proposal.effectiveBorrowerRate,
      collateralToken: proposal.collateralToken,
      collateralAmount: proposal.collateralAmount,
      maturity: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days default
      status: "active",
      repaidAmount: BigInt(0),
    });

    proposal.status = "accepted";

    // Update borrow intent
    const borrowIntent = state.borrowIntents.get(proposal.borrowIntentId);
    if (borrowIntent) borrowIntent.status = "matched";

    // Consume matched lend intents from activeBuffer + debit lender balances
    for (const tick of proposal.matchedTicks) {
      const lendIntent = state.activeBuffer.get(tick.lendIntentId);
      if (lendIntent) {
        if (tick.amount >= lendIntent.amount) {
          state.activeBuffer.delete(tick.lendIntentId);
        } else {
          lendIntent.amount -= tick.amount;
        }
      }
      state.debitBalance(tick.lender, proposal.token, tick.amount);
    }

    // Disburse principal to borrower
    const transfer = await externalApi.privateTransfer(
      undefined,
      proposal.borrower,
      proposal.token,
      proposal.principal.toString()
    );

    return c.json({
      status: "accepted",
      loanId,
      transactionId: transfer.transaction_id,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};

export const rejectProposal = async (c: Context) => {
  try {
    const { account, proposalId, timestamp, auth } = await c.req.json();

    if (!account || !proposalId || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Reject Proposal",
      { account, proposalId, timestamp },
      auth,
      account
    );

    const proposal = state.matchProposals.get(proposalId);
    if (!proposal) return c.json({ error: "Proposal not found" }, 404);
    if (proposal.borrower.toLowerCase() !== account.toLowerCase())
      return c.json({ error: "Not proposal owner" }, 403);
    if (proposal.status !== "pending")
      return c.json({ error: "Proposal not pending" }, 409);

    // Slash 5% collateral (stays in pool), return 95%
    const slashAmount =
      (proposal.collateralAmount * BigInt(5)) / BigInt(100);
    const returnAmount = proposal.collateralAmount - slashAmount;

    const transfer = await externalApi.privateTransfer(
      undefined,
      proposal.borrower,
      proposal.collateralToken,
      returnAmount.toString()
    );

    proposal.status = "rejected";

    // Kill borrow intent
    const borrowIntent = state.borrowIntents.get(proposal.borrowIntentId);
    if (borrowIntent) borrowIntent.status = "rejected";

    // Free matched lend ticks back to activeBuffer
    for (const tick of proposal.matchedTicks) {
      const existing = state.activeBuffer.get(tick.lendIntentId);
      if (existing) {
        existing.amount += tick.amount;
      }
      // If lend intent was fully consumed and deleted, we can't restore it here
      // The CRE should have only locked ticks, not deleted them
    }

    return c.json({
      status: "rejected",
      slashed: slashAmount.toString(),
      returned: returnAmount.toString(),
      transactionId: transfer.transaction_id,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};
