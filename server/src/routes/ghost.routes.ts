import { Hono } from "hono";
import {
  initDepositLend,
  confirmDepositLend,
  cancelLend,
} from "../controllers/lend.controllers";
import {
  submitBorrowIntent,
  cancelBorrow,
  acceptProposal,
  rejectProposal,
  claimExcessCollateral,
} from "../controllers/borrow.controllers";
import {
  getPendingIntents,
  recordMatchProposals,
  expireProposals,
  checkLoans,
  getPendingTransfers,
  confirmTransfers,
  liquidateLoans,
} from "../controllers/internal.controllers";
import { repayLoan } from "../controllers/repay.controllers";
import { state, getCollateralMultiplier } from "../state";
import { getEthPrice } from "../price";
import { config } from "../config";
import type { Context, Next } from "hono";

const ghostRoute = new Hono();

// Internal auth middleware
const internalAuth = async (c: Context, next: Next) => {
  if (!config.INTERNAL_API_KEY) return next();
  const key = c.req.header("x-api-key");
  if (key !== config.INTERNAL_API_KEY)
    return c.json({ error: "Unauthorized" }, 401);
  return next();
};

// Lend (user-facing)
ghostRoute.post("/deposit-lend/init", initDepositLend);
ghostRoute.post("/deposit-lend/confirm", confirmDepositLend);
ghostRoute.post("/cancel-lend", cancelLend);

// Borrow (user-facing)
ghostRoute.post("/borrow-intent", submitBorrowIntent);
ghostRoute.post("/cancel-borrow", cancelBorrow);
ghostRoute.post("/accept-proposal", acceptProposal);
ghostRoute.post("/reject-proposal", rejectProposal);
ghostRoute.post("/repay", repayLoan);
ghostRoute.post("/claim-excess-collateral", claimExcessCollateral);

// Internal (CRE) — x-api-key guarded
ghostRoute.get("/internal/pending-intents", internalAuth, getPendingIntents);
ghostRoute.post("/internal/record-match-proposals", internalAuth, recordMatchProposals);
ghostRoute.post("/internal/expire-proposals", internalAuth, expireProposals);
ghostRoute.post("/internal/check-loans", internalAuth, checkLoans);
ghostRoute.get("/internal/pending-transfers", internalAuth, getPendingTransfers);
ghostRoute.post("/internal/confirm-transfers", internalAuth, confirmTransfers);
ghostRoute.post("/internal/liquidate-loans", internalAuth, liquidateLoans);

// Public
ghostRoute.get("/collateral-quote", async (c: Context) => {
  const account = c.req.query("account");
  const token = c.req.query("token");
  const amount = c.req.query("amount");
  const collateralToken = c.req.query("collateralToken");

  if (!account || !token || !amount || !collateralToken)
    return c.json({ error: "Required query params: account, token, amount, collateralToken" }, 400);

  const ct = collateralToken.toLowerCase();
  const isUsdCollateral = ct === config.TOKEN_ADDRESS.toLowerCase();
  const isEthCollateral = ct === config.GETH_ADDRESS.toLowerCase();
  if (!isUsdCollateral && !isEthCollateral)
    return c.json({ error: "collateralToken must be gUSD or gETH" }, 400);

  const score = state.getCreditScore(account);
  const multiplier = getCollateralMultiplier(score.tier);
  const borrowAmt = BigInt(amount);
  const requiredValueUsd = (Number(borrowAmt) / 1e18) * multiplier;
  const ethPrice = isEthCollateral ? await getEthPrice() : null;

  const requiredCollateral = isUsdCollateral
    ? BigInt(Math.ceil(requiredValueUsd * 1e18))
    : BigInt(Math.ceil((requiredValueUsd / ethPrice!) * 1e18));

  return c.json({
    tier: score.tier,
    multiplier,
    ethPrice,
    requiredCollateral: requiredCollateral.toString(),
    requiredValueUsd,
  });
});

