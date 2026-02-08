import { decodeEventLog, formatEther, type Address, type TransactionReceipt } from "viem";
import { db } from "../db";
import { loans, lenderPositions, activities } from "../db/schema";
import { eq } from "drizzle-orm";
import { readContract, GHOST_LENDING_ABI } from "../lib/contract";

export async function processLendDeposited(lender: Address, amount: bigint, txHash: string) {
  console.log(`[webhook] LendDeposited: ${lender} ${formatEther(amount)}`);
  await db.insert(activities).values({
    address: lender,
    type: "deposit_lend",
    amount: formatEther(amount),
    txHash,
  });
}

export async function processLendWithdrawn(lender: Address, amount: bigint, txHash: string) {
  console.log(`[webhook] LendWithdrawn: ${lender} ${formatEther(amount)}`);
  await db.insert(activities).values({
    address: lender,
    type: "withdraw_lend",
    amount: formatEther(amount),
    txHash,
  });
}

export async function processCollateralDeposited(borrower: Address, amount: bigint, txHash: string) {
  console.log(`[webhook] CollateralDeposited: ${borrower} ${formatEther(amount)}`);
  await db.insert(activities).values({
    address: borrower,
    type: "deposit_collateral",
    amount: formatEther(amount),
    txHash,
  });
}

export async function processCollateralWithdrawn(borrower: Address, amount: bigint, txHash: string) {
  console.log(`[webhook] CollateralWithdrawn: ${borrower} ${formatEther(amount)}`);
  await db.insert(activities).values({
    address: borrower,
    type: "withdraw_collateral",
    amount: formatEther(amount),
    txHash,
  });
}

export async function processLoanCreated(loanId: bigint, borrower: Address, principal: bigint, txHash: string) {
  console.log(`[event] LoanCreated: #${loanId} borrower=${borrower} principal=${formatEther(principal)}`);
  try {
    // Idempotency: skip if already processed (Circle webhook may duplicate)
    const existing = await db.select({ id: loans.id }).from(loans).where(eq(loans.loanId, Number(loanId)));
    if (existing.length > 0) {
      console.log(`[event] LoanCreated #${loanId}: already in DB, skipping`);
      return;
    }

    const loanData = await readContract<readonly [Address, bigint, bigint, bigint, bigint, bigint, boolean, boolean]>(
      "getLoan",
      [loanId],
    );
    const lenders = await readContract<readonly [readonly Address[], readonly bigint[], readonly Address[], readonly bigint[]]>(
      "getLoanLenders",
      [loanId],
    );

    await db.insert(loans).values({
      loanId: Number(loanId),
      borrower,
      principal: formatEther(principal),
      collateralAmount: formatEther(loanData[2]),
      rate: Number(loanData[3]),
      duration: Number(loanData[4]),
      startTime: new Date(Number(loanData[5]) * 1000),
      seniorLenders: [...lenders[0]] as string[],
      seniorAmounts: [...lenders[1]].map((a) => formatEther(a)),
      juniorLenders: [...lenders[2]] as string[],
      juniorAmounts: [...lenders[3]].map((a) => formatEther(a)),
      status: "active",
    }).onConflictDoNothing({ target: loans.loanId });

    for (let i = 0; i < lenders[0].length; i++) {
      await db.insert(lenderPositions).values({
        loanId: Number(loanId),
        lender: lenders[0][i],
        amount: formatEther(lenders[1][i]),
        tranche: "senior",
      });
    }
    for (let i = 0; i < lenders[2].length; i++) {
      await db.insert(lenderPositions).values({
        loanId: Number(loanId),
        lender: lenders[2][i],
        amount: formatEther(lenders[3][i]),
        tranche: "junior",
      });
    }

    await db.insert(activities).values({
      address: borrower,
      type: "loan_created",
      amount: formatEther(principal),
      txHash,
      details: { loanId: Number(loanId) },
    });
  } catch (e) {
    console.error("[event] Error processing LoanCreated:", e);
  }
}

export async function processLoanRepaid(loanId: bigint, borrower: Address, totalPaid: bigint, txHash: string) {
  console.log(`[webhook] LoanRepaid: #${loanId}`);
  await db.update(loans).set({ status: "repaid" }).where(eq(loans.loanId, Number(loanId)));
  await db.update(lenderPositions).set({ status: "repaid" }).where(eq(lenderPositions.loanId, Number(loanId)));
  await db.insert(activities).values({
    address: borrower,
    type: "loan_repaid",
    amount: formatEther(totalPaid),
    txHash,
    details: { loanId: Number(loanId) },
  });
}

export async function processLoanDefaulted(loanId: bigint, borrower: Address, txHash: string) {
  console.log(`[webhook] LoanDefaulted: #${loanId}`);
  await db.update(loans).set({ status: "defaulted" }).where(eq(loans.loanId, Number(loanId)));
  await db.update(lenderPositions).set({ status: "defaulted" }).where(eq(lenderPositions.loanId, Number(loanId)));
  await db.insert(activities).values({
    address: borrower,
    type: "loan_defaulted",
    txHash,
    details: { loanId: Number(loanId) },
  });
}

/** Decode + process all contract events from a transaction receipt (for server-initiated txs) */
export async function processReceiptLogs(receipt: TransactionReceipt) {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: GHOST_LENDING_ABI,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        data: log.data,
      });
      const args = decoded.args as Record<string, any>;
      const txHash = receipt.transactionHash;

      switch (decoded.eventName) {
        case "LoanCreated":
          await processLoanCreated(args.loanId, args.borrower, args.principal, txHash);
          break;
        case "LoanRepaid":
          await processLoanRepaid(args.loanId, args.borrower, args.totalPaid, txHash);
          break;
        case "LoanDefaulted":
          await processLoanDefaulted(args.loanId, args.borrower, txHash);
          break;
      }
    } catch (e) {
      // Log decode failures for debugging (expected for non-contract logs)
      console.debug("[processReceiptLogs] decode skip:", (e as Error).message?.slice(0, 80));
    }
  }
}
