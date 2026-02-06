import { loadWallets, getWallet, type LoadedWallet } from './wallets.ts'
import { ClearNodeClient } from './clearnode.ts'
import { OrderBook } from './orderbook.ts'
import { SessionManager } from './session.ts'

const PRICE = 500 // 1 ETH = 500 USDC

async function main() {
  console.log('=== Yellow Protocol Order Matching Demo ===\n')

  // 1. Load wallets
  console.log('Loading wallets...')
  const wallets = loadWallets()
  console.log(`Loaded ${wallets.size} wallets:`)
  for (const [name, w] of wallets) {
    console.log(`  ${name}: ${w.address}`)
  }
  console.log()

  // 2. Connect all wallets to ClearNode
  console.log('Connecting to ClearNode...')
  const clients = new Map<string, ClearNodeClient>()

  for (const [name, wallet] of wallets) {
    const client = new ClearNodeClient(wallet)
    try {
      await client.connect()
      clients.set(name, client)
      console.log(`  ${name}: Connected ✓`)
    } catch (e) {
      console.error(`  ${name}: Failed - ${e}`)
    }
  }
  console.log()

  // 3. Display initial balances
  console.log('Initial Ledger Balances:')
  for (const [name, client] of clients) {
    try {
      const balances = await client.getLedgerBalances()
      console.log(`  ${name}: ${JSON.stringify(balances)}`)
    } catch (e) {
      console.log(`  ${name}: Error fetching balances`)
    }
  }
  console.log()

  // 4. Submit orders
  console.log('Submitting orders...')
  const orderbook = new OrderBook()

  // Sellers: A=0.003 ETH, B=0.004 ETH, C=0.003 ETH (total 0.01 ETH)
  orderbook.addSellOrder('A', '0.003', PRICE)
  orderbook.addSellOrder('B', '0.004', PRICE)
  orderbook.addSellOrder('C', '0.003', PRICE)
  console.log('  Sell orders: A(0.003 ETH), B(0.004 ETH), C(0.003 ETH)')

  // Buyers: D=0.008 ETH (4 USDC), F=0.002 ETH (1 USDC)
  orderbook.addBuyOrder('D', '0.008', PRICE)
  orderbook.addBuyOrder('F', '0.002', PRICE)
  console.log('  Buy orders: D(0.008 ETH), F(0.002 ETH)')
  console.log()

  // 5. Run matching
  console.log('Matching orders...')
  const matches = orderbook.matchOrders()
  console.log(`  Found ${matches.length} matches:`)
  for (const m of matches) {
    console.log(`    ${m.buyer} ↔ ${m.seller}: ${m.ethAmount} ETH / ${m.usdcAmount} USDC`)
  }
  console.log()

  // 6. Execute matches as sessions
  console.log('Executing swaps via app sessions...')
  const sessionMgr = new SessionManager()

  for (const match of matches) {
    const sellerClient = clients.get(match.seller)
    const buyerClient = clients.get(match.buyer)

    if (!sellerClient || !buyerClient) {
      console.log(`  Skip: Missing client for ${match.seller} or ${match.buyer}`)
      continue
    }

    const session = sessionMgr.createSwapSession(match)
    console.log(`\n  Processing ${session.id}: ${match.seller} → ${match.buyer}`)

    try {
      await sessionMgr.initSession(session.id, sellerClient, buyerClient)
      await sessionMgr.executeSwap(session.id, sellerClient, buyerClient)
      await sessionMgr.closeSession(session.id, sellerClient, buyerClient)
    } catch (e) {
      console.error(`    Error: ${e}`)
    }
  }
  console.log()

  // 7. Display final balances
  console.log('Final Ledger Balances:')
  for (const [name, client] of clients) {
    try {
      const balances = await client.getLedgerBalances()
      console.log(`  ${name}: ${JSON.stringify(balances)}`)
    } catch (e) {
      console.log(`  ${name}: Error fetching balances`)
    }
  }
  console.log()

  // Cleanup
  console.log('Closing connections...')
  for (const client of clients.values()) {
    client.close()
  }

  console.log('Done!')
}

main().catch(console.error)
