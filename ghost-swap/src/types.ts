import type { Hex, Address } from 'viem'
import type { MessageSigner } from '@erc7824/nitrolite'
import type { Wallet } from 'ethers'

export interface Order {
  id: string
  participant: string
  side: 'sell' | 'buy'
  ethAmount: string
  price: number // USDC per ETH
  timestamp: number
}

export interface Match {
  seller: string
  buyer: string
  ethAmount: string
  usdcAmount: string
}

export interface LoadedWallet {
  name: string
  address: string
  privateKey: Hex
  ethersWallet: Wallet
  signer: MessageSigner
}

export interface GlobalSession {
  appSessionId: Hex
  participants: Address[]
  version: number
  allocations: { asset: string; amount: string; participant: Address }[]
}
