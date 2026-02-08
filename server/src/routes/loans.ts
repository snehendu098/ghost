import { Hono } from "hono";
import { db } from "../db";
import { loans, lenderPositions } from "../db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "../lib/responses";
import { readContract } from "../lib/contract";
import type { Address } from "viem";

export const loanRoutes = new Hono();

// GET /loans/:address
loanRoutes.get("/loans/:address", async (c) => {
  try {
    const address = c.req.param("address");
    const borrowerLoans = await db.select().from(loans)
      .where(eq(loans.borrower, address));

    const lenderPos = await db.select().from(lenderPositions)
      .where(eq(lenderPositions.lender, address));

    return ok(c, { asBorrower: borrowerLoans, asLender: lenderPos });
  } catch (e: any) {
    return err(c, e.message, 500);
  }
});

// POST /loans/sync/:loanId — sync loan status from on-chain state
loanRoutes.post("/loans/sync/:loanId", async (c) => {
  try {
    const loanId = Number(c.req.param("loanId"));
    const data = await readContract<readonly [Address, bigint, bigint, bigint, bigint, bigint, boolean, boolean]>(
      "getLoan", [loanId],
    );
    const [, , , , , , repaid, defaulted] = data;
    const status = repaid ? "repaid" : defaulted ? "defaulted" : "active";

    await db.update(loans).set({ status }).where(eq(loans.loanId, loanId));
    await db.update(lenderPositions).set({ status }).where(eq(lenderPositions.loanId, loanId));

    return ok(c, { loanId, status });
  } catch (e: any) {
    return err(c, e.message, 500);
  }
});

// GET /loans/overdue
loanRoutes.get("/loans/overdue", async (c) => {
  try {
    const activeLoans = await db.select().from(loans)
      .where(eq(loans.status, "active"));

    const now = new Date();
    const overdue = activeLoans.filter((loan) => {
      const endTime = new Date(loan.startTime.getTime() + loan.duration * 1000);
      return now > endTime;
    });

    return ok(c, overdue);
  } catch (e: any) {
    return err(c, e.message, 500);
  }
});
