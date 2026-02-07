import { loadServerWallet, loadParticipantWallets, SELL_ASSET, BUY_ASSET, WALLET_DEPOSITS } from './config.ts'
import { createChannelFunction } from './channel.ts'
import { connect, type ClearNodeClient } from './connection.ts'
import { createAppSession, finalize } from './session.ts'
import { closeChannelsAndWithdraw, printOnChainBalances, waitForAllChannels } from './settle.ts'
import { OrderBook } from './orderbook.ts'
import type { Match, LoadedWallet } from './types.ts'

const PRICE = 50 // 1 ETH = 50 USDC
const skipChannels = process.argv.includes('--skip-channels')

async function printLedgerBalances(label: string, wallets: LoadedWallet[], clients: Map<string, ClearNodeClient>) {
  console.log(`\n  ${label}`)
  console.log(`  ${'Wallet'.padEnd(8)} ${'ETH'.padStart(12)} ${'USDC'.padStart(12)}`)
  console.log(`  ${'─'.repeat(8)} ${'─'.repeat(12)} ${'─'.repeat(12)}`)

  for (const w of wallets) {
    const client = clients.get(w.name)
    if (!client) { console.log(`  ${w.name.padEnd(8)} (not connected)`); continue }
    try {
      const bals = await client.getLedgerBalances()
      const eth = bals.find((b) => b.asset === SELL_ASSET)?.amount ?? '0'
      const usdc = bals.find((b) => b.asset === BUY_ASSET)?.amount ?? '0'
      console.log(`  ${w.name.padEnd(8)} ${eth.padStart(12)} ${usdc.padStart(12)}`)
    } catch {
      console.log(`  ${w.name.padEnd(8)} (error)`)
    }
  }
}

async function main() {
  console.log('=== Ghost Swap — Global Session MEV-Protected Swap ===\n')

  const serverWallet = loadServerWallet()
  const participantWallets = loadParticipantWallets()

  console.log(`Server: ${serverWallet.address}`)
  for (const w of participantWallets) {
    console.log(`  ${w.name}: ${w.address}`)
  }
  console.log()

  // Pre-channel on-chain balances
  console.log('=== Initial On-Chain Balances ===')
  await printOnChainBalances('On-chain (before channels):', participantWallets)
  console.log()

  // Step 1: Create channels + deposit
  if (skipChannels) {
    console.log('=== Step 1: Skipping channel setup (--skip-channels) ===\n')
  } else {
    await createChannelFunction(participantWallets)
  }

  // Step 1.5: Verify ClearNode detected all channels (drpc.org WebSocket can drop events)
  if (!skipChannels) {
    const walletsWithDeposits = participantWallets.filter((w) => WALLET_DEPOSITS[w.name])
    await waitForAllChannels(walletsWithDeposits)
  }

  // Step 2: Connect all wallets to ClearNode
  const { serverClient, participantClients } = await connect(serverWallet, participantWallets)

  try {
    // === BEFORE balances ===
    console.log('=== Balances BEFORE Swap ===')
    await printOnChainBalances('On-chain:', participantWallets)
    await printLedgerBalances('Ledger (off-chain):', participantWallets, participantClients)
    console.log()

    // Step 3: Create global app session (all sign)
    const session = await createAppSession(
      serverClient,
      serverWallet,
      participantWallets,
      participantClients,
    )

    // Step 4: Build orders from actual session allocations
    console.log('=== Step 4: Order Matching ===\n')
    const orderbook = new OrderBook()

    for (const wallet of participantWallets) {
      const addr = wallet.address
      const ethAlloc = session.allocations.find(
        (a) => a.participant.toLowerCase() === addr.toLowerCase() && a.asset === SELL_ASSET
      )
      const usdcAlloc = session.allocations.find(
        (a) => a.participant.toLowerCase() === addr.toLowerCase() && a.asset === BUY_ASSET
      )

      const ethBal = parseFloat(ethAlloc?.amount ?? '0')
      const usdcBal = parseFloat(usdcAlloc?.amount ?? '0')

      if (ethBal > 0) {
        orderbook.addSellOrder(addr, ethBal.toString(), PRICE)
        console.log(`  Sell: ${wallet.name} ${ethBal} ETH`)
      } else if (usdcBal > 0) {
        const ethEquiv = usdcBal / PRICE
        orderbook.addBuyOrder(addr, ethEquiv.toString(), PRICE)
        console.log(`  Buy:  ${wallet.name} ${ethEquiv} ETH (${usdcBal} USDC)`)
      } else {
        console.log(`  Skip: ${wallet.name} (no balance)`)
      }
    }

    const matches: Match[] = orderbook.matchOrders()
    console.log(`\n  ${matches.length} matches:`)
    for (const m of matches) {
      const sellerName = participantWallets.find((w) => w.address === m.seller)?.name ?? '?'
      const buyerName = participantWallets.find((w) => w.address === m.buyer)?.name ?? '?'
      console.log(`    ${buyerName} <- ${sellerName}: ${m.ethAmount} ETH / ${m.usdcAmount} USDC`)
    }
    console.log()

    // Step 5: Finalize — server signs alone
    const finalAllocations = await finalize(serverClient, serverWallet.signer, session, matches)

    // === AFTER balances (ledger) ===
    console.log('=== Balances AFTER Swap ===')
    await printLedgerBalances('Ledger (off-chain):', participantWallets, participantClients)
    console.log()

    // Close WS connections
    console.log('Closing WS connections...\n')
    serverClient.close()
    for (const client of participantClients.values()) {
      client.close()
    }

    // Step 6: Close channels & withdraw (funds redistribute per updated ledger)
    await closeChannelsAndWithdraw(participantWallets, finalAllocations)

    // === AFTER balances (on-chain) ===
    console.log('=== Final On-Chain Balances ===')
    await printOnChainBalances('On-chain (post-withdraw):', participantWallets)
    console.log()

  } catch (e) {
    console.error(`Error: ${e}`)
    serverClient.close()
    for (const client of participantClients.values()) {
      client.close()
    }
  }

  console.log('Done!')
}

main().catch(console.error)
