import { createPublicClient, http, formatEther, formatUnits, type Address } from 'viem'
import { baseSepolia } from 'viem/chains'
import { Wallet } from 'ethers'

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address
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

    const [ethBalance, usdcBalance] = await Promise.all([
      client.getBalance({ address }),
      client.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      }),
    ])

    console.log(`${name} (${address}):`)
    console.log(`  ETH:  ${formatEther(ethBalance)}`)
    console.log(`  USDC: ${formatUnits(usdcBalance, 6)}`)
    console.log()
  }
}

main().catch(console.error)
