import { test, expect, describe } from 'bun:test'
import { OrderBook } from './orderbook.ts'

describe('OrderBook', () => {
  test('matches single sell/buy at same price', () => {
    const book = new OrderBook()
    book.addSellOrder('A', '4', 1000)
    book.addBuyOrder('D', '4', 1000)

    const matches = book.matchOrders()

    expect(matches.length).toBe(1)
    expect(matches[0]!.seller).toBe('A')
    expect(matches[0]!.buyer).toBe('D')
    expect(matches[0]!.ethAmount).toBe('4')
    expect(matches[0]!.usdcAmount).toBe('4000')
  })

  test('matches partial fills', () => {
    const book = new OrderBook()
    book.addSellOrder('A', '4', 1000)
    book.addSellOrder('B', '5', 1000)
    book.addBuyOrder('D', '6', 1000)

    const matches = book.matchOrders()

    expect(matches.length).toBe(2)
    // D fills A completely (4 ETH)
    expect(matches[0]!.ethAmount).toBe('4')
    expect(matches[0]!.seller).toBe('A')
    // D fills B partially (2 ETH)
    expect(matches[1]!.ethAmount).toBe('2')
    expect(matches[1]!.seller).toBe('B')
  })

  test('full scenario: A,B,C sell to D,F', () => {
    const book = new OrderBook()

    // Sellers: A=4, B=5, C=3 (total 12)
    book.addSellOrder('A', '4', 1000)
    book.addSellOrder('B', '5', 1000)
    book.addSellOrder('C', '3', 1000)

    // Buyers: D=10, F=1 (total 11)
    book.addBuyOrder('D', '10', 1000)
    book.addBuyOrder('F', '1', 1000)

    const matches = book.matchOrders()

    // Expected: 4 matches
    // D buys from A (4), B (5), C (1) = 10 total
    // F buys from C (1) = 1 total
    expect(matches.length).toBe(4)

    // Verify total ETH traded
    const totalEth = matches.reduce((sum, m) => sum + parseFloat(m.ethAmount), 0)
    expect(totalEth).toBe(11)

    // D should buy 10 total
    const dBuys = matches.filter(m => m.buyer === 'D')
    const dTotal = dBuys.reduce((sum, m) => sum + parseFloat(m.ethAmount), 0)
    expect(dTotal).toBe(10)

    // F should buy 1 total
    const fBuys = matches.filter(m => m.buyer === 'F')
    const fTotal = fBuys.reduce((sum, m) => sum + parseFloat(m.ethAmount), 0)
    expect(fTotal).toBe(1)
  })

  test('no match when prices dont cross', () => {
    const book = new OrderBook()
    book.addSellOrder('A', '4', 1100) // seller wants 1100
    book.addBuyOrder('D', '4', 1000) // buyer offers 1000

    const matches = book.matchOrders()
    expect(matches.length).toBe(0)
  })

  test('price-time priority', () => {
    const book = new OrderBook()

    // B posts lower price first
    book.addSellOrder('B', '2', 900)
    book.addSellOrder('A', '2', 1000)

    book.addBuyOrder('D', '2', 1000)

    const matches = book.matchOrders()

    expect(matches.length).toBe(1)
    // B should match first (lower price)
    expect(matches[0]!.seller).toBe('B')
  })
})
