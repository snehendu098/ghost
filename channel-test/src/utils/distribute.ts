import { createPublicClient, createWalletClient, http, formatEther, formatUnits, parseEther, parseUnits, type Address, type Hex } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { Wallet } from 'ethers'

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org'
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address
const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const

const GAS_BUFFER = parseEther('0.001')

// Required on-chain funds per wallet (deposit + gas)
const REQUIREMENTS: Record<string, { eth: bigint; usdc: bigint }> = {
  A: { eth: parseEther('0.003') + GAS_BUFFER, usdc: 0n },
  B: { eth: parseEther('0.004') + GAS_BUFFER, usdc: 0n },
  C: { eth: parseEther('0.003') + GAS_BUFFER, usdc: 0n },
  D: { eth: GAS_BUFFER, usdc: parseUnits('4', 6) },
  F: { eth: GAS_BUFFER, usdc: parseUnits('1', 6) },
}

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

async function main() {
  const mainKey = process.env.MAIN_WALLET
  if (!mainKey) {
    console.error('MAIN_WALLET not set in .env')
    process.exit(1)
  }

  const mainAccount = privateKeyToAccount(mainKey as Hex)
  const client = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) })
  const walletClient = createWalletClient({ account: mainAccount, chain: baseSepolia, transport: http(RPC_URL) })

  // Check main wallet balances
  const [mainEth, mainUsdc] = await Promise.all([
    client.getBalance({ address: mainAccount.address }),
    client.readContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf', args: [mainAccount.address] }),
  ])

  console.log('=== Fund Distribution ===\n')
  console.log(`Main wallet: ${mainAccount.address}`)
  console.log(`  ETH:  ${formatEther(mainEth)}`)
  console.log(`  USDC: ${formatUnits(mainUsdc, 6)}\n`)

  // Gather shortfalls
  const transfers: { name: string; address: Address; ethNeeded: bigint; usdcNeeded: bigint }[] = []

  for (const name of WALLET_NAMES) {
    const key = process.env[`WALLET_${name}_PRIVATE_KEY`]
    if (!key) {
      console.log(`${name}: Missing private key, skipping`)
      continue
    }

    const wallet = new Wallet(key)
    const address = wallet.address as Address
    const req = REQUIREMENTS[name]

    const [ethBal, usdcBal] = await Promise.all([
      client.getBalance({ address }),
      client.readContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'balanceOf', args: [address] }),
    ])

    const ethNeeded = req.eth > ethBal ? req.eth - ethBal : 0n
    const usdcNeeded = req.usdc > usdcBal ? req.usdc - usdcBal : 0n

    console.log(`${name} (${address}):`)
    console.log(`  Has:  ${formatEther(ethBal)} ETH, ${formatUnits(usdcBal, 6)} USDC`)
    console.log(`  Need: ${ethNeeded > 0n ? formatEther(ethNeeded) + ' ETH' : '0 ETH'}, ${usdcNeeded > 0n ? formatUnits(usdcNeeded, 6) + ' USDC' : '0 USDC'}`)

    transfers.push({ name, address, ethNeeded, usdcNeeded })
  }

  const totalEthNeeded = transfers.reduce((s, t) => s + t.ethNeeded, 0n)
  const totalUsdcNeeded = transfers.reduce((s, t) => s + t.usdcNeeded, 0n)

  console.log(`\nTotal needed: ${formatEther(totalEthNeeded)} ETH, ${formatUnits(totalUsdcNeeded, 6)} USDC`)

  if (totalEthNeeded > mainEth) {
    console.error(`Insufficient ETH! Have ${formatEther(mainEth)}, need ${formatEther(totalEthNeeded)}`)
    process.exit(1)
  }
  if (totalUsdcNeeded > mainUsdc) {
    console.error(`Insufficient USDC! Have ${formatUnits(mainUsdc, 6)}, need ${formatUnits(totalUsdcNeeded, 6)}`)
    process.exit(1)
  }

  if (totalEthNeeded === 0n && totalUsdcNeeded === 0n) {
    console.log('\nAll wallets already funded!')
    return
  }

  // Send ETH transfers
  console.log('\n--- Sending ETH ---')
  for (const t of transfers) {
    if (t.ethNeeded === 0n) continue
    console.log(`  ${t.name}: sending ${formatEther(t.ethNeeded)} ETH...`)
    const hash = await walletClient.sendTransaction({ to: t.address, value: t.ethNeeded })
    await client.waitForTransactionReceipt({ hash })
    console.log(`    tx: ${hash}`)
  }

  // Send USDC transfers
  console.log('\n--- Sending USDC ---')
  for (const t of transfers) {
    if (t.usdcNeeded === 0n) continue
    console.log(`  ${t.name}: sending ${formatUnits(t.usdcNeeded, 6)} USDC...`)
    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [t.address, t.usdcNeeded],
    })
    await client.waitForTransactionReceipt({ hash })
    console.log(`    tx: ${hash}`)
  }

  console.log('\nDone! Run `bun balances` to verify.')
}

main().catch(console.error)
