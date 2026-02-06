import { createPublicClient, http, formatEther, formatUnits, type Address } from 'viem'
import { baseSepolia } from 'viem/chains'
import { Wallet } from 'ethers'

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'
const YTEST_USD_ADDRESS = '0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb' as Address
const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

async function main() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  })

  console.log('=== Wallet Balances (Ethereum Sepolia) ===\n')

  for (const name of WALLET_NAMES) {
    const key = process.env[`WALLET_${name}_PRIVATE_KEY`]
    if (!key) {
      console.log(`${name}: Missing private key`)
      continue
    }

    const wallet = new Wallet(key)
    const address = wallet.address as Address

    const [ethBalance, ytestBalance] = await Promise.all([
      client.getBalance({ address }),
      client.readContract({
        address: YTEST_USD_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      }),
    ])

    console.log(`${name} (${address}):`)
    console.log(`  ETH:       ${formatEther(ethBalance)}`)
    console.log(`  ytest.usd: ${formatUnits(ytestBalance, 6)}`)
    console.log()
  }
}

main().catch(console.error)