ghostRoute.get("/lender-status/:address", (c: Context) => {
  const addr = c.req.param("address").toLowerCase();

  // Build intentId → slotId lookup
  const intentToSlot = new Map<string, string>();
  for (const [slotId, slot] of state.depositSlots) {
    if (slot.intentId) intentToSlot.set(slot.intentId, slotId);
  }

  // Active lend intents
  const activeLends = [...state.activeBuffer.values()]
    .filter((i) => i.userId === addr)
    .map((i) => ({
      intentId: i.intentId,
      slotId: intentToSlot.get(i.intentId) ?? "",
      token: i.token,
      amount: i.amount.toString(),
      createdAt: i.createdAt,
    }));

  // Loans where this address is a lender (can appear in multiple ticks)
  const activeLoans: any[] = [];
  const completedLoans: any[] = [];
  for (const loan of state.loans.values()) {
    const ticks = loan.matchedTicks.filter((t) => t.lender === addr);
    if (ticks.length === 0) continue;
    const lenderPrincipal = ticks.reduce((s, t) => s + t.amount, 0n);
    const weightedRate =
      ticks.reduce((s, t) => s + t.rate * Number(t.amount), 0) /
      Number(lenderPrincipal);
    const expectedPayout =
      lenderPrincipal + BigInt(Math.floor(Number(lenderPrincipal) * weightedRate));

    if (loan.status === "active") {
      activeLoans.push({
        loanId: loan.loanId,
        principal: lenderPrincipal.toString(),
        rate: weightedRate,
        expectedPayout: expectedPayout.toString(),
        maturity: loan.maturity,
        maturityDate: new Date(loan.maturity).toISOString(),
        borrower: loan.borrower,
      });
    } else {
      completedLoans.push({
        loanId: loan.loanId,
        principal: lenderPrincipal.toString(),
        rate: weightedRate,
        status: loan.status,
      });
    }
  }

  // Transfers to this lender
  const pendingPayouts: any[] = [];
  const completedPayouts: any[] = [];
  for (const t of state.pendingTransfers.values()) {
    if (t.recipient !== addr) continue;
    const entry = { id: t.id, amount: t.amount, token: t.token, reason: t.reason };
    if (t.status === "pending") pendingPayouts.push(entry);
    else if (t.status === "completed") completedPayouts.push(entry);
  }

  return c.json({ address: addr, activeLends, activeLoans, completedLoans, pendingPayouts, completedPayouts });
});

