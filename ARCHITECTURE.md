# GHOST Protocol — Private P2P Lending on Chainlink's Compliant Private Transfer API

> Fixed-rate, sealed-bid lending overlay built entirely on top of
> the external Compliant Private Transfer Demo vault + API.
> No custom vault contract. No on-chain settlement. All fund custody is external.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  EXTERNAL LAYER  (not ours — provided by Chainlink demo)            │
│                                                                     │
│  Vault: 0xE588a6c73933BFD66Af9b4A07d48bcE59c0D2d13  (Sepolia)       │
│  API:   convergence2026-token-api.cldev.cloud                       │
│                                                                     │
│  Provides: token deploy, vault register, deposit, withdraw,         │
│            private-transfer, balances, shielded-address, txs        │
│  Auth:    EIP-712 typed-data signatures                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  private-transfer / balances / withdraw
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  GHOST API SERVER  (Hono + Bun)                                     │
│                                                                     │
│  Lending overlay: pool wallet, sealed-bid auction,                  │
│  intent buffering, loan state, credit scoring                       │
│                                                                     │
│  Holds POOL_PRIVATE_KEY — a regular wallet on the external API.     │
│  Moves funds via external private-transfer calls.                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  ConfidentialHTTPClient
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  CRE WORKFLOWS  (Chainlink Confidential Compute)                    │
│                                                                     │
│  Pure HTTP cron triggers — no on-chain writes, no ABI encoding.     │
│  epoch-settlement: POST /internal/run-auction   (every 5 min)       │
│  liquidation:      POST /internal/check-loans   (every 60s)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## How It Works — User Journey

### 1. On-chain setup (one-time)

Deploy GhostToken, register it on the external vault, deposit tokens via on-chain tx.

### 2. Deposit into GHOST

User calls the external API `private-transfer` to send tokens to the GHOST pool wallet.
Then POSTs to GHOST API `/deposit` with proof. API verifies incoming transfer, credits balance.

### 3. Submit lending/borrowing intent

- `POST /lend-intent` — sealed bid: amount, minRate, tranche (senior/junior)
- `POST /borrow-intent` — sealed bid: amount, maxRate, collateral

Intents buffered until epoch close. Nobody sees others' bids.

### 4. Epoch settlement (CRE cron)

Every 5 min CRE fires `POST /internal/run-auction`.
API swaps double-buffers, runs uniform-price auction, matches lend↔borrow.
Pool wallet disburses matched funds to borrowers via external `private-transfer`.

### 5. Repayment

Borrower does external `private-transfer` to pool → POSTs `POST /repay` to GHOST API.
API verifies transfer, marks loan repaid, credits lender balance + interest.

### 6. Withdrawal

`POST /withdraw` → API calls external API `withdraw` from pool on behalf of user.
Tokens return to user's on-chain wallet.

---

## Pool Wallet

GHOST holds a single `POOL_PRIVATE_KEY` env var. This creates a regular wallet address on the external Compliant Private Transfer API. **All fund custody lives in the external vault** — GHOST never holds tokens directly.

Pool operations:

- **Receive deposits**: users `private-transfer` tokens to pool address
- **Disburse loans**: pool `private-transfer` tokens to borrower
- **Process withdrawals**: pool calls external API `withdraw` for user
- **Check balance**: pool queries external API `balances`

---

## API Server

Hono HTTP server (Bun runtime). All private state in-memory.

### Core Modules

