import {
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createEIP712AuthMessageSigner,
  createGetLedgerBalancesMessage,
  NitroliteRPC,
  RPCMethod,
  RPCProtocolVersion,
  RPCAppStateIntent,
  type RPCBalance,
  type RPCAppSessionAllocation,
  type RPCAppDefinition,
  type MessageSigner,
} from '@erc7824/nitrolite'
import { createWalletClient, http, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import type { LoadedWallet } from './types.ts'
import { CLEARNODE_URL, APP_NAME } from './config.ts'

interface PendingRequest {
  resolve: (data: unknown) => void
  reject: (err: Error) => void
}

export class ClearNodeClient {
  private ws: WebSocket | null = null
  private wallet: LoadedWallet
  private pending = new Map<number, PendingRequest>()
  private reqId = 1
  private authenticated = false

  constructor(wallet: LoadedWallet) {
    this.wallet = wallet
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(CLEARNODE_URL)

      this.ws.onopen = async () => {
        try {
          await this.authenticate()
          this.authenticated = true
          resolve()
        } catch (e) {
          reject(e)
        }
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string)
      }

      this.ws.onerror = (e) => {
        reject(new Error(`WebSocket error: ${e}`))
      }

      this.ws.onclose = () => {
        this.authenticated = false
      }
    })
  }

  private async authenticate(): Promise<void> {
    const walletAddress = this.wallet.address as Address
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400)

    const authReq = await createAuthRequestMessage({
      address: walletAddress,
      session_key: walletAddress,
      application: APP_NAME,
      allowances: [],
      expires_at: expiresAt,
      scope: 'console',
    })

    const challengeRes = await this.sendRaw(authReq)
    const parsed = JSON.parse(challengeRes)

    if (!parsed.res || parsed.res[1] !== 'auth_challenge') {
      throw new Error(`Auth failed: ${challengeRes}`)
    }

    const challenge = parsed.res[2].challenge_message

    const account = privateKeyToAccount(this.wallet.privateKey)
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    })

    const eip712Signer = createEIP712AuthMessageSigner(
      walletClient,
      {
        scope: 'console',
        session_key: walletAddress,
        expires_at: expiresAt,
        allowances: [],
      },
      { name: APP_NAME },
    )

    const verifyMsg = await createAuthVerifyMessageFromChallenge(
      eip712Signer,
      challenge,
    )

    const verifyRes = await this.sendRaw(verifyMsg)
    const verifyParsed = JSON.parse(verifyRes)

    if (!verifyParsed.res || verifyParsed.res[1] !== 'auth_verify') {
      throw new Error(`Auth verify failed: ${verifyRes}`)
    }

    if (!verifyParsed.res[2].success) {
      throw new Error('Auth verify returned success=false')
    }
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
      // ignore parse errors
    }
  }

  private sendRaw(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'))
      }

      const parsed = JSON.parse(message)
      const reqId = parsed.req?.[0]

      if (reqId) {
        this.pending.set(reqId, {
          resolve: (data) => resolve(JSON.stringify(data)),
          reject,
        })
      }

      this.ws.send(message)

      if (!reqId) {
        setTimeout(() => resolve(''), 100)
      }
    })
  }

  async send(message: string): Promise<unknown> {
    const res = await this.sendRaw(message)
    return JSON.parse(res)
  }

  async getLedgerBalances(): Promise<RPCBalance[]> {
    const msg = await createGetLedgerBalancesMessage(this.wallet.signer)
    const res = (await this.send(msg)) as {
      res: [number, string, { ledger_balances: RPCBalance[] }]
    }
    return res.res[2].ledger_balances
  }

  /**
   * Create global app session — ALL participants must sign for creation.
   * Server is index 0 with weight=100, quorum=100.
   */
  async createGlobalAppSession(
    participants: Address[],
    allocations: RPCAppSessionAllocation[],
    allSigners: MessageSigner[],
    nonce?: number,
  ): Promise<Hex> {
    // Server = index 0 (weight 100), participants = index 1+ (weight 1)
    const weights = participants.map((_, i) => (i === 0 ? 100 : 1))

    const definition: RPCAppDefinition = {
      application: APP_NAME,
      protocol: RPCProtocolVersion.NitroRPC_0_4,
      participants,
      weights,
      quorum: 100,
      challenge: 86400,
      nonce: nonce ?? Date.now(),
    }

    const request = NitroliteRPC.createRequest({
      method: RPCMethod.CreateAppSession,
      params: { definition, allocations },
    })

    // All participants sign
    const sigs = await Promise.all(allSigners.map((s) => s(request.req!)))
    request.sig = sigs

    const res = (await this.send(JSON.stringify(request))) as {
      res: [number, string, { app_session_id: Hex }]
    }
    return res.res[2].app_session_id
  }

  /**
   * Submit app state — server only (weight=100 meets quorum=100).
   */
  async submitAppStateServerOnly(
    appSessionId: Hex,
    version: number,
    allocations: RPCAppSessionAllocation[],
    serverSigner: MessageSigner,
  ): Promise<void> {
    const request = NitroliteRPC.createRequest({
      method: RPCMethod.SubmitAppState,
      params: {
        app_session_id: appSessionId,
        intent: RPCAppStateIntent.Operate,
        version,
        allocations,
      },
    })

    const sig = await serverSigner(request.req!)
    request.sig = [sig]

    await this.send(JSON.stringify(request))
  }

  /**
   * Close app session — server only (weight=100 meets quorum=100).
   */
  async closeAppSessionServerOnly(
    appSessionId: Hex,
    allocations: RPCAppSessionAllocation[],
    serverSigner: MessageSigner,
  ): Promise<void> {
    const request = NitroliteRPC.createRequest({
      method: RPCMethod.CloseAppSession,
      params: {
        app_session_id: appSessionId,
        allocations,
      },
    })

    const sig = await serverSigner(request.req!)
    request.sig = [sig]

    await this.send(JSON.stringify(request))
  }

  close(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  get isAuthenticated(): boolean {
    return this.authenticated
  }

  get address(): string {
    return this.wallet.address
  }

  get signer(): MessageSigner {
    return this.wallet.signer
  }
}

/**
 * Connect server + all participant wallets to ClearNode.
 * Returns server client + map of participant clients.
 */
export async function connect(
  serverWallet: LoadedWallet,
  participantWallets: LoadedWallet[],
): Promise<{ serverClient: ClearNodeClient; participantClients: Map<string, ClearNodeClient> }> {
  console.log('=== Step 2: Connect to ClearNode ===\n')

  // Connect server
  const serverClient = new ClearNodeClient(serverWallet)
  await serverClient.connect()
  console.log(`  SERVER: Connected (${serverWallet.address})`)

  // Connect participants
  const participantClients = new Map<string, ClearNodeClient>()
  for (const wallet of participantWallets) {
    const client = new ClearNodeClient(wallet)
    try {
      await client.connect()
      participantClients.set(wallet.name, client)
      console.log(`  ${wallet.name}: Connected (${wallet.address})`)
    } catch (e) {
      console.error(`  ${wallet.name}: Failed - ${e}`)
    }
  }

  console.log()
  return { serverClient, participantClients }
}
