import type { Hex, Address } from 'viem'
import type { RPCAppSessionAllocation, MessageSigner } from '@erc7824/nitrolite'
import type { ClearNodeClient } from './connection.ts'
import type { LoadedWallet, GlobalSession, Match } from './types.ts'
import { SELL_ASSET, BUY_ASSET } from './config.ts'

// Round to 18 decimal places to avoid floating point drift
function roundAmount(n: number): string {
  // Clamp near-zero negatives from float drift
  if (Math.abs(n) < 1e-15) return '0'
  return parseFloat(n.toPrecision(15)).toString()
}

/**
 * Build initial allocations for global session.
 * Each participant gets entries for BOTH assets (even if 0).
 * Sellers: ETH=balance, USDC=0
 * Buyers: ETH=0, USDC=balance
 * Server: ETH=0, USDC=0
 */
function buildInitialAllocations(
  serverAddr: Address,
  participants: LoadedWallet[],
  ledgerBalances: Map<string, { eth: string; usdc: string }>,
): RPCAppSessionAllocation[] {
  const allocations: RPCAppSessionAllocation[] = []
  const allAddrs = [serverAddr, ...participants.map((p) => p.address as Address)]

  for (const addr of allAddrs) {
    const bal = ledgerBalances.get(addr.toLowerCase())
    allocations.push({
      asset: SELL_ASSET,
      amount: bal?.eth ?? '0',
      participant: addr,
    })
  }

  for (const addr of allAddrs) {
    const bal = ledgerBalances.get(addr.toLowerCase())
    allocations.push({
      asset: BUY_ASSET,
      amount: bal?.usdc ?? '0',
      participant: addr,
    })
  }

  return allocations
}

/**
 * Create global app session with ALL participants signing.
 */
export async function createAppSession(
  serverClient: ClearNodeClient,
  serverWallet: LoadedWallet,
  participantWallets: LoadedWallet[],
  participantClients: Map<string, ClearNodeClient>,
): Promise<GlobalSession> {
  console.log('=== Step 3: Create Global App Session ===\n')

  const serverAddr = serverWallet.address as Address
  const participantAddrs = participantWallets.map((w) => w.address as Address)
  const allParticipants = [serverAddr, ...participantAddrs]

  // Fetch ledger balances for each participant to determine deposit amounts
  console.log('  Fetching ledger balances...')
  const ledgerBalances = new Map<string, { eth: string; usdc: string }>()

  // Server balance
  try {
    const serverBals = await serverClient.getLedgerBalances()
    const eth = serverBals.find((b) => b.asset === SELL_ASSET)?.amount ?? '0'
    const usdc = serverBals.find((b) => b.asset === BUY_ASSET)?.amount ?? '0'
    ledgerBalances.set(serverAddr.toLowerCase(), { eth, usdc })
    console.log(`    SERVER: eth=${eth}, usdc=${usdc}`)
  } catch (e) {
    ledgerBalances.set(serverAddr.toLowerCase(), { eth: '0', usdc: '0' })
    console.log(`    SERVER: no balances (${e})`)
  }

  // Participant balances
  for (const wallet of participantWallets) {
    const client = participantClients.get(wallet.name)
    if (!client) continue

    try {
      const bals = await client.getLedgerBalances()
      const eth = bals.find((b) => b.asset === SELL_ASSET)?.amount ?? '0'
      const usdc = bals.find((b) => b.asset === BUY_ASSET)?.amount ?? '0'
      ledgerBalances.set(wallet.address.toLowerCase(), { eth, usdc })
      console.log(`    ${wallet.name}: eth=${eth}, usdc=${usdc}`)
    } catch (e) {
      ledgerBalances.set(wallet.address.toLowerCase(), { eth: '0', usdc: '0' })
      console.log(`    ${wallet.name}: no balances (${e})`)
    }
  }

  // Build initial allocations
  const initialAllocations = buildInitialAllocations(serverAddr, participantWallets, ledgerBalances)

  console.log(`\n  Initial allocations (${initialAllocations.length} entries):`)
  for (const a of initialAllocations) {
    if (a.amount !== '0') {
      console.log(`    ${a.participant.slice(0, 10)}... ${a.asset}=${a.amount}`)
    }
  }

  // ALL participants sign for creation
  const allSigners: MessageSigner[] = [
    serverWallet.signer,
    ...participantWallets.map((w) => w.signer),
  ]

  console.log(`\n  Creating session with ${allParticipants.length} participants...`)
  const appSessionId = await serverClient.createGlobalAppSession(
    allParticipants,
    initialAllocations,
    allSigners,
  )

  console.log(`  App Session ID: ${appSessionId}\n`)

  return {
    appSessionId,
    participants: allParticipants,
    version: 1,
    allocations: initialAllocations.map((a) => ({
      asset: a.asset,
      amount: a.amount,
      participant: a.participant as Address,
    })),
  }
}

