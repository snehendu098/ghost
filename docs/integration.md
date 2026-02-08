# Ghost Protocol — Integration & API Reference

Base URL: `http://localhost:3000` (dev) | Chain: Arc Testnet (5042002) | Native token: USDC (payable)

---

## Quick Start

```
1. User deposits on-chain (depositLend / depositCollateral)
2. User submits intent to server (POST /intent/lend or /intent/borrow)
3. Runner triggers /trigger/settle → clearMarket() matches + executes loans
4. User repays on-chain → events auto-index to DB
5. Runner triggers /trigger/liquidate for overdue loans
```

---

## On-Chain Functions (Client Calls Directly)

Contract: `GhostLending.sol` on Arc Testnet (`CONTRACT_ADDRESS` env)

### Lender Actions

```solidity
// Deposit USDC to lend pool (send value as msg.value)
function depositLend() external payable

// Withdraw from lend pool
function withdrawLend(uint256 amount) external

// Repay loan (send owed amount as msg.value)
function repay(uint256 loanId) external payable
```

### Borrower Actions

```solidity
// Deposit collateral (send value as msg.value)
function depositCollateral() external payable

// Withdraw excess collateral
function withdrawCollateral(uint256 amount) external
```

### Read Functions

```solidity
function getLenderBalance(address) view returns (uint256)
function getBorrowerCollateral(address) view returns (uint256)
function getCreditScore(address) view returns (uint256)        // 0-1000, default 500
function getRequiredCollateral(address, uint256 principal) view returns (uint256)
function getLoan(uint256 loanId) view returns (
  address borrower, uint256 principal, uint256 collateral,
  uint256 rate, uint256 duration, uint256 startTime,
  bool repaid, bool defaulted
)
function getLoanLenders(uint256 loanId) view returns (
  address[] seniorLenders, uint256[] seniorAmounts,
  address[] juniorLenders, uint256[] juniorAmounts
)
function getOwed(uint256 loanId) view returns (uint256)
function isOverdue(uint256 loanId) view returns (bool)
function loanCount() view returns (uint256)
```

### Events

```solidity
event LendDeposited(address indexed lender, uint256 amount)
event LendWithdrawn(address indexed lender, uint256 amount)
event CollateralDeposited(address indexed borrower, uint256 amount)
event CollateralWithdrawn(address indexed borrower, uint256 amount)
event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 principal)
event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalPaid)
event LoanDefaulted(uint256 indexed loanId, address indexed borrower)
```

### Credit Score & Collateral Tiers

| Score Range | Collateral Required | Score Delta |
|-------------|-------------------|-------------|
| 0–299       | 200%              | Repay: +50, Default: -150 |
| 300–599     | 150%              | |
| 600–799     | 120%              | |
| 800–1000    | 100%              | |

Default score: 500. Capped at 0–1000.

Interest: `(principal * rate * elapsed) / (10000 * 365 days)` — rate in basis points (500 = 5% annual).

---

## API Reference

All responses follow: `{ ok: true, data: ... }` or `{ ok: false, error: "message" }`

### Health

#### `GET /health`

```json
{ "status": "ok", "timestamp": 1234567890 }
```

---

### Intents

#### `POST /intent/lend`

Submit a lend order.

**Body:**
```typescript
{
  address: string     // wallet address
  amount: string      // USDC amount (human-readable, e.g. "100")
  duration: number    // seconds
  minRate?: number    // min acceptable rate in basis points
  tranche?: "senior" | "junior"  // default: "senior"
  signature?: string
}
```

**Response:**
```typescript
{
  ok: true,
  data: {
    id: number
    address: string
    amount: string
    minRate: string | null
    maxRate: null
    duration: number
    tranche: "senior" | "junior"
    type: "lend"
    signature: string | null
    active: true
    createdAt: string
  }
}
```

**Errors:** `400` missing fields

---

#### `POST /intent/borrow`

Submit a borrow order.

**Body:**
```typescript
{
  address: string
  amount: string
  duration: number    // seconds
  maxRate?: number    // max acceptable rate in basis points
  signature?: string
}
```

**Response:** Same shape as lend, with `type: "borrow"`, `tranche: null`, `minRate: null`.

**Errors:** `400` missing fields

---

#### `DELETE /intent/:id`

Cancel an intent (sets `active: false`).

**Response:** Updated intent object with `active: false`.

**Errors:** `404` not found

---

#### `GET /intents/:address`

Get all active intents for a wallet.

**Response:**
```typescript
{ ok: true, data: Intent[] }
```

---

### Market

#### `GET /market/stats`

Aggregate market statistics.

```typescript
{
  ok: true,
  data: {
    lendSupply: { count: number, total: string },
    borrowDemand: { count: number, total: string },
    activeLoans: { count: number, total: string }
  }
}
```

---

#### `GET /market/orderbook`

Full order book.

```typescript
{
  ok: true,
  data: {
    lends: Intent[],    // active lend intents
    borrows: Intent[]   // active borrow intents
  }
}
```

---

### Loans

#### `GET /loans/:address`

All loans for a user (as borrower + as lender).

```typescript
{
  ok: true,
  data: {
    asBorrower: Loan[],
    asLender: LenderPosition[]
  }
}
```

**Loan shape:**
```typescript
{
  id: number
  loanId: number          // on-chain ID
  borrower: string
  principal: string
  collateralAmount: string
  rate: number            // basis points
  duration: number        // seconds
  startTime: string
  seniorLenders: string[]
  seniorAmounts: string[]
  juniorLenders: string[]
  juniorAmounts: string[]
  status: "active" | "repaid" | "defaulted"
}
```

