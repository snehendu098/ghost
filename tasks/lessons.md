# Lessons Learned

## Always log errors in catch blocks
- Silent catch blocks (`catch {}`) hide the real error and waste hours debugging the wrong thing
- The real bug was "senior insufficient" revert — a unit conversion error — but the silent catch made it look like an event decoding issue
- Rule: NEVER use empty catch blocks. At minimum `console.error`

## Double parseEther bug
- DB stores intent amounts as wei strings (from `parseEther("0.005").toString()`)
- clearMarket() was calling `parseEther(amount)` on already-wei strings → 5e15 became 5e33
- Fix: use `BigInt(amount)` when DB values are already in wei
- Convention: establish and document whether DB stores wei or ether ONCE, enforce everywhere

## Idempotency in event handlers
- Circle webhook may deliver events already processed from direct DB writes
- processLoanCreated: check if loan exists before inserting (prevents duplicate lenderPositions/activities)
- DB `onConflictDoNothing` only protects the specific table, not related inserts

## Test architecture
- Server-initiated txs (settle, liquidate): server has receipt → write DB directly
- User-initiated txs (deposit, repay, withdraw): depend on Circle webhook OR sync endpoint
- Circle webhooks: fast for deposits (~seconds), slow for loan events (>30s)
