import { Wallet } from 'ethers'
import { createPublicClient, createWalletClient, http, formatEther, formatUnits, parseEther, parseUnits, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import {
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner,
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createGetConfigMessageV2,
  createGetChannelsMessageV2,
  createCloseChannelMessage,
  StateIntent,
  type CloseChannelParams,
  type FinalState,
} from '@erc7824/nitrolite'
import {
  createNitroliteClient,
  parseConfigResponse,
  BASE_SEPOLIA_CHAIN_ID,
  ETH_ADDRESS,
  USDC_ADDRESS,
  type ConfigResponse,
} from './onchain.ts'
import type { Match } from './types.ts'

const CLEARNODE_URL = process.env.CLEARNODE_URL || 'wss://clearnet-sandbox.yellow.com/ws'
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'
const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const
const APP_NAME = 'ghost-matcher'
const PRICE = 50 // must match index.ts

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

interface WalletData {
  name: string
  address: Address
  privateKey: Hex
  signer: ReturnType<typeof createECDSAMessageSigner>
}

// --- CloseClient (reused from close-channels.ts) ---

class CloseClient {
  private ws: WebSocket | null = null
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(CLEARNODE_URL)
      this.ws.onopen = () => resolve()
      this.ws.onerror = (e) => reject(new Error(`WebSocket error: ${e}`))
      this.ws.onmessage = (event) => this.handleMessage(event.data as string)
    })
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data)
      const reqId = msg.res?.[0] ?? msg.req?.[0]
      if (reqId && this.pending.has(reqId)) {
        const p = this.pending.get(reqId)!
        this.pending.delete(reqId)
        if (msg.res?.[1] === 'error') {
          p.reject(new Error(msg.res[2].error))
        } else {
          p.resolve(msg)
        }
      }
    } catch {
      // ignore
    }
  }

  async send(message: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'))
      }
      const parsed = JSON.parse(message)
      const reqId = parsed.req?.[0]
      if (reqId) {
        this.pending.set(reqId, { resolve, reject })
      }
      this.ws.send(message)
    })
  }

  async authenticate(wallet: WalletData): Promise<void> {
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400)

    const authReq = await createAuthRequestMessage({
      address: wallet.address,
      session_key: wallet.address,
      application: APP_NAME,
      allowances: [],
      expires_at: expiresAt,
      scope: 'console',
    })

    const challengeRes = await this.send(authReq) as { res: [number, string, { challenge_message: string }] }
    if (challengeRes.res[1] !== 'auth_challenge') {
      throw new Error('Auth failed: expected auth_challenge')
    }

    const account = privateKeyToAccount(wallet.privateKey)
    const viemWalletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    })

    const eip712Signer = createEIP712AuthMessageSigner(
      viemWalletClient,
      {
        scope: 'console',
        session_key: wallet.address,
        expires_at: expiresAt,
        allowances: [],
      },
      { name: APP_NAME }
    )

    const verifyMsg = await createAuthVerifyMessageFromChallenge(
      eip712Signer,
      challengeRes.res[2].challenge_message
    )
    const verifyRes = await this.send(verifyMsg) as { res: [number, string, { success: boolean }] }
    if (!verifyRes.res[2].success) {
      throw new Error('Auth verify failed')
    }
  }

  async getChannels(walletAddress: Address): Promise<any[]> {
    const msg = createGetChannelsMessageV2(walletAddress)
    const res = await this.send(msg) as { res: [number, string, { channels: any[] }] }
    return res.res[2].channels ?? []
  }

  async closeChannelRPC(wallet: WalletData, channelId: Hex): Promise<any> {
    const msg = await createCloseChannelMessage(wallet.signer, channelId, wallet.address)
    const res = await this.send(msg) as { res: [number, string, any] }
    return res.res[2]
  }

  close(): void {
    this.ws?.close()
  }
}

// --- Core Functions ---

function loadWallets(): WalletData[] {
  const wallets: WalletData[] = []
  for (const name of WALLET_NAMES) {
    const key = process.env[`WALLET_${name}_PRIVATE_KEY`]
    if (!key) {
      console.log(`Skipping ${name}: no private key`)
      continue
    }
    const w = new Wallet(key)
    wallets.push({
      name,
      address: w.address as Address,
      privateKey: key as Hex,
      signer: createECDSAMessageSigner(key as Hex),
    })
  }
  return wallets
}

