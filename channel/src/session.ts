import type { Hex, Address } from 'viem'
import type { RPCAppSessionAllocation } from '@erc7824/nitrolite'
import type { ClearNodeClient } from './clearnode.ts'
import type { Match } from './types.ts'

// Asset identifiers — sellers offer ETH, buyers offer USDC
const SELL_ASSET = 'eth'
const BUY_ASSET = 'usdc'

export interface SwapSession {
  id: string
  appSessionId?: Hex
  seller: string
  buyer: string
  ethAmount: string
  usdcAmount: string
  status: 'pending' | 'created' | 'executed' | 'closed'
  version: number
}

export class SessionManager {
  private sessions = new Map<string, SwapSession>()
  private sessionId = 0

  createSwapSession(match: Match): SwapSession {
    const id = `session-${++this.sessionId}`
    const session: SwapSession = {
      id,
      seller: match.seller,
      buyer: match.buyer,
      ethAmount: match.ethAmount,
      usdcAmount: match.usdcAmount,
      status: 'pending',
      version: 0,
    }
    this.sessions.set(id, session)
    return session
  }

  async initSession(
    sessionId: string,
    sellerClient: ClearNodeClient,
    buyerClient: ClearNodeClient
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    const sellerAddr = sellerClient.address as Address
    const buyerAddr = buyerClient.address as Address

    // Initial allocations: seller has ETH, buyer has USDC
    const initialAllocations: RPCAppSessionAllocation[] = [
      { asset: SELL_ASSET, amount: session.ethAmount, participant: sellerAddr },
      { asset: BUY_ASSET, amount: session.usdcAmount, participant: buyerAddr },
    ]

    // Seller creates the app session
    const appSessionId = await sellerClient.createAppSession(
      [sellerAddr, buyerAddr],
      initialAllocations
    )

    session.appSessionId = appSessionId
    session.status = 'created'
    session.version = 1
    console.log(`  Session ${sessionId} created: ${appSessionId}`)
  }

  async executeSwap(
    sessionId: string,
    sellerClient: ClearNodeClient,
    buyerClient: ClearNodeClient
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    if (!session.appSessionId) throw new Error(`Session ${sessionId} not initialized`)

    const sellerAddr = sellerClient.address as Address
    const buyerAddr = buyerClient.address as Address

    // After swap: buyer has ETH, seller has USDC
    const swappedAllocations: RPCAppSessionAllocation[] = [
      { asset: SELL_ASSET, amount: session.ethAmount, participant: buyerAddr },
      { asset: BUY_ASSET, amount: session.usdcAmount, participant: sellerAddr },
    ]

    // Both parties sign the new state
    session.version++
    await sellerClient.submitAppState(
      session.appSessionId,
      session.version,
      swappedAllocations
    )

    session.status = 'executed'
    console.log(`  Session ${sessionId} executed (v${session.version})`)
  }

  async closeSession(
    sessionId: string,
    sellerClient: ClearNodeClient,
    buyerClient: ClearNodeClient
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    if (!session.appSessionId) throw new Error(`Session ${sessionId} not initialized`)

    const sellerAddr = sellerClient.address as Address
    const buyerAddr = buyerClient.address as Address

    // Final allocations after swap
    const finalAllocations: RPCAppSessionAllocation[] = [
      { asset: SELL_ASSET, amount: session.ethAmount, participant: buyerAddr },
      { asset: BUY_ASSET, amount: session.usdcAmount, participant: sellerAddr },
    ]

    await sellerClient.closeAppSession(session.appSessionId, finalAllocations)

    session.status = 'closed'
    console.log(`  Session ${sessionId} closed`)
  }

  getSession(sessionId: string): SwapSession | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): SwapSession[] {
    return [...this.sessions.values()]
  }
}