| Module           | File                      | Role                                                                                                                                        |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Config**       | `api/src/config.ts`       | Env vars: RPC_URL, CHAIN_ID, API_KEY, POOL_PRIVATE_KEY, EXTERNAL_API_URL, EXTERNAL_VAULT_ADDRESS, TOKEN_ADDRESS                             |
| **Auth**         | `api/src/auth.ts`         | EIP-712 signature verification, timestamp window check                                                                                      |
| **State**        | `api/src/state.ts`        | Singleton: balances, intents (double-buffered), loans, credit scores, shielded addresses                                                    |
| **Pool**         | `api/src/pool.ts`         | Pool wallet ops: getPoolBalance, transferFromPool, verifyIncomingTransfer                                                                   |
| **External API** | `api/src/external-api.ts` | Wraps external Compliant Private Transfer API: getBalance, privateTransfer, getTransactions, requestWithdrawTicket, generateShieldedAddress |
| **Auction**      | `api/src/auction.ts`      | Sealed-bid matching engine: uniform-price, tranche waterfall                                                                                |
| **Credit**       | `api/src/credit.ts`       | Credit scoring: +10 repay, -20 default, floor 0, cap 200                                                                                    |
| **Types**        | `api/src/types.ts`        | Domain interfaces: LendIntent, BorrowIntent, Loan, Transaction, EpochResult                                                                 |

### Routes

**User-facing (POST, EIP-712 authed):**

| Route                    | File                         | What it does                                             |
| ------------------------ | ---------------------------- | -------------------------------------------------------- |
| `POST /deposit`          | `routes/deposit.ts`          | Verify incoming private-transfer to pool, credit balance |
| `POST /balances`         | `routes/balances.ts`         | Query private GHOST balances                             |
| `POST /lend-intent`      | `routes/lend-intent.ts`      | Submit sealed lending bid                                |
| `POST /borrow-intent`    | `routes/borrow-intent.ts`    | Submit sealed borrow bid                                 |
| `POST /repay`            | `routes/repay.ts`            | Verify repayment transfer to pool, update loan           |
| `POST /withdraw`         | `routes/withdraw.ts`         | Withdraw from GHOST → external API withdraw to user      |
| `POST /shielded-address` | `routes/shielded-address.ts` | Generate unlinkable address                              |
| `POST /positions`        | `routes/positions.ts`        | View active loans + pending intents                      |
| `POST /transactions`     | `routes/transactions.ts`     | History with cursor pagination                           |
| `GET /epoch`             | `routes/epoch.ts`            | Current epoch number + status (no auth)                  |
| `GET /`                  | `index.ts`                   | Health check + pool address                              |

**Internal (API-key authed, called by CRE):**

| Route                        | File                 | What it does                                              |
| ---------------------------- | -------------------- | --------------------------------------------------------- |
| `POST /internal/run-auction` | `routes/internal.ts` | Swap buffers, run matching, disburse to borrowers         |
| `POST /internal/check-loans` | `routes/internal.ts` | Return loans with health ratios, flag undercollateralized |

---

## Sealed-Bid Auction Mechanism

```
Lend Intent: (amount, minRate, tranche)     Borrow Intent: (amount, maxRate, collateral)
  Alice: 500 gUSDC, >=5%, Senior              Charlie: 600 gUSDC, <=10%, 2 gWETH
  Bob:   300 gUSDC, >=8%, Junior

              Supply Curve                    Demand Curve
  Rate ^                                Rate ^
   10% |                                 10% | ########
    8% |         #### (Bob Jr)            8% | ########
    7% | - - - - - - - r* - - - -         7% | ######## <- clearing rate
    5% | ######## (Alice Sr)              5% | ########
       +-------------------> $              +-------------------> $
       0   500    800                      0        600

  Clearing rate r* = 7% (maximizes matched volume at $600)

  Senior (Alice): 500 matched first, lower effective risk
  Junior (Bob):   100 matched, absorbs losses first, higher yield
  Charlie:        600 borrowed at 7% uniform rate

  Tranche waterfall on default:
    Loss -> Junior absorbs first -> then Senior
```

---

## Token Flow

