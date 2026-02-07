import { Wallet } from 'ethers'
import { createWalletClient, http, formatEther, formatUnits, type Address, type Hex } from 'viem'
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
  type RPCChannelUpdateWithWallet,
  type RPCChannelOperation,
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
} from '../onchain.ts'

const CLEARNODE_URL = process.env.CLEARNODE_URL || 'wss://clearnet-sandbox.yellow.com/ws'
const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const
const APP_NAME = 'ghost-matcher'

interface WalletData {
  name: string
  address: string
  privateKey: Hex
  signer: ReturnType<typeof createECDSAMessageSigner>
}

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
      address: w.address,
      privateKey: key as Hex,
      signer: createECDSAMessageSigner(key as Hex),
    })
  }
  return wallets
}

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
    const walletAddress = wallet.address as Address
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400)

    const authReq = await createAuthRequestMessage({
      address: walletAddress,
      session_key: walletAddress,
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
        session_key: walletAddress,
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
    const msg = await createCloseChannelMessage(wallet.signer, channelId, wallet.address as Address)
    const res = await this.send(msg) as { res: [number, string, any] }
    return res.res[2]
  }

  close(): void {
    this.ws?.close()
  }
}

async function closeWalletChannels(wallet: WalletData, config: ConfigResponse): Promise<void> {
  console.log(`\n  Processing ${wallet.name} (${wallet.address})`)

  const client = new CloseClient()
  await client.connect()

  try {
    console.log(`    Authenticating...`)
    await client.authenticate(wallet)

    console.log(`    Fetching channels...`)
    const channels = await client.getChannels(wallet.address as Address)
    const openChannels = channels.filter((c) => c.status === 'open')

    if (openChannels.length === 0) {
      console.log(`    No open channels`)
      return
    }
    console.log(`    Found ${openChannels.length} open channel(s)`)

    const network = config.networks.find((n) => n.chain_id === BASE_SEPOLIA_CHAIN_ID)
    if (!network) throw new Error(`Network ${BASE_SEPOLIA_CHAIN_ID} not in config`)

    const nitroliteClient = createNitroliteClient(wallet.privateKey, {
      custody: network.custody_address,
      adjudicator: network.adjudicator_address,
    })

    // Track tokens to withdraw after all channels closed
    const tokenAmounts = new Map<Address, bigint>()

    for (const ch of openChannels) {
      const chId = ch.channelId ?? ch.channel_id
      console.log(`    Closing channel ${chId}...`)

      // 1. Request close from ClearNode
      const closeRes = await client.closeChannelRPC(wallet, chId)

      // 2. Build FinalState from response (server sends snake_case)
      const r = closeRes
      const state = r.state
      const finalState: FinalState = {
        channelId: r.channelId ?? r.channel_id,
        intent: StateIntent.FINALIZE,
        version: BigInt(state.version),
        data: state.stateData ?? state.state_data,
        allocations: state.allocations.map((a: any) => ({
          destination: a.destination,
          token: a.token,
          amount: BigInt(a.amount),
        })),
        serverSignature: r.serverSignature ?? r.server_signature,
      }

      // 4. Close on-chain
      const stateData = state.stateData ?? state.state_data
      const params: CloseChannelParams = { stateData, finalState }
      const txHash = await nitroliteClient.closeChannel(params)
      console.log(`    Closed on-chain: ${txHash}`)

      // Track user allocation for withdrawal
      const userAlloc = closeRes.state.allocations.find(
        (a) => a.destination.toLowerCase() === wallet.address.toLowerCase()
      )
      if (userAlloc && BigInt(userAlloc.amount) > 0n) {
        const token = userAlloc.token as Address
        const prev = tokenAmounts.get(token) ?? 0n
        tokenAmounts.set(token, prev + BigInt(userAlloc.amount))
      }
    }

    // 4. Withdraw all funds from custody (based on actual custody balance)
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

    // 5. Check remaining custody balance
    for (const token of [ETH_ADDRESS, USDC_ADDRESS]) {
      const balance = await nitroliteClient.getAccountBalance(token)
      const symbol = token === ETH_ADDRESS ? 'ETH' : 'USDC'
      const formatted = token === ETH_ADDRESS ? formatEther(balance) : formatUnits(balance, 6)
      console.log(`    Custody ${symbol}: ${formatted}`)
    }
  } finally {
    client.close()
  }
}

async function main() {
  console.log('=== Close Channels & Withdraw ===\n')

  const wallets = loadWallets()
  if (wallets.length === 0) {
    console.log('No wallets found. Set WALLET_X_PRIVATE_KEY env vars.')
    return
  }

  // Get config
  const configClient = new CloseClient()
  await configClient.connect()
  const authWallet = wallets[0]
  await configClient.authenticate(authWallet)
  const msg = createGetConfigMessageV2()
  const res = await configClient.send(msg)
  const config = parseConfigResponse(res)
  configClient.close()

  console.log(`Broker: ${config.broker_address}`)

  for (const wallet of wallets) {
    try {
      await closeWalletChannels(wallet, config)
    } catch (e) {
      console.error(`    Error for ${wallet.name}: ${e}`)
    }
  }

  console.log('\nDone!')
}

main().catch(console.error)
