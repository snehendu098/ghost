import { Wallet } from 'ethers'

const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const

console.log('=== Generating Wallets ===\n')

const wallets: { name: string; address: string; privateKey: string }[] = []

for (const name of WALLET_NAMES) {
  const wallet = Wallet.createRandom()
  wallets.push({
    name,
    address: wallet.address,
    privateKey: wallet.privateKey,
  })
  console.log(`Wallet ${name}:`)
  console.log(`  Address: ${wallet.address}`)
  console.log(`  Private Key: ${wallet.privateKey}`)
  console.log()
}

// Output .env format
console.log('=== .env Format ===\n')
console.log('CLEARNODE_URL=wss://clearnet-sandbox.yellow.com/ws')
for (const w of wallets) {
  console.log(`WALLET_${w.name}_PRIVATE_KEY=${w.privateKey}`)
}
console.log()

// Output funding instructions
console.log('=== Fund Wallets via Faucet ===\n')
console.log('Base Sepolia faucets:')
console.log('  https://www.alchemy.com/faucets/base-sepolia')
console.log('  https://faucet.quicknode.com/base/sepolia')
console.log()
console.log('Addresses to fund:')
for (const w of wallets) {
  console.log(`  ${w.name}: ${w.address}`)
}
