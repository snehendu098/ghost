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
