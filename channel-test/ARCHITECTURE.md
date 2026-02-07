# Ghost: MEV-Protected Swap Architecture

## Overview

Ghost is an MEV-protected swap system that matches ETH/USD orders off-chain via Yellow Network state channels, preventing front-running and sandwich attacks by keeping orders out of the public mempool until settlement.

## Problem Statement

### Traditional DEX Flow (Vulnerable to MEV)
```
User submits swap tx → Mempool (PUBLIC) → MEV bots see it → Front-run/sandwich → User gets worse price
```

### Ghost Flow (MEV Protected)
```
User submits order → Off-chain matcher → State channel settlement → On-chain only at final settlement
```

## Architecture

### Components

1. **OrderBook** (`orderbook.ts`)
   - Collects buy/sell orders off-chain
   - Price-time priority matching (FIFO)
   - Outputs matched pairs

2. **ClearNodeClient** (`clearnode.ts`)
   - WebSocket connection to Yellow Network ClearNode
   - Handles authentication (EIP-712 signatures)
   - Manages ledger balances and app sessions

3. **SessionManager** (`session.ts`)
   - Creates app sessions for matched pairs
   - Executes atomic swaps via state updates
   - Closes sessions to settle on-chain

4. **Setup** (`setup.ts`)
   - Creates payment channels on-chain
   - Deposits collateral (ETH for sellers, USDC for buyers)

## Exact Flow

### Phase 1: Channel Setup (One-time)
```
1. Wallet generates keypair
2. Wallet connects to ClearNode via WebSocket
3. Wallet authenticates (EIP-712 signature)
4. Wallet requests channel creation from ClearNode
5. Wallet deposits collateral on-chain (ETH or USDC)
6. Channel is now funded and ready
```

### Phase 2: Order Submission & Matching (Off-chain)
```
1. Sellers submit sell orders: "Sell X ETH at price P"
2. Buyers submit buy orders: "Buy Y ETH at price P"
3. OrderBook matches orders using price-time priority
4. Matching happens entirely OFF-CHAIN (no mempool exposure)

Example:
  Sellers: A(0.003 ETH), B(0.004 ETH), C(0.003 ETH)
  Buyers:  D(0.008 ETH), F(0.002 ETH)

  Matches:
    D ↔ A: 0.003 ETH
    D ↔ B: 0.004 ETH
    D ↔ C: 0.001 ETH
    F ↔ C: 0.002 ETH
```

### Phase 3: Swap Execution (State Channels)
```
For each match:
1. Create app session with initial allocations:
   - Seller has ETH allocation
   - Buyer has USDC allocation

2. Execute swap (state update):
   - New state: Buyer has ETH, Seller has USDC
   - Both parties sign the new state
   - State is valid but NOT yet on-chain

3. Close session:
   - Final state submitted to ClearNode
   - ClearNode updates ledger balances
   - Settlement happens on-chain
```

### Phase 4: Residue Handling (Unmatched Orders)
```
If order doesn't fully match:
1. Remaining amount = "residue"
2. Residue sent to external aggregator (1inch, CoW, etc.)
3. Aggregator executes on-chain swap
4. User still protected (only residue exposed, not full order)
```

## Code Structure

```
src/
├── index.ts        # Main demo entry point
├── orderbook.ts    # Off-chain order matching
├── session.ts      # State channel swap sessions
├── clearnode.ts    # ClearNode WebSocket client
├── setup.ts        # Channel creation & deposits
├── onchain.ts      # On-chain contract interactions
├── wallets.ts      # Wallet management
└── types.ts        # TypeScript types
```

## Current Problems

### Problem 1: Sandbox Token Limitation
```
SANDBOX (wss://clearnet-sandbox.yellow.com/ws)
  - Only supports: ytest.usd
  - Does NOT support: ETH, WETH, or any other token

PRODUCTION (wss://clearnet.yellow.com/ws)
  - Chain 8453 (Base): eth (native), usdc, usdt
  - Chain 59144 (Linea): eth (native), usdc, usdt
```

**Impact**: Cannot demo ETH/USD swap on testnet. Must use production with real funds.

### Problem 2: Channel Creation Errors
```
Error: token not supported: 0x0000000000000000000000000000000000000000
```
Native ETH address rejected on sandbox because only ytest.usd is configured.

### Problem 3: Insufficient Funds
```
Error: insufficient funds: 0x... for asset eth:0
```
Wallets connected but no channel deposits made, so ledger balance is zero.

## Solution Options

### Option A: Use Production ClearNode (Recommended for Demo)
- Switch to `wss://clearnet.yellow.com/ws`
- Use Base mainnet (chain 8453)
- Deposit real ETH + USDC (small amounts ~$5)
- Full ETH/USD swap demo works

### Option B: Single Token Demo (Limited)
- Use sandbox with ytest.usd only
- Both sides deposit ytest.usd
- Matching logic works but doesn't show multi-asset swap

### Option C: Run ClearNode Locally
- Clone nitrolite repo
- Configure custom assets in assets.yaml
- Full control but complex setup

## Environment Variables

```env
CLEARNODE_URL=wss://clearnet.yellow.com/ws  # or sandbox
WALLET_A_PRIVATE_KEY=0x...
WALLET_B_PRIVATE_KEY=0x...
WALLET_C_PRIVATE_KEY=0x...
WALLET_D_PRIVATE_KEY=0x...
WALLET_F_PRIVATE_KEY=0x...
```

## Running the Demo

```bash
# 1. Check available assets
bun src/check-assets.ts

# 2. Setup channels (deposits on-chain)
bun run setup

# 3. Run matching simulation
bun run start
```

## Key Insight: Why This is MEV-Protected

1. **Orders never enter mempool** - submitted directly to matcher
2. **Matching happens off-chain** - MEV bots can't see pending orders
3. **State channels for settlement** - atomic swaps without mempool exposure
4. **Only final settlement on-chain** - by then, price is locked in

## Residue Flow (Future Implementation)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ User Order  │────▶│ Ghost Matcher│────▶│ Full Match  │──▶ State Channel Settlement
│ (10 ETH)    │     │ (Off-chain)  │     │ (8 ETH)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Residue    │────▶│ Aggregator  │──▶ On-chain Swap
                    │  (2 ETH)    │     │ (1inch/CoW) │
                    └─────────────┘     └─────────────┘
```
