import { Wallet } from 'ethers'
import { createECDSAMessageSigner, type MessageSigner } from '@erc7824/nitrolite'
import type { Hex } from 'viem'
import type { Wallet as WalletInfo } from './types.ts'

const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const
type WalletName = typeof WALLET_NAMES[number]

export interface LoadedWallet extends WalletInfo {
  ethersWallet: Wallet
  signer: MessageSigner
}

export function loadWallets(): Map<WalletName, LoadedWallet> {
  const wallets = new Map<WalletName, LoadedWallet>()

  for (const name of WALLET_NAMES) {
    const key = process.env[`WALLET_${name}_PRIVATE_KEY`]
    if (!key) {
      throw new Error(`Missing WALLET_${name}_PRIVATE_KEY in env`)
    }

    const ethersWallet = new Wallet(key)
    const signer = createECDSAMessageSigner(key as Hex)

    wallets.set(name, {
      name,
      address: ethersWallet.address,
      privateKey: key,
      ethersWallet,
      signer,
    })
  }

  return wallets
}

export function getWallet(wallets: Map<WalletName, LoadedWallet>, name: WalletName): LoadedWallet {
  const w = wallets.get(name)
  if (!w) throw new Error(`Wallet ${name} not found`)
  return w
}