/**
 * Finalize: apply matches, server signs alone to submit + close.
 */
export async function finalize(
  serverClient: ClearNodeClient,
  serverSigner: MessageSigner,
  session: GlobalSession,
  matches: Match[],
): Promise<RPCAppSessionAllocation[]> {
  console.log('=== Step 5: Finalize (Server-Only Signing) ===\n')

  // Build balance map from initial allocations
  // Key: `${participant.toLowerCase()}-${asset}`
  const balances = new Map<string, number>()
  for (const a of session.allocations) {
    const key = `${a.participant.toLowerCase()}-${a.asset}`
    balances.set(key, parseFloat(a.amount))
  }

  // Apply each match
  for (const match of matches) {
    const sellerEthKey = `${match.seller.toLowerCase()}-${SELL_ASSET}`
    const sellerUsdcKey = `${match.seller.toLowerCase()}-${BUY_ASSET}`
    const buyerEthKey = `${match.buyer.toLowerCase()}-${SELL_ASSET}`
    const buyerUsdcKey = `${match.buyer.toLowerCase()}-${BUY_ASSET}`

    const ethAmt = parseFloat(match.ethAmount)
    const usdcAmt = parseFloat(match.usdcAmount)

    // Seller loses ETH, gains USDC
    balances.set(sellerEthKey, (balances.get(sellerEthKey) ?? 0) - ethAmt)
    balances.set(sellerUsdcKey, (balances.get(sellerUsdcKey) ?? 0) + usdcAmt)

    // Buyer gains ETH, loses USDC
    balances.set(buyerEthKey, (balances.get(buyerEthKey) ?? 0) + ethAmt)
    balances.set(buyerUsdcKey, (balances.get(buyerUsdcKey) ?? 0) - usdcAmt)
  }

  // Conservation check: server net should be 0
  const serverAddr = session.participants[0]!.toLowerCase()
  const serverEth = balances.get(`${serverAddr}-${SELL_ASSET}`) ?? 0
  const serverUsdc = balances.get(`${serverAddr}-${BUY_ASSET}`) ?? 0
  console.log(`  Server net: eth=${serverEth}, usdc=${serverUsdc}`)
  if (Math.abs(serverEth) > 0.000001 || Math.abs(serverUsdc) > 0.000001) {
    console.warn('  WARNING: Server net is not zero!')
  }

  // Build final allocations — all participants per asset
  const finalAllocations: RPCAppSessionAllocation[] = []

  for (const participant of session.participants) {
    const ethKey = `${participant.toLowerCase()}-${SELL_ASSET}`
    const amt = balances.get(ethKey) ?? 0
    finalAllocations.push({
      asset: SELL_ASSET,
      amount: roundAmount(amt),
      participant,
    })
  }

  for (const participant of session.participants) {
    const usdcKey = `${participant.toLowerCase()}-${BUY_ASSET}`
    const amt = balances.get(usdcKey) ?? 0
    finalAllocations.push({
      asset: BUY_ASSET,
      amount: roundAmount(amt),
      participant,
    })
  }

  console.log(`\n  Final allocations (${finalAllocations.length} entries):`)
  for (const a of finalAllocations) {
    if (a.amount !== '0') {
      console.log(`    ${a.participant.slice(0, 10)}... ${a.asset}=${a.amount}`)
    }
  }

  // Submit state — server only
  console.log('\n  Submitting final state (server-only)...')
  await serverClient.submitAppStateServerOnly(
    session.appSessionId,
    session.version + 1,
    finalAllocations,
    serverSigner,
  )
  console.log('  State submitted.')

  // Close session — server only
  console.log('  Closing session (server-only)...')
  await serverClient.closeAppSessionServerOnly(
    session.appSessionId,
    finalAllocations,
    serverSigner,
  )
  console.log('  Session closed.\n')

  return finalAllocations
}
