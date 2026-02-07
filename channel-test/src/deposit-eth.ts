import { Wallet } from 'ethers'
import { createPublicClient, createWalletClient, http, parseEther, type Address, type Hex } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'
const CUSTODY_ADDRESS = '0x019B65A265EB3363822f2752141b3dF16131b262' as Address

// Minimal Custody ABI for deposit
const CUSTODY_ABI = [
  {
    name: 'deposit',
    type: 'function',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
] as const

const WALLET_NAMES = ['A', 'B', 'C'] as const
const DEPOSIT_AMOUNTS: Record<string, string> = {
  A: '0.003',
  B: '0.004',
  C: '0.003',
}

async function main() {
  console.log('=== Direct ETH Deposit to Custody ===\n')

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  })

  for (const name of WALLET_NAMES) {
    const key = process.env[`WALLET_${name}_PRIVATE_KEY`]
    if (!key) {
      console.log(`${name}: Missing private key`)
      continue
    }

    const amount = DEPOSIT_AMOUNTS[name]
    const account = privateKeyToAccount(key as Hex)

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    })

    console.log(`${name} (${account.address}): Depositing ${amount} ETH...`)

    try {
      // Deposit native ETH (token = 0x0, send value)
      const hash = await walletClient.writeContract({
        address: CUSTODY_ADDRESS,
        abi: CUSTODY_ABI,
        functionName: 'deposit',
        args: ['0x0000000000000000000000000000000000000000', parseEther(amount)],
        value: parseEther(amount),
      })

      console.log(`  Tx: ${hash}`)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log(`  Confirmed in block ${receipt.blockNumber}`)
    } catch (e) {
      console.log(`  Error: ${e}`)
    }
  }

  console.log('\nDone! Run "bun start" to test.')
}

main().catch(console.error)
