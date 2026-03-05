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
} from "../controllers/borrow.controllers";
import {
  getPendingIntents,
  recordMatchProposals,
  expireProposals,
  checkLoans,
} from "../controllers/internal.controllers";
import { repayLoan } from "../controllers/repay.controllers";
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

// Internal (CRE) — x-api-key guarded
ghostRoute.get("/internal/pending-intents", internalAuth, getPendingIntents);
ghostRoute.post("/internal/record-match-proposals", internalAuth, recordMatchProposals);
ghostRoute.post("/internal/expire-proposals", internalAuth, expireProposals);
ghostRoute.post("/internal/check-loans", internalAuth, checkLoans);

export default ghostRoute;
