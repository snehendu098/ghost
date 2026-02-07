# Cross-Token Settlement

## Changes
- [x] `session.ts` — finalize() returns `RPCAppSessionAllocation[]`
- [x] `channel.ts` — export `CreateChannelResponse` + `buildCreateChannelParams`
- [x] `settle.ts` — `createChannelRPC` on CloseClient, `assetToToken` helper, Phase 2 withdrawal channels
- [x] `index.ts` — wire `finalAllocations` through
- [x] TypeScript compiles clean

## Verification
- [ ] `bun src/index.ts --skip-channels` (if channels exist)
- [ ] Post-swap ledger correct (A has USDC, D has ETH)
- [ ] Final on-chain balances show swapped tokens
- [ ] No errors during withdrawal channel create/close
