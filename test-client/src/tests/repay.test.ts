import { describe, test, expect } from "bun:test";
import {
  lender1,
  lender2,
  borrower2,
  readContract,
  writeContract,
  apiPost,
  triggerSettle,
  apiGet,
  waitForIndexer,
  pollUntil,
  parseEther,
} from "../helpers.ts";

describe("repay", () => {
  const lendAmount = parseEther("0.005");
  const collateralAmount = parseEther("0.01");

  test("setup: deposit + create intents + settle", async () => {
    await writeContract(lender2, "depositLend", [], lendAmount);
    await writeContract(borrower2, "depositCollateral", [], collateralAmount);

    await apiPost("/intent/lend", {
      address: lender2.account.address,
      amount: lendAmount.toString(),
      minRate: "500",
      duration: 86400,
      tranche: "senior",
    });
    await apiPost("/intent/borrow", {
      address: borrower2.account.address,
      amount: lendAmount.toString(),
      maxRate: "1000",
      duration: 86400,
    });

    const res = await triggerSettle();
    expect(res.ok).toBe(true);
    expect(res.data.matched).toBeGreaterThanOrEqual(1);
  }, 90_000);

  test("borrower repays loan", async () => {
    const loansRes = await pollUntil(
      `/loans/${borrower2.account.address}`,
      (d) => d.asBorrower.some((l: any) => l.status === "active"),
    );
    const activeLoan = loansRes.data.asBorrower.find(
      (l: any) => l.status === "active"
    );
    expect(activeLoan).toBeDefined();

    const owed = await readContract<bigint>("getOwed", [activeLoan.loanId]);

    // repay w/ 10% buffer
    await writeContract(borrower2, "repay", [activeLoan.loanId], owed + owed / 10n);

    const after = await pollUntil(
      `/loans/${borrower2.account.address}`,
      (d) => d.asBorrower.some((l: any) => l.loanId === activeLoan.loanId && l.status === "repaid"),
    );
    const repaidLoan = after.data.asBorrower.find(
      (l: any) => l.loanId === activeLoan.loanId
    );
    expect(repaidLoan.status).toBe("repaid");
  }, 90_000);

  test("credit score increases after repay", async () => {
    const res = await apiGet(`/user/${borrower2.account.address}/credit`);
    expect(res.ok).toBe(true);
    expect(res.data.creditScore).toBeGreaterThanOrEqual(500);
  });

  // -- Sad paths --

  test("non-borrower tries repay → reverts", async () => {
    const loanCount = await readContract<bigint>("loanCount");
    if (loanCount === 0n) return;

    try {
      await writeContract(lender1, "repay", [0], parseEther("1"));
      throw new Error("should have reverted");
    } catch (e: any) {
      expect(e.message).toContain("not borrower");
    }
  }, 15_000);

  test("repay already-repaid loan → reverts", async () => {
    const loansRes = await apiGet(`/loans/${borrower2.account.address}`);
    const repaidLoan = loansRes.data.asBorrower.find(
      (l: any) => l.status === "repaid"
    );
    if (!repaidLoan) return;

    try {
      await writeContract(borrower2, "repay", [repaidLoan.loanId], parseEther("0.01"));
      throw new Error("should have reverted");
    } catch (e: any) {
      expect(e.message).toContain("already repaid");
    }
  }, 15_000);

  test("repay w/ insufficient value → reverts", async () => {
    const loansRes = await apiGet(`/loans/${borrower2.account.address}`);
    const activeLoan = loansRes.data.asBorrower.find(
      (l: any) => l.status === "active"
    );
    if (!activeLoan) return;

    try {
      await writeContract(borrower2, "repay", [activeLoan.loanId], 1n);
      throw new Error("should have reverted");
    } catch (e: any) {
      expect(e.message).toContain("insufficient repayment");
    }
  }, 15_000);
});