```
DEPOSIT PHASE (external API private-transfer)
  Alice --500 tokens--> pool wallet     (private-transfer to pool)
  Alice --> POST /deposit to GHOST API  (verify + credit balance)
  Bob   --300 tokens--> pool wallet
  Charlie--collateral-> pool wallet

SETTLEMENT PHASE (CRE cron -> /internal/run-auction)
  Auction matches 600 lent -> 600 borrowed
  Pool --600 tokens--> Charlie           (private-transfer from pool)

REPAYMENT PHASE
  Charlie --630 tokens--> pool wallet    (600 principal + 30 interest)
  Charlie --> POST /repay to GHOST API   (verify + update loan)

WITHDRAWAL PHASE
  Alice --> POST /withdraw to GHOST API
  Pool calls external API withdraw -> 521 tokens to Alice on-chain
  Bob --> POST /withdraw -> 109 tokens to Bob on-chain
  Charlie --> POST /withdraw -> collateral returned on-chain

LIQUIDATION (alternate path)
  If collateral value drops below threshold
  CRE /internal/check-loans detects unhealthy loan
  Pool seizes collateral -> Junior absorbs loss first -> Senior protected
```

---

## CRE Workflows

Pure HTTP triggers. No on-chain writes, no ABI encoding, no EVMClient.

### Epoch Settlement (`cre/src/workflows/epoch-settlement/`)

```
CronTrigger (every 5 min)
  -> ConfidentialHTTPClient POST /internal/run-auction
     (request/response encrypted — individual DON nodes can't see it)
  -> API swaps intent buffers, runs auction, disburses via external API
  -> Returns: { epochId, clearingRate, totalMatched, seniorMatched, juniorMatched }
  -> If totalMatched == 0, skip
```

### Liquidation Monitor (`cre/src/workflows/liquidation/`)

```
CronTrigger (every 60s)
  -> ConfidentialHTTPClient POST /internal/check-loans
  -> API checks all loans against collateral prices
  -> Returns: { loans[], unhealthy[] }
  -> If unhealthy.length > 0, liquidation handled API-side
```

### Why CRE matters

1. **ConfidentialHTTPClient** — HTTP calls encrypted end-to-end. Individual DON nodes can't see bids, loans, or balances.
2. **Vault DON Secrets** — `GHOST_API_KEY` stored as threshold-encrypted secret. No single node knows the full key.
3. **Decentralized cron** — settlement and monitoring run reliably without centralized infrastructure.

---

## Privacy Model

| Data                                       | On-Chain (Public)    | GHOST API (Private)      |
| ------------------------------------------ | -------------------- | ------------------------ |
| Token deploy + vault registration          | Visible              | —                        |
| Vault deposits (into external vault)       | Visible (deposit tx) | —                        |
| Private transfers (deposit/repay/disburse) | Hidden               | Known                    |
| Individual GHOST balances                  | Hidden               | Tracked per user         |
| Bid rates & amounts                        | Hidden               | Decrypted at epoch close |
| Who lent to whom                           | Hidden               | Known                    |
| Loan terms & health                        | Hidden               | Monitored                |
| Liquidation events                         | Hidden               | Handled API-side         |

**Key insight**: On-chain only sees token deploys and vault deposits. Everything else — individual transfers, balances, intents, loans, settlements, liquidations — is private within the external API + GHOST API layer.

---

## Chainlink Services Used

| Service                            | How GHOST Uses It                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| **CRE Workflows**                  | Epoch settlement (CronTrigger 5min), liquidation monitoring (CronTrigger 60s)     |
| **CRE ConfidentialHTTPClient**     | Calls GHOST API privately — request/response hidden from nodes                    |
| **CRE Vault DON Secrets**          | API key as threshold-encrypted secret, injected via `{{.GHOST_API_KEY}}` template |
| **ACE (PolicyEngine)**             | Compliance check on token deposits to external vault                              |
| **Compliant Private Transfer API** | Base layer: private transfers, balances, withdrawals, shielded addresses          |

---

## Double Buffer: Zero Downtime

```
Epoch 1:  [Collecting intents...]  [Auction + Settlement]  [Done]
Epoch 2:              [Collecting intents...]  [Auction + Settlement]
Epoch 3:                          [Collecting intents...]
                      ^                        ^
                 Epoch 1 closes           Epoch 2 closes
                 Epoch 2 ALREADY open     Epoch 3 ALREADY open
```

At any moment there's always an open buffer accepting intents. Users never wait.

---

## Directory Structure