ghostRoute.get("/borrower-status/:address", (c: Context) => {
  const addr = c.req.param("address").toLowerCase();

  // Pending borrow intents (not yet matched)
  const pendingIntents = [...state.borrowIntents.values()]
    .filter((i) => i.borrower === addr && (i.status === "pending" || i.status === "proposed"))
    .map((i) => ({
      intentId: i.intentId,
      token: i.token,
      amount: i.amount.toString(),
      collateralToken: i.collateralToken,
      collateralAmount: i.collateralAmount.toString(),
      status: i.status,
      createdAt: i.createdAt,
    }));

  // Pending proposals awaiting acceptance
  const pendingProposals = [...state.matchProposals.values()]
    .filter((p) => p.borrower === addr && p.status === "pending")
    .map((p) => ({
      proposalId: p.proposalId,
      token: p.token,
      principal: p.principal.toString(),
      effectiveRate: p.effectiveBorrowerRate,
      collateralToken: p.collateralToken,
      collateralAmount: p.collateralAmount.toString(),
      expiresAt: p.expiresAt,
    }));

  // Loans
  const activeLoans: any[] = [];
  const completedLoans: any[] = [];
  for (const loan of state.loans.values()) {
    if (loan.borrower !== addr) continue;
    const totalDue = loan.principal + BigInt(Math.floor(Number(loan.principal) * loan.effectiveBorrowerRate));

    if (loan.status === "active") {
      activeLoans.push({
        loanId: loan.loanId,
        token: loan.token,
        principal: loan.principal.toString(),
        effectiveRate: loan.effectiveBorrowerRate,
        totalDue: totalDue.toString(),
        repaidAmount: loan.repaidAmount.toString(),
        collateralToken: loan.collateralToken,
        collateralAmount: loan.collateralAmount.toString(),
        requiredCollateral: loan.requiredCollateral.toString(),
        excessCollateral: (loan.collateralAmount - loan.requiredCollateral).toString(),
        maturity: loan.maturity,
        maturityDate: new Date(loan.maturity).toISOString(),
      });
    } else {
      completedLoans.push({
        loanId: loan.loanId,
        token: loan.token,
        principal: loan.principal.toString(),
        effectiveRate: loan.effectiveBorrowerRate,
        collateralToken: loan.collateralToken,
        collateralAmount: loan.collateralAmount.toString(),
        status: loan.status,
      });
    }
  }

  // Transfers back to borrower (collateral returns, etc.)
  const pendingTransfers: any[] = [];
  const completedTransfers: any[] = [];
  for (const t of state.pendingTransfers.values()) {
    if (t.recipient !== addr) continue;
    const entry = { id: t.id, amount: t.amount, token: t.token, reason: t.reason };
    if (t.status === "pending") pendingTransfers.push(entry);
    else if (t.status === "completed") completedTransfers.push(entry);
  }

  return c.json({ address: addr, pendingIntents, pendingProposals, activeLoans, completedLoans, pendingTransfers, completedTransfers });
});

ghostRoute.get("/credit-score/:address", async (c: Context) => {
  const address = c.req.param("address");
  const score = state.getCreditScore(address);
  const ethPrice = await getEthPrice();
  return c.json({
    tier: score.tier,
    loansRepaid: score.loansRepaid,
    loansDefaulted: score.loansDefaulted,
    collateralMultiplier: getCollateralMultiplier(score.tier),
    ethPrice,
  });
});

// Swap quote — returns amountOut based on live ETH price
ghostRoute.get("/swap-quote", async (c: Context) => {
  const tokenIn = c.req.query("tokenIn");
  const tokenOut = c.req.query("tokenOut");
  const amountIn = c.req.query("amountIn");

  if (!tokenIn || !tokenOut || !amountIn)
    return c.json({ error: "Required: tokenIn, tokenOut, amountIn" }, 400);

  if (tokenIn.toLowerCase() === tokenOut.toLowerCase())
    return c.json({ error: "tokenIn and tokenOut must be different" }, 400);

  const gusd = config.TOKEN_ADDRESS.toLowerCase();
  const geth = config.GETH_ADDRESS.toLowerCase();

  const inLower = tokenIn.toLowerCase();
  const outLower = tokenOut.toLowerCase();

  if (![gusd, geth].includes(inLower) || ![gusd, geth].includes(outLower))
    return c.json({ error: "Only gUSD and gETH supported" }, 400);

  const ethPrice = await getEthPrice();
  const amtIn = BigInt(amountIn);

  let amountOut: bigint;
  if (inLower === gusd && outLower === geth) {
    // gUSD -> gETH: amountOut = amountIn / ethPrice
    amountOut = (amtIn * BigInt(1e18)) / BigInt(Math.round(ethPrice * 1e18));
  } else {
    // gETH -> gUSD: amountOut = amountIn * ethPrice
    amountOut = (amtIn * BigInt(Math.round(ethPrice * 1e18))) / BigInt(1e18);
  }

  return c.json({
    tokenIn,
    tokenOut,
    amountIn: amtIn.toString(),
    amountOut: amountOut.toString(),
    ethPrice,
    rate: inLower === gusd ? `1 gUSD = ${(1 / ethPrice).toFixed(8)} gETH` : `1 gETH = ${ethPrice.toFixed(2)} gUSD`,
  });
});

export default ghostRoute;
