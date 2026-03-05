import { Context } from "hono";
import { state } from "../state";
import * as externalApi from "../external-api";
import type { MatchProposal } from "../types";

export const getPendingIntents = async (c: Context) => {
  // Active lends not locked in pending proposals
  const lockedLendIds = new Set<string>();
  for (const proposal of Array.from(state.matchProposals.values())) {
    if (proposal.status === "pending") {
      for (const tick of proposal.matchedTicks) {
        lockedLendIds.add(tick.lendIntentId);
      }
    }
  }

  const lendIntents = Array.from(state.activeBuffer.values())
    .filter((l) => !lockedLendIds.has(l.intentId))
    .map((l) => ({
      ...l,
      amount: l.amount.toString(),
    }));

  const borrowIntents = Array.from(state.borrowIntents.values())
    .filter((b) => b.status === "pending")
    .map((b) => ({
      ...b,
      amount: b.amount.toString(),
      collateralAmount: b.collateralAmount.toString(),
    }));

  return c.json({ lendIntents, borrowIntents });
};

export const recordMatchProposals = async (c: Context) => {
  const { proposals } = await c.req.json();

  if (!Array.isArray(proposals))
    return c.json({ error: "proposals must be an array" }, 400);

  let recorded = 0;
  for (const p of proposals) {
    const proposal: MatchProposal = {
      proposalId: p.proposalId ?? crypto.randomUUID(),
      borrowIntentId: p.borrowIntentId,
      borrower: p.borrower.toLowerCase(),
      token: p.token.toLowerCase(),
      principal: BigInt(p.principal),
      matchedTicks: p.matchedTicks.map((t: any) => ({
        lender: t.lender.toLowerCase(),
        lendIntentId: t.lendIntentId,
        amount: BigInt(t.amount),
        rate: Number(t.rate),
      })),
      effectiveBorrowerRate: Number(p.effectiveBorrowerRate),
      collateralToken: p.collateralToken.toLowerCase(),
      collateralAmount: BigInt(p.collateralAmount),
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    };

    state.matchProposals.set(proposal.proposalId, proposal);

    // Set borrow intent to "proposed"
    const borrowIntent = state.borrowIntents.get(proposal.borrowIntentId);
    if (borrowIntent) borrowIntent.status = "proposed";

    recorded++;
  }

  return c.json({ recorded });
};

export const expireProposals = async (c: Context) => {
  const now = Date.now();
  let autoAccepted = 0;
  const errors: string[] = [];

  for (const proposal of Array.from(state.matchProposals.values())) {
    if (proposal.status !== "pending" || now <= proposal.expiresAt) continue;

    try {
      // Auto-accept: create loan
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
        maturity: Date.now() + 30 * 24 * 60 * 60 * 1000,
        status: "active",
        repaidAmount: BigInt(0),
      });

      proposal.status = "accepted";

      const borrowIntent = state.borrowIntents.get(proposal.borrowIntentId);
      if (borrowIntent) borrowIntent.status = "matched";

      // Consume lend ticks + debit lender balances
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

      // Disburse principal
      await externalApi.privateTransfer(
        undefined,
        proposal.borrower,
        proposal.token,
        proposal.principal.toString()
      );

      autoAccepted++;
    } catch (err: any) {
      errors.push(`${proposal.proposalId}: ${err.message}`);
    }
  }

  return c.json({ autoAccepted, errors: errors.length ? errors : undefined });
};

export const checkLoans = async (c: Context) => {
  const loans = Array.from(state.loans.values())
    .filter((l) => l.status === "active")
    .map((l) => ({
      ...l,
      principal: l.principal.toString(),
      collateralAmount: l.collateralAmount.toString(),
      repaidAmount: l.repaidAmount.toString(),
      matchedTicks: l.matchedTicks.map((t: { lender: string; lendIntentId: string; amount: bigint; rate: number }) => ({
        ...t,
        amount: t.amount.toString(),
      })),
    }));

  return c.json({ loans });
};
