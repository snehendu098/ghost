# Withdrawal Flow: Cross-Token Settlement

## Problem

After a global app session swaps ETH↔USDC between participants, the **virtual ledger** (ClearNode) correctly reflects post-swap balances. But closing channels returns **original deposits** — not swapped tokens.

Example:
- A deposited 0.0005 ETH, sold it for USDC
- Ledger after swap: A has eth=0, usdc=0.025 ✓
- Channel close: A gets 0.0005 ETH back ✗ (original deposit, not USDC)

Channels are per-token. An ETH channel can't distribute USDC. The on-chain custody contract doesn't know about the ClearNode's virtual ledger changes.

## Root Cause

Two independent layers:
1. **App session** — off-chain virtual accounting managed by ClearNode
2. **Channel** — on-chain escrow between user and broker for a specific token

App session close updates the ledger. Channel close uses the channel's own state (original deposit allocations). These don't talk to each other automatically.

## Solution: Create New Channels for Swapped Tokens

After the app session closes and ledger is updated:

```
1. Close original channels
   - A's ETH channel → ETH returns to broker's custody pool
   - D's USDC channel → USDC returns to broker's custody pool

2. Create NEW channels for tokens users now hold on their ledger
   - A calls createCreateChannelMessage({ chain_id, token: USDC })
   - D calls createCreateChannelMessage({ chain_id, token: ETH })
   - ClearNode creates channels backed by user's ledger balance
   - No deposit needed — broker funds from its custody pool

3. Close new channels on-chain
   - A closes USDC channel → 0.025 USDC to A's custody available balance
   - D closes ETH channel → 0.001 ETH to D's custody available balance

4. Withdraw from custody
   - A calls withdrawal(USDC, amount)
   - D calls withdrawal(ETH, amount)
```

## Why This Works

- `createCreateChannelMessage` only requires `chain_id` + `token` (no amount)
- ClearNode sets the allocation based on user's current **ledger balance** for that token
- Broker's side of the channel is funded from the custody pool (which holds all original deposits)
- The custody contract distributes per the channel's final state

## Alternative: App State Withdraw Intent

The nitrolite protocol has `RPCAppStateIntent.Withdraw` and `RPCTxType.AppWithdrawal`. This may allow pulling funds from an app session directly to the user's channel/ledger without the create-close cycle. Needs testing.

## Protocol APIs Used

| Step | API | Layer |
|------|-----|-------|
| Close original channel | `createCloseChannelMessage` → `nitroliteClient.closeChannel()` → `nitroliteClient.withdrawal()` | RPC + on-chain |
| Create withdrawal channel | `createCreateChannelMessage({ chain_id, token })` | RPC only |
| Close withdrawal channel | `createCloseChannelMessage` → `nitroliteClient.closeChannel()` | RPC + on-chain |
| Withdraw from custody | `nitroliteClient.withdrawal(token, amount)` | on-chain |

## Key Types

```typescript
// App state intents
enum RPCAppStateIntent {
  Operate = "operate",   // normal state update
  Deposit = "deposit",   // deposit into session
  Withdraw = "withdraw"  // withdraw from session
}

// Channel state intents
enum StateIntent {
  OPERATE = 0,
  INITIALIZE = 1,
  RESIZE = 2,
  FINALIZE = 3
}

// Resize channel (adjust allocations without closing)
interface ResizeChannelRequest {
  method: "resize_channel"
  params: {
    channel_id: Hex
    resize_amount?: bigint
    allocate_amount?: bigint
    funds_destination: Address
  }
}
```
