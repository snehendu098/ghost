# GHOST Protocol

Private P2P lending with tick-based rate discovery on Chainlink CRE.

## Stack
- **Runtime**: Bun (all packages)
- **Server**: Hono framework, in-memory state, port 3000
- **CRE Workflows**: @chainlink/cre-sdk, simulate via `cre workflow simulate`
- **Chain**: Sepolia (11155111), external vault at 0xE588...
- **Encryption**: eciesjs (secp256k1) for sealed rate bids

## Structure
- `server/` — GHOST API (Hono + Bun). Entry: `bun run --hot src/index.ts`
- `ghost-settler/` — CRE workflows (settle-loans, execute-transfers, check-loans)
- `e2e-test/` — end-to-end test scripts run with `bun run src/0N_*.ts`
- `client/` — frontend
- `ARCHITECTURE.md` — full system design doc

## Running
- Server: `cd server && bun run --hot src/index.ts`
- E2E: `cd e2e-test && bun run src/01_transfer-funds.ts` (steps 01-04)
- CRE: `cd ghost-settler && cre workflow simulate ./settle-loans --target=staging-settings --non-interactive --trigger-index=0`

## CRE Rules
- All imports from `@chainlink/cre-sdk` (no subpath exports)
- HTTP: `ConfidentialHTTPClient.sendRequest(runtime, {...}).result()`
- Each workflow has own package.json + config.staging.json
- WASM-compatible: eciesjs v0.4, viem v2, @noble/hashes all work
- Handler returns string: `(runtime: Runtime<Config>, payload: CronPayload): string`

## Key Patterns
- EIP-712 typed-data auth on all user-facing endpoints
- Pool wallet executes all fund movements via external API `/private-transfer`
- Transfers queued in state, CRE polls + executes + confirms
- Rates encrypted client-side with CRE pubkey, decrypted only inside CRE
- Server is "dumb storage" — cannot read encrypted rates

## Conventions
- No ORMs, state is in-memory Maps (server/src/state.ts)
- BigInt for all token amounts
- Addresses lowercased before storage
- Transfer reasons: "cancel-lend" | "cancel-borrow" | "disburse" | "return-collateral" | "return-collateral-repay" | "liquidate"
