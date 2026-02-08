import { describe, test, expect } from "bun:test";
import {
  lender1,
  borrower1,
  readContract,
  writeContract,
  apiGet,
  waitForIndexer,
  parseEther,
} from "../helpers.ts";

describe("deposits", () => {
  const amount = parseEther("0.01");

  test("lender deposits → getLenderBalance increases", async () => {
    const before = await readContract<bigint>("getLenderBalance", [lender1.account.address]);
    await writeContract(lender1, "depositLend", [], amount);
    const after = await readContract<bigint>("getLenderBalance", [lender1.account.address]);
    expect(after - before).toBe(amount);
  }, 30_000);

  test("borrower deposits collateral → getBorrowerCollateral increases", async () => {
    const before = await readContract<bigint>("getBorrowerCollateral", [borrower1.account.address]);
    await writeContract(borrower1, "depositCollateral", [], amount);
    const after = await readContract<bigint>("getBorrowerCollateral", [borrower1.account.address]);
    expect(after - before).toBe(amount);
  }, 30_000);

  test("activity shows up after deposit", async () => {
    await waitForIndexer(5000);
    const res = await apiGet(`/user/${lender1.account.address}/activity`);
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  }, 15_000);

  test("deposit 0 reverts", async () => {
    try {
      await writeContract(lender1, "depositLend", [], 0n);
      throw new Error("should have reverted");
    } catch (e: any) {
      expect(e.message).toContain("zero amount");
    }
  }, 15_000);
});
