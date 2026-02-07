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

export interface Wallet {
  name: string
  address: string
  privateKey: string
}

export interface ChannelState {
  channelId: string
  participants: string[]
  balances: Record<string, string>
}