interface Transfer {
  from: Address
  to: Address
  token: Address
  amount: bigint
  label: string // e.g. "A→D 0.003 ETH"
}

/**
 * Compute peer-to-peer transfers needed to settle swap results on-chain.
 * For each match: seller sends ETH to buyer, buyer sends USDC to seller.
 */
function computeTransfers(matches: Match[], walletMap: Map<string, WalletData>): Transfer[] {
  const transfers: Transfer[] = []

  for (const m of matches) {
    const seller = walletMap.get(m.seller)
    const buyer = walletMap.get(m.buyer)
    if (!seller || !buyer) continue

    const ethAmount = parseEther(m.ethAmount)
    const usdcAmount = parseUnits(m.usdcAmount, 6)

    // Seller → Buyer: ETH
    transfers.push({
      from: seller.address,
      to: buyer.address,
      token: ETH_ADDRESS,
      amount: ethAmount,
      label: `${m.seller}→${m.buyer} ${m.ethAmount} ETH`,
    })

    // Buyer → Seller: USDC
    transfers.push({
      from: buyer.address,
      to: seller.address,
      token: USDC_ADDRESS,
      amount: usdcAmount,
      label: `${m.buyer}→${m.seller} ${m.usdcAmount} USDC`,
    })
  }

  return transfers
}

/**
 * Close all open channels and withdraw custody balances for a wallet.
 */
async function closeAndWithdraw(wallet: WalletData, config: ConfigResponse): Promise<void> {
  console.log(`\n  ${wallet.name} (${wallet.address})`)

  const client = new CloseClient()
  await client.connect()

  try {
    console.log(`    Authenticating...`)
    await client.authenticate(wallet)

    console.log(`    Fetching channels...`)
    const channels = await client.getChannels(wallet.address)
    const openChannels = channels.filter((c: any) => c.status === 'open')

    if (openChannels.length === 0) {
      console.log(`    No open channels`)
    } else {
      console.log(`    Found ${openChannels.length} open channel(s)`)

      const network = config.networks.find((n) => n.chain_id === BASE_SEPOLIA_CHAIN_ID)
      if (!network) throw new Error(`Network ${BASE_SEPOLIA_CHAIN_ID} not in config`)

      const nitroliteClient = createNitroliteClient(wallet.privateKey, {
        custody: network.custody_address,
        adjudicator: network.adjudicator_address,
      })

      for (const ch of openChannels) {
        const chId = ch.channelId ?? ch.channel_id
        console.log(`    Closing channel ${chId}...`)

        const closeRes = await client.closeChannelRPC(wallet, chId)
        const state = closeRes.state

        const finalState: FinalState = {
          channelId: closeRes.channelId ?? closeRes.channel_id,
          intent: StateIntent.FINALIZE,
          version: BigInt(state.version),
          data: state.stateData ?? state.state_data,
          allocations: state.allocations.map((a: any) => ({
            destination: a.destination,
            token: a.token,
            amount: BigInt(a.amount),
          })),
          serverSignature: closeRes.serverSignature ?? closeRes.server_signature,
        }

        const stateData = state.stateData ?? state.state_data
        const params: CloseChannelParams = { stateData, finalState }
        const txHash = await nitroliteClient.closeChannel(params)
        console.log(`    Closed on-chain: ${txHash}`)
      }
    }

    // Withdraw any custody balances
    const network = config.networks.find((n) => n.chain_id === BASE_SEPOLIA_CHAIN_ID)
    if (!network) throw new Error(`Network ${BASE_SEPOLIA_CHAIN_ID} not in config`)

    const nitroliteClient = createNitroliteClient(wallet.privateKey, {
      custody: network.custody_address,
      adjudicator: network.adjudicator_address,
    })

    for (const token of [ETH_ADDRESS, USDC_ADDRESS]) {
      const balance = await nitroliteClient.getAccountBalance(token)
      if (balance > 0n) {
        const symbol = token === ETH_ADDRESS ? 'ETH' : 'USDC'
        const formatted = token === ETH_ADDRESS ? formatEther(balance) : formatUnits(balance, 6)
        console.log(`    Withdrawing ${formatted} ${symbol} from custody...`)
        const txHash = await nitroliteClient.withdrawal(token, balance)
        console.log(`    Withdrawal tx: ${txHash}`)
      }
    }
  } finally {
    client.close()
  }
}

