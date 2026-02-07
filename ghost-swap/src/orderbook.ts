import type { Order, Match } from './types.ts'

export class OrderBook {
  private sells: Order[] = []
  private buys: Order[] = []
  private orderId = 0

  addSellOrder(participant: string, ethAmount: string, price: number): Order {
    const order: Order = {
      id: `sell-${++this.orderId}`,
      participant,
      side: 'sell',
      ethAmount,
      price,
      timestamp: Date.now(),
    }
    this.sells.push(order)
    return order
  }

  addBuyOrder(participant: string, ethAmount: string, price: number): Order {
    const order: Order = {
      id: `buy-${++this.orderId}`,
      participant,
      side: 'buy',
      ethAmount,
      price,
      timestamp: Date.now(),
    }
    this.buys.push(order)
    return order
  }

  matchOrders(): Match[] {
    const matches: Match[] = []

    // Sort by price-time (FIFO at same price)
    // Sells: ascending price (lowest first)
    // Buys: descending price (highest first)
    const sortedSells = [...this.sells].sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price
      return a.timestamp - b.timestamp
    })

    const sortedBuys = [...this.buys].sort((a, b) => {
      if (a.price !== b.price) return b.price - a.price
      return a.timestamp - b.timestamp
    })

    // Track remaining amounts
    const sellRemaining = new Map<string, number>()
    const buyRemaining = new Map<string, number>()

    for (const s of sortedSells) {
      sellRemaining.set(s.id, parseFloat(s.ethAmount))
    }
    for (const b of sortedBuys) {
      buyRemaining.set(b.id, parseFloat(b.ethAmount))
    }

    // Match orders
    for (const buy of sortedBuys) {
      let buyQty = buyRemaining.get(buy.id) || 0

      for (const sell of sortedSells) {
        if (buyQty <= 0) break
        if (sell.price > buy.price) continue // price doesn't cross

        const sellQty = sellRemaining.get(sell.id) || 0
        if (sellQty <= 0) continue

        const matchQty = Math.min(buyQty, sellQty)
        const usdcAmount = (matchQty * sell.price).toString()

        matches.push({
          seller: sell.participant,
          buyer: buy.participant,
          ethAmount: matchQty.toString(),
          usdcAmount,
        })

        sellRemaining.set(sell.id, sellQty - matchQty)
        buyQty -= matchQty
      }

      buyRemaining.set(buy.id, buyQty)
    }

    return matches
  }

  getSells(): Order[] {
    return [...this.sells]
  }

  getBuys(): Order[] {
    return [...this.buys]
  }

  clear(): void {
    this.sells = []
    this.buys = []
  }
}
