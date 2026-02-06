# Fix ClearNode deposit tracking + close/withdraw script

## Part 1: Deposited event handler
- [x] Add `Deposited` case to switch in `handleBlockChainEvent` (custody.go:165-171)
- [x] Implement `handleDeposited` method (custody.go:331-394)
- [x] Go build passes
- [x] Docker image rebuilt + ClearNode running

## Part 2: Close channels script
- [x] Create `channel/src/utils/close-channels.ts`
- [x] Add `close-channels` script to package.json
- [x] TypeScript transpiles cleanly

## Verification
- [x] ClearNode starts w/o errors
- [ ] `bun run setup` → channels w/ non-zero amounts
- [ ] `bun run start` → swaps execute
- [ ] `bun run close-channels` → funds returned
- [ ] `bun run balances` → confirms funds back
