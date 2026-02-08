import { describe, test, expect } from "bun:test";
import {
  lender1,
  borrower1,
  readContract,
  writeContract,
  apiPost,
  apiGet,
  triggerSettle,
  pollUntil,
  api,
  parseEther,
} from "../helpers.ts";

describe("settle", () => {
  const lendAmount = parseEther("0.005");
  const collateralAmount = parseEther("0.01"); // 200% for default 500 score

  test("setup: deposit lend + collateral", async () => {
    await writeContract(lender1, "depositLend", [], lendAmount);
    await writeContract(borrower1, "depositCollateral", [], collateralAmount);

    const lb = await readContract<bigint>("getLenderBalance", [lender1.account.address]);
    const bc = await readContract<bigint>("getBorrowerCollateral", [borrower1.account.address]);
    expect(lb).toBeGreaterThanOrEqual(lendAmount);
    expect(bc).toBeGreaterThanOrEqual(collateralAmount);
  }, 30_000);

  let lendIntentId: number;
  let borrowIntentId: number;

  test("create matching intents", async () => {
    const lendRes = await apiPost("/intent/lend", {
      address: lender1.account.address,
      amount: lendAmount.toString(),
      minRate: "500",
      duration: 86400,
      tranche: "senior",
    });
    expect(lendRes.ok).toBe(true);
    lendIntentId = lendRes.data.id;

    const borrowRes = await apiPost("/intent/borrow", {
      address: borrower1.account.address,
      amount: lendAmount.toString(),
      maxRate: "1000",
      duration: 86400,
    });
    expect(borrowRes.ok).toBe(true);
    borrowIntentId = borrowRes.data.id;
  });

  test("POST /trigger/settle → matched >= 1", async () => {
    const res = await triggerSettle();
    expect(res.ok).toBe(true);
    expect(res.data.matched).toBeGreaterThanOrEqual(1);
  }, 60_000);

  test("loan appears in DB", async () => {
    const res = await pollUntil(
      `/loans/${borrower1.account.address}`,
      (d) => d.asBorrower.length > 0,
    );
    expect(res.data.asBorrower.length).toBeGreaterThanOrEqual(1);
  }, 45_000);

  test("lender position appears", async () => {
    const res = await apiGet(`/user/${lender1.account.address}/lends`);
    expect(res.ok).toBe(true);
  });

  // -- Sad paths --

  test("POST /trigger/settle w/o API key → 401", async () => {
    const res = await api("/trigger/settle", { method: "POST" });
    expect(res.error).toBe("unauthorized");
  });

  test("POST /trigger/settle w/ wrong API key → 401", async () => {
    const res = await api("/trigger/settle", {
      method: "POST",
      headers: { "x-api-key": "wrong-key" },
    });
    expect(res.error).toBe("unauthorized");
  });

  test("settle w/ no matching intents → matched=0", async () => {
    const res = await triggerSettle();
    expect(res.ok).toBe(true);
    expect(res.data.matched).toBe(0);
  }, 30_000);
});