**LenderPosition shape:**
```typescript
{
  id: number
  loanId: number
  lender: string
  amount: string
  tranche: "senior" | "junior"
  status: "active" | "repaid" | "defaulted"
}
```

---

#### `GET /loans/overdue`

All active loans past maturity (candidates for liquidation).

```typescript
{ ok: true, data: Loan[] }
```

---

#### `POST /loans/sync/:loanId`

Sync a loan's status from on-chain state.

```typescript
{ ok: true, data: { loanId: number, status: "active" | "repaid" | "defaulted" } }
```

---

### User

#### `GET /user/:address/lends`

Lender dashboard data.

```typescript
{
  ok: true,
  data: {
    onChainBalance: string,       // from contract.getLenderBalance()
    activeIntents: Intent[],      // active lend intents
    positions: LenderPosition[]   // active lender positions
  }
}
```

---

#### `GET /user/:address/borrows`

Borrower dashboard data.

```typescript
{
  ok: true,
  data: {
    onChainCollateral: string,    // from contract.getBorrowerCollateral()
    activeIntents: Intent[],      // active borrow intents
    loans: Loan[]                 // loans as borrower
  }
}
```

---

#### `GET /user/:address/credit`

Credit score.

```typescript
{ ok: true, data: { address: string, creditScore: number } }
```

---

#### `GET /user/:address/activity`

Last 50 activities, newest first.

```typescript
{
  ok: true,
  data: [
    {
      id: number
      address: string
      type: "deposit_lend" | "withdraw_lend" | "deposit_collateral"
           | "withdraw_collateral" | "loan_created" | "loan_repaid"
           | "loan_defaulted"
      amount: string | null
      txHash: string | null
      timestamp: string
      details: object | null
    }
  ]
}
```

---

### Trigger (Protected — `x-api-key` header required)

#### `POST /trigger/settle`

Match intents and execute loans on-chain.

**Headers:** `x-api-key: <API_KEY>`

```typescript
{
  ok: true,
  data: {
    matched: number,
    results: [
      { borrower: string, principal: string, txHash: string }
      // or on failure:
      { borrower: string, error: string }
    ]
  }
}
```

---

#### `POST /trigger/liquidate`

Liquidate overdue loans.

**Headers:** `x-api-key: <API_KEY>`

```typescript
{
  ok: true,
  data: {
    liquidated: number,
    results: [
      { loanId: number, txHash: string }
      // or on failure:
      { loanId: number, error: string }
    ]
  }
}
```

---

## Client Integration Flow

### Lender Flow

```
1. Connect wallet
2. depositLend({ value: amount })          ← on-chain tx
3. POST /intent/lend { address, amount, duration, minRate?, tranche? }
4. Poll GET /user/:address/lends for position updates
5. Loan auto-created when runner triggers /trigger/settle
```

### Borrower Flow

```
1. Connect wallet
2. GET /user/:address/credit              ← check score → collateral tier
3. getRequiredCollateral(address, amount)  ← on-chain read
4. depositCollateral({ value: required })  ← on-chain tx
5. POST /intent/borrow { address, amount, duration, maxRate? }
6. Wait for match (poll GET /loans/:address)
7. To repay: getOwed(loanId) → repay(loanId, { value: owed })  ← on-chain tx
```

### Matching Logic

- Lends sorted by `minRate` ascending (cheapest first)
- Match requires: `lendMinRate <= borrowMaxRate` AND `lendDuration >= borrowDuration`
- Self-matches excluded (same address)
- Senior tranche fills first, then junior
- Rate = weighted average of matched lend rates
- Collateral = `getRequiredCollateral(borrower, principal)`, fallback 150%

---

## Viem Client Setup (Reference)

```typescript
import { createPublicClient, http } from "viem";
import { arcTestnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

// Read example
const balance = await publicClient.readContract({
  address: CONTRACT_ADDRESS,
  abi: GHOST_LENDING_ABI,
  functionName: "getLenderBalance",
  args: [userAddress],
});

// Write example (with wallet)
const hash = await walletClient.writeContract({
  address: CONTRACT_ADDRESS,
  abi: GHOST_LENDING_ABI,
  functionName: "depositLend",
  value: parseEther("100"),
});
```

---

## ABI (Minimal — for client use)

```typescript
export const GHOST_LENDING_ABI = [
  // Lender
  "function depositLend() external payable",
  "function withdrawLend(uint256 amount) external",
  "function getLenderBalance(address) view returns (uint256)",

  // Borrower
  "function depositCollateral() external payable",
  "function withdrawCollateral(uint256 amount) external",
  "function getBorrowerCollateral(address) view returns (uint256)",
  "function repay(uint256 loanId) external payable",

  // Reads
  "function getCreditScore(address) view returns (uint256)",
  "function getRequiredCollateral(address,uint256) view returns (uint256)",
  "function getLoan(uint256) view returns (address,uint256,uint256,uint256,uint256,uint256,bool,bool)",
  "function getLoanLenders(uint256) view returns (address[],uint256[],address[],uint256[])",
  "function getOwed(uint256) view returns (uint256)",
  "function isOverdue(uint256) view returns (bool)",
  "function loanCount() view returns (uint256)",

  // Events
  "event LendDeposited(address indexed lender, uint256 amount)",
  "event LendWithdrawn(address indexed lender, uint256 amount)",
  "event CollateralDeposited(address indexed borrower, uint256 amount)",
  "event CollateralWithdrawn(address indexed borrower, uint256 amount)",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 principal)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalPaid)",
  "event LoanDefaulted(uint256 indexed loanId, address indexed borrower)",
] as const;
```
