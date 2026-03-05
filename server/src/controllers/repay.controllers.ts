import { Context } from "hono";
import { authenticate } from "../auth";
import { state } from "../state";
import * as externalApi from "../external-api";

export const repayLoan = async (c: Context) => {
  try {
    const { account, loanId, amount, timestamp, auth } = await c.req.json();

    if (!account || !loanId || !amount || !timestamp || !auth)
      return c.json({ error: "Missing required fields" }, 400);

    authenticate(
      "Repay Loan",
      { account, loanId, amount, timestamp },
      auth,
      account
    );

    const loan = state.loans.get(loanId);
    if (!loan) return c.json({ error: "Loan not found" }, 404);
    if (loan.borrower !== account.toLowerCase())
      return c.json({ error: "Not loan owner" }, 403);
    if (loan.status !== "active")
      return c.json({ error: "Loan not active" }, 409);

    // Calculate total owed: sum of each tick's (amount * (1 + rate))
    let totalOwed = BigInt(0);
    for (const tick of loan.matchedTicks) {
      // rate is annual decimal (e.g. 0.05 = 5%). Apply to tick amount.
      const interest = BigInt(
        Math.floor(Number(tick.amount) * tick.rate)
      );
      totalOwed += tick.amount + interest;
    }

    const repayAmount = BigInt(amount);
    if (repayAmount < totalOwed)
      return c.json(
        {
          error: "Insufficient repayment",
          required: totalOwed.toString(),
          provided: repayAmount.toString(),
        },
        400
      );

    // Credit each lender at their individual tick rate (discriminatory pricing)
    for (const tick of loan.matchedTicks) {
      const interest = BigInt(
        Math.floor(Number(tick.amount) * tick.rate)
      );
      state.creditBalance(tick.lender, loan.token, tick.amount + interest);
    }

    // Return collateral to borrower
    const transfer = await externalApi.privateTransfer(
      undefined,
      loan.borrower,
      loan.collateralToken,
      loan.collateralAmount.toString()
    );

    loan.status = "repaid";
    loan.repaidAmount = repayAmount;

    return c.json({
      status: "repaid",
      loanId,
      totalPaid: repayAmount.toString(),
      transactionId: transfer.transaction_id,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 401);
  }
};