```
ghost/
├── ARCHITECTURE.md                  <- this file
│
├── api/                             <- GHOST API Server (Hono + Bun)
│   ├── package.json
│   ├── bunfig.toml
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 <- Hono server entry, route mounting
│       ├── config.ts                <- Env vars + defaults
│       ├── auth.ts                  <- EIP-712 signature verification
│       ├── state.ts                 <- Private state (balances, intents, loans)
│       ├── pool.ts                  <- Pool wallet ops via external API
│       ├── external-api.ts          <- Wraps external Compliant Private Transfer API
│       ├── auction.ts               <- Sealed-bid auction matching engine
│       ├── credit.ts                <- Credit score computation
│       ├── types.ts                 <- Domain interfaces
│       └── routes/
│           ├── deposit.ts           <- POST /deposit
│           ├── balances.ts          <- POST /balances
│           ├── lend-intent.ts       <- POST /lend-intent
│           ├── borrow-intent.ts     <- POST /borrow-intent
│           ├── repay.ts             <- POST /repay
│           ├── withdraw.ts          <- POST /withdraw
│           ├── shielded-address.ts  <- POST /shielded-address
│           ├── positions.ts         <- POST /positions
│           ├── transactions.ts      <- POST /transactions
│           ├── epoch.ts             <- GET /epoch
│           └── internal.ts          <- POST /internal/run-auction, /check-loans
│
├── contracts/                       <- Solidity (Foundry) — token only
│   ├── foundry.toml
│   ├── remappings.txt
│   ├── src/
│   │   └── GhostToken.sol           <- ERC20 test token
│   └── script/
│       ├── 01_DeployToken.s.sol      <- Deploy GhostToken
│       ├── 02_DeployPolicyEngine.s.sol <- Deploy ACE PolicyEngine
│       └── SetupAll.s.sol            <- All-in-one deployment
│
├── cre/                             <- CRE Workflows (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/workflows/
│       ├── epoch-settlement/
│       │   ├── index.ts             <- ConfidentialHTTP -> /internal/run-auction
│       │   ├── config.json
│       │   └── workflow.yaml
│       └── liquidation/
│           ├── index.ts             <- ConfidentialHTTP -> /internal/check-loans
│           ├── config.json
│           └── workflow.yaml
│
└── scripts/                         <- CLI tools (Bun + ethers.js)
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── common.ts                <- Wallet, EIP-712 helpers, API POST helper
        ├── setup-pool.ts            <- Register pool wallet on external vault
        ├── deposit-lend.ts          <- Deposit to external vault + transfer to pool + lend intent
        ├── deposit-borrow.ts        <- Deposit collateral + transfer to pool + borrow intent
        ├── repay.ts                 <- Transfer repayment to pool + notify API
        ├── withdraw.ts              <- Request withdrawal from GHOST
        ├── check-balances.ts        <- Query GHOST balances
        └── check-positions.ts       <- Query active positions
```

---

## Environment Variables

### GHOST API (`ghost/api/.env`)

| Var                      | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| `POOL_PRIVATE_KEY`       | Private key for pool wallet (required)                                           |
| `TOKEN_ADDRESS`          | Deployed GhostToken address (required)                                           |
| `EXTERNAL_API_URL`       | External API base URL (default: `https://convergence2026-token-api.cldev.cloud`) |
| `EXTERNAL_VAULT_ADDRESS` | External vault contract (default: `0xE588...`)                                   |
| `RPC_URL`                | Sepolia RPC (default: `http://127.0.0.1:8545`)                                   |
| `CHAIN_ID`               | Chain ID (default: `11155111`)                                                   |
| `API_KEY`                | Key for CRE internal endpoints                                                   |
| `PORT`                   | Server port (default: `3000`)                                                    |

### CLI Scripts (`ghost/scripts/.env`)

| Var             | Description             |
| --------------- | ----------------------- |
| `PRIVATE_KEY`   | User wallet private key |
| `GHOST_API_URL` | GHOST API server URL    |
| `TOKEN_ADDRESS` | GhostToken address      |