/**
 * Execute on-chain transfers to redistribute funds per swap results.
 * Sequential per sender for nonce safety.
 */
async function executeTransfers(transfers: Transfer[], walletMap: Map<string, WalletData>): Promise<void> {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) })

  // Group by sender
  const bySender = new Map<Address, Transfer[]>()
  for (const t of transfers) {
    const list = bySender.get(t.from) ?? []
    list.push(t)
    bySender.set(t.from, list)
  }

  for (const [sender, txs] of bySender) {
    // Find wallet for this sender
    const wallet = [...walletMap.values()].find((w) => w.address.toLowerCase() === sender.toLowerCase())
    if (!wallet) {
      console.log(`  No wallet for sender ${sender}, skipping`)
      continue
    }

    const account = privateKeyToAccount(wallet.privateKey)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(RPC_URL) })

    for (const t of txs) {
      console.log(`  ${t.label}`)
      let hash: Hex

      if (t.token === ETH_ADDRESS) {
        hash = await walletClient.sendTransaction({ to: t.to, value: t.amount })
      } else {
        hash = await walletClient.writeContract({
          address: t.token,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [t.to, t.amount],
        })
      }

      await publicClient.waitForTransactionReceipt({ hash })
      console.log(`    tx: ${hash}`)
    }
  }
}

// --- Main ---

async function main() {
  console.log('=== Settle: Close, Withdraw & Redistribute ===\n')

  // 1. Load wallets
  const wallets = loadWallets()
  if (wallets.length === 0) {
    console.log('No wallets found.')
    return
  }
  const walletMap = new Map<string, WalletData>()
  for (const w of wallets) walletMap.set(w.name, w)

  // 2. Get clearnode config
  const configClient = new CloseClient()
  await configClient.connect()
  await configClient.authenticate(wallets[0])
  const configMsg = createGetConfigMessageV2()
  const configRes = await configClient.send(configMsg)
  const config = parseConfigResponse(configRes)
  configClient.close()
  console.log(`Broker: ${config.broker_address}`)

  // 3. Close channels & withdraw custody for all wallets
  console.log('\n--- Phase 1: Close Channels & Withdraw ---')
  for (const wallet of wallets) {
    try {
      await closeAndWithdraw(wallet, config)
    } catch (e) {
      console.error(`  Error for ${wallet.name}: ${e}`)
    }
  }

  // 4. Compute matches (same as index.ts demo)
  const matches: Match[] = []
  // Reproduce orderbook matching: D buys 0.008, F buys 0.002
  // Sells: A(0.003), B(0.004), C(0.003) — all at PRICE
  // D matches: A(0.003) + B(0.004) + C(0.001) = 0.008
  // F matches: C(0.002) = 0.002
  matches.push({ seller: 'A', buyer: 'D', ethAmount: '0.003', usdcAmount: (0.003 * PRICE).toString() })
  matches.push({ seller: 'B', buyer: 'D', ethAmount: '0.004', usdcAmount: (0.004 * PRICE).toString() })
  matches.push({ seller: 'C', buyer: 'D', ethAmount: '0.001', usdcAmount: (0.001 * PRICE).toString() })
  matches.push({ seller: 'C', buyer: 'F', ethAmount: '0.002', usdcAmount: (0.002 * PRICE).toString() })

  // 5. Compute transfers
  const transfers = computeTransfers(matches, walletMap)
  console.log(`\n--- Phase 2: On-Chain Redistribution (${transfers.length} transfers) ---`)
  for (const t of transfers) {
    console.log(`  Planned: ${t.label}`)
  }

  // 6. Execute transfers
  console.log('\nExecuting...')
  await executeTransfers(transfers, walletMap)

  // 7. Print final on-chain balances
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) })
  console.log('\n--- Final On-Chain Balances ---')
  for (const w of wallets) {
    const [ethBal, usdcBal] = await Promise.all([
      publicClient.getBalance({ address: w.address }),
      publicClient.readContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf', args: [w.address] }),
    ])
    console.log(`  ${w.name}: ${formatEther(ethBal)} ETH, ${formatUnits(usdcBal, 6)} USDC`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
