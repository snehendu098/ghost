import { Wallet } from 'ethers'

const FAUCET_URL = 'https://clearnet-sandbox.yellow.com/faucet/requestTokens'
const WALLET_NAMES = ['A', 'B', 'C', 'D', 'F'] as const

async function requestTokens(address: string): Promise<void> {
  const res = await fetch(FAUCET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress: address }),
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  console.log(`  Response:`, JSON.stringify(data))
}

async function main() {
  console.log('=== Requesting ytest.USD from Yellow Faucet ===\n')

  for (const name of WALLET_NAMES) {
    const key = process.env[`WALLET_${name}_PRIVATE_KEY`]
    if (!key) {
      console.log(`${name}: Missing private key, skipping`)
      continue
    }

    const wallet = new Wallet(key)
    console.log(`${name} (${wallet.address}):`)

    try {
      await requestTokens(wallet.address)
    } catch (e) {
      console.log(`  Error: ${e}`)
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\nDone! Check balances with: bun start')
}

main().catch(console.error)
