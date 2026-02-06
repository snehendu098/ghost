import { createPublicClient, createWalletClient, http, type Address, type Hex } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import {
  NitroliteClient,
  WalletStateSigner,
  type ContractAddresses,
  type CreateChannelParams,
  type Channel,
  type UnsignedState,
  StateIntent,
} from '@erc7824/nitrolite'

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'

// Base Sepolia
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000' as Address
export const BASE_SEPOLIA_CHAIN_ID = 84532

export interface CreateChannelResponse {
  channel_id: Hex
  server_signature: Hex
  channel: {
    participants: [Address, Address]
    adjudicator: Address
    challenge: bigint
    nonce: bigint
  }
  state: {
    intent: number
    version: bigint
    state_data: Hex
    allocations: { destination: Address; token: Address; amount: bigint }[]
  }
}

export interface ConfigResponse {
  broker_address: Address
  networks: {
    chain_id: number
    custody_address: Address
    adjudicator_address: Address
  }[]
}

export function createNitroliteClient(
  privateKey: Hex,
  addresses: ContractAddresses
): NitroliteClient {
  const account = privateKeyToAccount(privateKey)

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  })

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(RPC_URL),
  })

  const stateSigner = new WalletStateSigner(walletClient)

  return new NitroliteClient({
    publicClient,
    walletClient,
    stateSigner,
    addresses,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    challengeDuration: BigInt(86400),
  })
}

export function parseConfigResponse(res: unknown): ConfigResponse {
  const r = res as { res: [number, string, ConfigResponse] }
  return r.res[2]
}

export function parseCreateChannelResponse(res: unknown): CreateChannelResponse {
  const r = res as { res: [number, string, CreateChannelResponse] }
  return r.res[2]
}

export function buildCreateChannelParams(
  response: CreateChannelResponse
): CreateChannelParams {
  const channel: Channel = {
    participants: response.channel.participants,
    adjudicator: response.channel.adjudicator,
    challenge: BigInt(response.channel.challenge),
    nonce: BigInt(response.channel.nonce),
  }

  const unsignedInitialState: UnsignedState = {
    intent: response.state.intent as StateIntent,
    version: BigInt(response.state.version),
    data: response.state.state_data,
    allocations: response.state.allocations.map((a) => ({
      destination: a.destination,
      token: a.token,
      amount: BigInt(a.amount),
    })),
  }

  return {
    channel,
    unsignedInitialState,
    serverSignature: response.server_signature,
  }
}

export async function depositAndCreateChannel(
  client: NitroliteClient,
  tokenAddress: Address,
  depositAmount: bigint,
  params: CreateChannelParams
): Promise<{ channelId: Hex; txHash: Hex }> {
  // Approve tokens if ERC20
  if (tokenAddress !== ETH_ADDRESS) {
    const allowance = await client.getTokenAllowance(tokenAddress)
    if (allowance < depositAmount) {
      console.log(`    Approving ${depositAmount} tokens...`)
      await client.approveTokens(tokenAddress, depositAmount)
    }
  }

  console.log(`    Depositing ${depositAmount} and creating channel...`)
  const result = await client.depositAndCreateChannel(tokenAddress, depositAmount, params)

  return {
    channelId: result.channelId,
    txHash: result.txHash,
  }
}
