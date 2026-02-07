import { Wallet } from 'ethers'
import { createWalletClient, http, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import {
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner,
  createGetConfigMessageV2,
  createCreateChannelMessage,
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
} from '@erc7824/nitrolite'
import {
  createNitroliteClient,
  parseConfigResponse,
  parseCreateChannelResponse,
  buildCreateChannelParams,
  depositAndCreateChannel,
  BASE_SEPOLIA_CHAIN_ID,
  ETH_ADDRESS,
  USDC_ADDRESS,
  type ConfigResponse,
} from './onchain.ts'

const CLEARNODE_URL = process.env.CLEARNODE_URL || 'wss://clearnet-sandbox.yellow.com/ws'
const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const
const APP_NAME = 'ghost-matcher'

// Per-wallet deposits for ETH/USD swap simulation
// Sellers (A,B,C) deposit ETH, Buyers (D,F) deposit USDC
const WALLET_DEPOSITS: Record<string, { token: Address; amount: bigint }> = {
  A: { token: ETH_ADDRESS, amount: BigInt('3000000000000000') },   // 0.003 ETH
  B: { token: ETH_ADDRESS, amount: BigInt('4000000000000000') },   // 0.004 ETH
  C: { token: ETH_ADDRESS, amount: BigInt('3000000000000000') },   // 0.003 ETH
  D: { token: USDC_ADDRESS, amount: BigInt('4000000') },           // 4 USDC
  F: { token: USDC_ADDRESS, amount: BigInt('1000000') },           // 1 USDC
}

interface WalletData {
  name: string
  address: string
  privateKey: Hex
  signer: ReturnType<typeof createECDSAMessageSigner>
}

function loadOrGenerateWallets(): WalletData[] {
  const wallets: WalletData[] = []

  for (const name of WALLET_NAMES) {
    let key = process.env[`WALLET_${name}_PRIVATE_KEY`]

    if (!key) {
      console.log(`Generating new wallet for ${name}...`)
      const w = Wallet.createRandom()
      key = w.privateKey
    }

    const ethersWallet = new Wallet(key)
    wallets.push({
      name,
      address: ethersWallet.address,
      privateKey: key as Hex,
      signer: createECDSAMessageSigner(key as Hex),
    })
  }

  return wallets
}

class SetupClient {
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

    // Create EIP-712 signer for auth
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

  async getConfig(): Promise<ConfigResponse> {
    const msg = createGetConfigMessageV2()
    const res = await this.send(msg)
    return parseConfigResponse(res)
  }

  async createChannelRPC(wallet: WalletData, chainId: number, token: Address) {
    const msg = await createCreateChannelMessage(wallet.signer, {
      chain_id: chainId,
      token,
    })
    const res = await this.send(msg)
    return parseCreateChannelResponse(res)
  }

  close(): void {
    this.ws?.close()
  }
}

async function setupWallet(
  wallet: WalletData,
  config: ConfigResponse,
  token: Address,
  depositAmount: bigint
): Promise<void> {
  console.log(`\n  Setting up ${wallet.name} (${wallet.address})`)

  // Each wallet needs its own authenticated connection
  const client = new SetupClient()
  await client.connect()

  try {
    // 1. Authenticate
    console.log(`    Authenticating...`)
    await client.authenticate(wallet)

    // 2. Request channel creation from ClearNode
    console.log(`    Requesting channel creation...`)
    const channelRes = await client.createChannelRPC(wallet, BASE_SEPOLIA_CHAIN_ID, token)
    console.log(`    Channel ID: ${channelRes.channel_id}`)

    // 3. Get contract addresses
    const network = config.networks.find((n) => n.chain_id === BASE_SEPOLIA_CHAIN_ID)
    if (!network) {
      throw new Error(`Network ${BASE_SEPOLIA_CHAIN_ID} not found in config`)
    }

    // 4. Create on-chain transaction
    const nitroliteClient = createNitroliteClient(wallet.privateKey, {
      custody: network.custody_address,
      adjudicator: network.adjudicator_address,
    })

    const params = buildCreateChannelParams(channelRes)
    const result = await depositAndCreateChannel(nitroliteClient, token, depositAmount, params)
    console.log(`    Tx hash: ${result.txHash}`)
    console.log(`    Channel created successfully!`)
  } finally {
    client.close()
  }
}

async function main() {
  console.log('=== Programmatic Channel Setup ===\n')

  // 1. Load or generate wallets
  console.log('Loading wallets...')
  const wallets = loadOrGenerateWallets()
  for (const w of wallets) {
    console.log(`  ${w.name}: ${w.address}`)
  }

  // 2. Get config (temporary connection)
  console.log('\nFetching config...')
  const configClient = new SetupClient()
  await configClient.connect()
  const config = await configClient.getConfig()
  configClient.close()

  console.log(`  Broker: ${config.broker_address}`)
  for (const n of config.networks) {
    console.log(`  Network ${n.chain_id}:`)
    console.log(`    Custody: ${n.custody_address}`)
    console.log(`    Adjudicator: ${n.adjudicator_address}`)
  }

  // 3. Setup each wallet (each gets own connection)
  console.log('\n=== Setting up wallets ===')
  console.log(`  ETH sellers: A, B, C`)
  console.log(`  USD buyers: D, F (using USDC)`)

  for (const wallet of wallets) {
    const deposit = WALLET_DEPOSITS[wallet.name]
    if (!deposit) continue

    try {
      await setupWallet(wallet, config, deposit.token, deposit.amount)
    } catch (e) {
      console.error(`    Error: ${e}`)
    }
  }

  // 4. Output .env
  console.log('\n=== Generated .env ===\n')
  console.log(`CLEARNODE_URL=${CLEARNODE_URL}`)
  for (const w of wallets) {
    console.log(`WALLET_${w.name}_PRIVATE_KEY=${w.privateKey}`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
