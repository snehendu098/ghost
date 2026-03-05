import { Context } from "hono";
import { authenticate } from "../auth";
import { state, getCollateralMultiplier } from "../state";
import { getEthPrice } from "../price";
import { config } from "../config";
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
      account,
    );

    // Validate collateral token is gUSD or gETH
    const ct = collateralToken.toLowerCase();
    const isUsdCollateral = ct === config.TOKEN_ADDRESS.toLowerCase();
    const isEthCollateral = ct === config.GETH_ADDRESS.toLowerCase();
    if (!isUsdCollateral && !isEthCollateral)
      return c.json({ error: "Collateral token must be gUSD or gETH" }, 400);

    // Enforce collateral requirement based on credit tier + live price
    const score = state.getCreditScore(account);
    const multiplier = getCollateralMultiplier(score.tier);
    const collateralAmt = BigInt(collateralAmount);
    const borrowAmt = BigInt(amount);
    const ethPrice = isUsdCollateral ? null : await getEthPrice();
    // gUSD collateral: already USD, gETH collateral: convert via price feed
    const collateralValueUsd = isUsdCollateral
      ? Number(collateralAmt) / 1e18
      : (Number(collateralAmt) / 1e18) * ethPrice!;
    const requiredValueUsd = (Number(borrowAmt) / 1e18) * multiplier;

    if (collateralValueUsd < requiredValueUsd) {
      return c.json(
        {
          error: "Insufficient collateral for credit tier",
          tier: score.tier,
          multiplier,
          ethPrice,
          requiredUsd: requiredValueUsd,
          providedUsd: collateralValueUsd,
          provided: collateralAmt.toString(),
        },
        400,
      );
    }

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
      account,
    );

    const intent = state.borrowIntents.get(intentId);
    if (!intent) return c.json({ error: "Intent not found" }, 404);
    if (intent.borrower !== account.toLowerCase())
      return c.json({ error: "Not intent owner" }, 403);
    if (intent.status !== "pending")
      return c.json({ error: "Can only cancel pending intents" }, 409);

    // Queue collateral return for CRE to execute
    const transferId = state.queueTransfer(
      account,
      intent.collateralToken,
      intent.collateralAmount.toString(),
      "cancel-borrow",
    );

    intent.status = "cancelled";

    return c.json({
      status: "cancelled",
      transferId,
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
      account,
    );

    const proposal = state.matchProposals.get(proposalId);
    if (!proposal) return c.json({ error: "Proposal not found" }, 404);
    if (proposal.borrower.toLowerCase() !== account.toLowerCase())
      return c.json({ error: "Not proposal owner" }, 403);
    if (proposal.status !== "pending")
      return c.json({ error: "Proposal not pending" }, 409);
    if (Date.now() > proposal.expiresAt)
      return c.json({ error: "Proposal expired" }, 410);

    // Compute required collateral (X) — locked for loan duration
    const ct = proposal.collateralToken;
    const isUsdCollateral = ct === config.TOKEN_ADDRESS.toLowerCase();
    const score = state.getCreditScore(proposal.borrower);
    const multiplier = getCollateralMultiplier(score.tier);
    const requiredValueUsd = (Number(proposal.principal) / 1e18) * multiplier;
    let requiredCollateral: bigint;
    if (isUsdCollateral) {
      requiredCollateral = BigInt(Math.ceil(requiredValueUsd * 1e18));
    } else {
      const ethPrice = await getEthPrice();
      requiredCollateral = BigInt(Math.ceil((requiredValueUsd / ethPrice) * 1e18));
    }
    // Cap at deposited amount (should never exceed, but safety)
    if (requiredCollateral > proposal.collateralAmount)
      requiredCollateral = proposal.collateralAmount;

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
      requiredCollateral,
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

    // Queue principal disbursement for CRE to execute
    const transferId = state.queueTransfer(
      proposal.borrower,
      proposal.token,
      proposal.principal.toString(),
      "disburse",
    );

    return c.json({
      status: "accepted",
      loanId,
      transferId,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};

export const claimExcessCollateral = async (c: Context) => {
  try {
    const { account, loanId, timestamp, auth } = await c.req.json();

    if (!account || !loanId || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Claim Excess Collateral",
      { account, loanId, timestamp },
      auth,
      account,
    );

    const loan = state.loans.get(loanId);
    if (!loan) return c.json({ error: "Loan not found" }, 404);
    if (loan.borrower !== account.toLowerCase())
      return c.json({ error: "Not loan owner" }, 403);
    if (loan.status !== "active")
      return c.json({ error: "Loan not active" }, 409);

    // X = requiredCollateral (fixed at loan creation), K = excess
    const excess = loan.collateralAmount - loan.requiredCollateral;
    if (excess <= 0n)
      return c.json({
        error: "No excess collateral",
        locked: loan.collateralAmount.toString(),
        required: loan.requiredCollateral.toString(),
      }, 400);

    // Reduce to exactly X, return K
    loan.collateralAmount = loan.requiredCollateral;
    const transferId = state.queueTransfer(
      loan.borrower,
      loan.collateralToken,
      excess.toString(),
      "return-collateral",
    );

    return c.json({
      status: "excess_claimed",
      loanId,
      excessReturned: excess.toString(),
      remainingCollateral: requiredCollateral.toString(),
      transferId,
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
      account,
    );

    const proposal = state.matchProposals.get(proposalId);
    if (!proposal) return c.json({ error: "Proposal not found" }, 404);
    if (proposal.borrower.toLowerCase() !== account.toLowerCase())
      return c.json({ error: "Not proposal owner" }, 403);
    if (proposal.status !== "pending")
      return c.json({ error: "Proposal not pending" }, 409);

    // Slash 5% collateral (stays in pool), return 95%
    const slashAmount = (proposal.collateralAmount * BigInt(5)) / BigInt(100);
    const returnAmount = proposal.collateralAmount - slashAmount;

    // Queue collateral return for CRE to execute
    const transferId = state.queueTransfer(
      proposal.borrower,
      proposal.collateralToken,
      returnAmount.toString(),
      "return-collateral",
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
      transferId,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};
