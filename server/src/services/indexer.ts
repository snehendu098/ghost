import { formatEther, type Address, type Log } from "viem";
import { db } from "../db";
import { loans, lenderPositions, activities } from "../db/schema";
import { eq } from "drizzle-orm";
import { publicClient, readContract, GHOST_LENDING_ABI, contractAddress } from "../lib/contract";

export async function startIndexer() {
  if (!contractAddress) {
    console.log("[indexer] CONTRACT_ADDRESS not set, skipping");
    return;
  }

  console.log("[indexer] listening to events on", contractAddress);

  // LendDeposited
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    eventName: "LendDeposited",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { lender, amount } = log.args as { lender: Address; amount: bigint };
        console.log(`[indexer] LendDeposited: ${lender} ${formatEther(amount)}`);
        await db.insert(activities).values({
          address: lender,
          type: "deposit_lend",
          amount: formatEther(amount),
          txHash: log.transactionHash,
        });
      }
    },
  });

  // LendWithdrawn
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    eventName: "LendWithdrawn",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { lender, amount } = log.args as { lender: Address; amount: bigint };
        console.log(`[indexer] LendWithdrawn: ${lender} ${formatEther(amount)}`);
        await db.insert(activities).values({
          address: lender,
          type: "withdraw_lend",
          amount: formatEther(amount),
          txHash: log.transactionHash,
        });
      }
    },
  });

  // CollateralDeposited
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    eventName: "CollateralDeposited",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { borrower, amount } = log.args as { borrower: Address; amount: bigint };
        console.log(`[indexer] CollateralDeposited: ${borrower} ${formatEther(amount)}`);
        await db.insert(activities).values({
          address: borrower,
          type: "deposit_collateral",
          amount: formatEther(amount),
          txHash: log.transactionHash,
        });
      }
    },
  });

  // CollateralWithdrawn
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    eventName: "CollateralWithdrawn",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { borrower, amount } = log.args as { borrower: Address; amount: bigint };
        console.log(`[indexer] CollateralWithdrawn: ${borrower} ${formatEther(amount)}`);
        await db.insert(activities).values({
          address: borrower,
          type: "withdraw_collateral",
          amount: formatEther(amount),
          txHash: log.transactionHash,
        });
      }
    },
  });

  // LoanCreated
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    eventName: "LoanCreated",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { loanId, borrower, principal } = log.args as {
          loanId: bigint;
          borrower: Address;
          principal: bigint;
        };
        console.log(`[indexer] LoanCreated: #${loanId} borrower=${borrower} principal=${formatEther(principal)}`);

        try {
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
          });

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
            txHash: log.transactionHash,
            details: { loanId: Number(loanId) },
          });
        } catch (e) {
          console.error("[indexer] Error processing LoanCreated:", e);
        }
      }
    },
  });

  // LoanRepaid
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    eventName: "LoanRepaid",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { loanId, borrower, totalPaid } = log.args as {
          loanId: bigint;
          borrower: Address;
          totalPaid: bigint;
        };
        console.log(`[indexer] LoanRepaid: #${loanId}`);
        await db.update(loans).set({ status: "repaid" }).where(eq(loans.loanId, Number(loanId)));
        await db.update(lenderPositions).set({ status: "repaid" }).where(eq(lenderPositions.loanId, Number(loanId)));
        await db.insert(activities).values({
          address: borrower,
          type: "loan_repaid",
          amount: formatEther(totalPaid),
          txHash: log.transactionHash,
          details: { loanId: Number(loanId) },
        });
      }
    },
  });

  // LoanDefaulted
  publicClient.watchContractEvent({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    eventName: "LoanDefaulted",
    onLogs: async (logs) => {
      for (const log of logs) {
        const { loanId, borrower } = log.args as {
          loanId: bigint;
          borrower: Address;
        };
        console.log(`[indexer] LoanDefaulted: #${loanId}`);
        await db.update(loans).set({ status: "defaulted" }).where(eq(loans.loanId, Number(loanId)));
        await db.update(lenderPositions).set({ status: "defaulted" }).where(eq(lenderPositions.loanId, Number(loanId)));
        await db.insert(activities).values({
          address: borrower,
          type: "loan_defaulted",
          txHash: log.transactionHash,
          details: { loanId: Number(loanId) },
        });
      }
    },
  });
}
