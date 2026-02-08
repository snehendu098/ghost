import { describe, test, expect } from "bun:test";
import {
  lender2,
  borrower2,
  writeContract,
  apiPost,
  apiGet,
  triggerSettle,
  triggerLiquidate,
  waitForIndexer,
  pollUntil,
  sleep,
  api,
  parseEther,
} from "../helpers.ts";

describe("liquidate", () => {
  const lendAmount = parseEther("0.003");
  const collateralAmount = parseEther("0.006");

  test("setup: create loan w/ 1s duration", async () => {
    await writeContract(lender2, "depositLend", [], lendAmount);
    await writeContract(borrower2, "depositCollateral", [], collateralAmount);

    await apiPost("/intent/lend", {
      address: lender2.account.address,
      amount: lendAmount.toString(),
      minRate: "500",
      duration: 1, // 1 second — overdue almost immediately
      tranche: "senior",
    });
    await apiPost("/intent/borrow", {
      address: borrower2.account.address,
      amount: lendAmount.toString(),
      maxRate: "1000",
      duration: 1,
    });

    const res = await triggerSettle();
    expect(res.ok).toBe(true);
    expect(res.data.matched).toBeGreaterThanOrEqual(1);

    // wait for indexer to write the loan to DB
    await pollUntil(
      `/loans/${borrower2.account.address}`,
      (d) => d.asBorrower.some((l: any) => l.status === "active"),
    );
  }, 90_000);

  test("wait for loan to become overdue then liquidate", async () => {
    // loan has 1s duration, already overdue by now
    await sleep(2000);

    const res = await triggerLiquidate();
    expect(res.ok).toBe(true);
    expect(res.data.liquidated).toBeGreaterThanOrEqual(1);

    const loansRes = await pollUntil(
      `/loans/${borrower2.account.address}`,
      (d) => d.asBorrower.some((l: any) => l.status === "defaulted"),
    );
    const defaultedLoan = loansRes.data.asBorrower.find(
      (l: any) => l.status === "defaulted"
    );
    expect(defaultedLoan).toBeDefined();
  }, 60_000);

  test("credit score decreased after default", async () => {
    const res = await apiGet(`/user/${borrower2.account.address}/credit`);
    expect(res.ok).toBe(true);
    expect(res.data.creditScore).toBeLessThanOrEqual(500);
  });

  // -- Sad paths --

  test("POST /trigger/liquidate w/o API key → 401", async () => {
    const res = await api("/trigger/liquidate", { method: "POST" });
    expect(res.error).toBe("unauthorized");
  });

  test("liquidate w/ no overdue loans → liquidated=0", async () => {
    const res = await triggerLiquidate();
    expect(res.ok).toBe(true);
    expect(res.data.liquidated).toBe(0);
  }, 30_000);
});
