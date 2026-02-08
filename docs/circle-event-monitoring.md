# Circle Event Monitoring — Replacing Polling Indexer

## Problem

The server indexer uses viem's `watchContractEvent` to poll Arc testnet for contract events (LoanCreated, LoanRepaid, LoanDefaulted, etc). This has issues:

1. **Polling latency** — `watchContractEvent` polls every ~4s. Events can take 10-30s to show up in DB after tx confirmation
2. **Missed events** — if server restarts between polls, events in that gap are lost
3. **Test flakiness** — 3 integration tests fail because loan data isn't in DB fast enough after settle/liquidate txs. Required adding `pollUntil` retry logic with 30s timeouts
4. **RPC rate limits** — 7 separate event watchers each poll independently, multiplying RPC calls
5. **No historical backfill** — if indexer starts late, past events are never captured

## Solution: Circle Smart Contract Platform Event Monitoring

Circle offers push-based event monitoring for **any contract** (doesn't need to be deployed via Circle). It sends webhook notifications when events fire on-chain.

### How it works

1. **Import contract** — register GhostLending by address + chain with Circle API
2. **Create event monitors** — one per event signature (e.g. `LoanCreated(uint256,address,uint256)`)
3. **Receive webhooks** — Circle POSTs event data to server endpoint in real-time
4. **Fetch history** — query Circle API for past events (solves backfill problem)

### Setup steps

```ts
// 1. Import contract
await circleContractSdk.importContract({
  address: "0xdD996e8419Ce81Be3D60bF8490D9C3a6C590eb92",
  blockchain: "ARC-TESTNET",
  name: "GhostLending",
  description: "Ghost lending protocol",
  idempotencyKey: crypto.randomUUID(),
});

// 2. Create monitors for each event
const events = [
  "LendDeposited(address,uint256)",
  "LendWithdrawn(address,uint256)",
  "CollateralDeposited(address,uint256)",
  "CollateralWithdrawn(address,uint256)",
  "LoanCreated(uint256,address,uint256)",
  "LoanRepaid(uint256,address,uint256)",
  "LoanDefaulted(uint256,address)",
];

for (const sig of events) {
  await circleContractSdk.createEventMonitor({
    blockchain: "ARC-TESTNET",
    contractAddress: "0xdD996e8419Ce81Be3D60bF8490D9C3a6C590eb92",
    eventSignature: sig,
    idempotencyKey: crypto.randomUUID(),
  });
}
```

### Server webhook handler

Replace `startIndexer()` with a POST endpoint that Circle hits:

```
POST /webhook/circle — receives event notifications, writes to DB
```

### Requirements

- Circle Developer Account + API key
- Publicly accessible webhook URL (ngrok for dev)
- Configure webhook in Circle Developer Console, filter to `contracts.EventLog`

### Benefits over current approach

| | viem polling | Circle webhooks |
|---|---|---|
| Latency | 4-30s | near real-time |
| Missed events | possible on restart | Circle retries delivery |
| Historical data | no backfill | API query for past events |
| RPC usage | 7 poll loops | zero (Circle handles it) |
| Test reliability | needs pollUntil hacks | data arrives before test checks |

## Webhook Latency Problem & Hybrid Fix

### Problem discovered during implementation

Circle webhooks for **deposit events** (`LendDeposited`, `CollateralDeposited`) arrive fast enough (~seconds). But **loan events** (`LoanCreated`, `LoanRepaid`, `LoanDefaulted`) arrive too slowly (>30s), causing test timeouts.

Root cause: after `/trigger/settle` calls `executeLoan()` on-chain, the test immediately polls `/loans/:address` waiting for the loan in DB. Circle webhook hasn't arrived yet → 30s `pollUntil` timeout.

### Solution: hybrid approach

**Server-initiated txs** (`executeLoan`, `liquidate` in trigger routes) already have the tx receipt. Decode events from the receipt and write to DB inline — zero latency.

**User-initiated txs** (deposits, withdrawals from frontend) → Circle webhook handles these.

### Key files

| File | Role |
|---|---|
| `server/src/services/event-handlers.ts` | 7 handler functions + `processReceiptLogs(receipt)` helper |
| `server/src/routes/webhook.ts` | `POST /webhook/circle` — decodes Circle payload, routes to handlers |
| `server/src/routes/trigger.ts` | calls `processReceiptLogs(receipt)` after `executeLoan`/`liquidate` |
| `server/src/services/indexer.ts` | old polling indexer, kept as fallback but not imported |

### Idempotency

Circle may still deliver webhooks for events already processed from receipts. `processLoanCreated` uses `.onConflictDoNothing({ target: loans.loanId })` so duplicate inserts are safe.

### Dev setup

1. `ngrok http 3000` → get forwarding URL
2. Circle Console → set webhook URL to `https://<ngrok>/webhook/circle`
3. Filter to `contracts.EventLog` notification type
4. `bun run dev` in server/
