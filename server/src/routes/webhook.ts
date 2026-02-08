import { Hono } from "hono";
import { decodeEventLog, type Address } from "viem";
import { GHOST_LENDING_ABI } from "../lib/contract";
import {
  processLendDeposited,
  processLendWithdrawn,
  processCollateralDeposited,
  processCollateralWithdrawn,
  processLoanCreated,
  processLoanRepaid,
  processLoanDefaulted,
} from "../services/event-handlers";

export const webhookRoutes = new Hono();

// Circle SCP webhook payload shape
interface CircleWebhookPayload {
  subscriptionId: string;
  notificationId: string;
  notificationType: string;
  notification: {
    contractAddress: string;
    blockchain: string;
    txHash: string;
    userOpHash: string;
    eventName: string;
    topics: string[];
    data: string;
  };
  timestamp: string;
  version: number;
}

webhookRoutes.post("/webhook/circle", async (c) => {
  const payload = await c.req.json<CircleWebhookPayload>();

  // Only handle contract event logs
  if (payload.notificationType !== "contracts.eventLog") {
    return c.json({ ok: true, skipped: true });
  }

  const { txHash, topics, data } = payload.notification;

  try {
    const decoded = decodeEventLog({
      abi: GHOST_LENDING_ABI,
      topics: topics as [`0x${string}`, ...`0x${string}`[]],
      data: data as `0x${string}`,
    });

    const args = decoded.args as Record<string, any>;

    switch (decoded.eventName) {
      case "LendDeposited":
        await processLendDeposited(args.lender as Address, args.amount, txHash);
        break;
      case "LendWithdrawn":
        await processLendWithdrawn(args.lender as Address, args.amount, txHash);
        break;
      case "CollateralDeposited":
        await processCollateralDeposited(args.borrower as Address, args.amount, txHash);
        break;
      case "CollateralWithdrawn":
        await processCollateralWithdrawn(args.borrower as Address, args.amount, txHash);
        break;
      case "LoanCreated":
        await processLoanCreated(args.loanId, args.borrower as Address, args.principal, txHash);
        break;
      case "LoanRepaid":
        await processLoanRepaid(args.loanId, args.borrower as Address, args.totalPaid, txHash);
        break;
      case "LoanDefaulted":
        await processLoanDefaulted(args.loanId, args.borrower as Address, txHash);
        break;
      default:
        console.log(`[webhook] Unknown event: ${decoded.eventName}`);
    }
  } catch (e) {
    console.error("[webhook] Failed to decode event:", e);
  }

  // Always 200 — Circle expects fast ack
  return c.json({ ok: true });
});
