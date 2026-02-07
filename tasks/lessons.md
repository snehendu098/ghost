# Lessons Learned

## 2026-02-06: Multi-sig requires atomic sig array

Broker requires ALL participant sigs in ONE message's `sig` array. SDK's `signRequestMessage` does `message.sig = [signature]` (replaces, never appends). Fix: bypass it — use `NitroliteRPC.createRequest()` to get unsigned msg, collect sigs via `Promise.all(signers.map(s => s(request.req!)))`, set `request.sig = [sig1, sig2]`.

## 2026-02-06: Wire protocol uses snake_case

Clearnode responses use snake_case (`ledger_balances`, `app_session_id`, `challenge_message`), not camelCase. Always use snake_case when reading response fields.

## 2026-02-06: RPCAppStateIntent is string enum

`intent` param on `submit_app_state` must be string `"operate"` (use `RPCAppStateIntent.Operate`), NOT numeric `0`. Numeric causes "failed to parse parameters".

## 2026-02-06: closeChannel requires stateData at top level + always needs on-chain close

Two bugs in channel close:
1. `nitroliteClient.closeChannel({ finalState })` fails silently — SDK reads `params.stateData` (top-level), NOT `params.finalState.data`. Must pass: `{ stateData: state.stateData, finalState }`.
2. Never skip on-chain close even when allocations are 0. Clearnode only marks channel closed after seeing the on-chain `Closed` event. Without it, "open channel with broker already exists" error on next setup.

## 2026-02-06: Custody withdrawal uses custody balance, not channel allocations

When channel on-chain allocation is 0 (depositAndCreateChannel pattern), close-channels can't settle on-chain. Must withdraw based on `getAccountBalance()` from custody, not from channel allocation amounts. The virtual ledger swap balances don't settle on-chain — custody returns original deposits.

## 2026-02-06: Close allocations need all participants per asset

`close_app_session` requires every asset to be "fully redistributed" — must include zero-amount entries for participants who don't hold that asset. Same for `submit_app_state`. Use 4 entries: `[{asset, 0, sellerAddr}, {asset, amount, buyerAddr}, {asset2, amount, sellerAddr}, {asset2, 0, buyerAddr}]`.

## 2026-02-06: channel.RawAmount vs virtual ledger

`channel.RawAmount` tracks the **on-chain channel state allocation**, NOT total deposited amount. For `depositAndCreateChannel`, the on-chain allocation is 0 (deposit goes to custody pool). `applyDeposit` must only do ledger entries — must NOT update `RawAmount`. Updating it triggers `ensureWalletHasAllAllocationsEmpty` guard which blocks app session creation.

Key: `RawAmount` only changes via `handleCreated` (initial), `handleResized` (on-chain resize), `handleClosed` (set to 0).
