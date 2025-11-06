// 股市系统
import { Stock, Player } from '../types'
import { Game } from './Game'

export class StockMarket {
  private game: Game

  constructor(game: Game) {
    this.game = game
  }

  updatePrices() {
    this.game.state.stocks.forEach(stock => {
      // 随机波动 -10% 到 +10%
      const changePercent = (Math.random() - 0.5) * 20
      const oldPrice = stock.price
      const newPrice = Math.max(10, Math.round(stock.price * (1 + changePercent / 100)))

      stock.price = newPrice
      stock.change = ((newPrice - oldPrice) / oldPrice) * 100
      stock.history.push(newPrice)

      // 只保留最近20个价格历史
      if (stock.history.length > 20) {
        stock.history.shift()
      }
    })
  }

  buyStock(player: Player, symbol: string, quantity: number): boolean {
    const stock = this.game.state.stocks.find(s => s.symbol === symbol)
    if (!stock) return false

    const cost = stock.price * quantity
    if (player.money < cost) {
      console.log(`${player.name} 沒有足夠的錢購買股票`)
      return false
    }

    player.money -= cost
    const currentQty = player.stocks.get(symbol) || 0
    player.stocks.set(symbol, currentQty + quantity)

    console.log(`${player.name} 購買了 ${quantity} 股 ${stock.name}，花費 $${cost}`)
    return true
  }

  sellStock(player: Player, symbol: string, quantity: number): boolean {
    const stock = this.game.state.stocks.find(s => s.symbol === symbol)
    if (!stock) return false

    const currentQty = player.stocks.get(symbol) || 0
    if (currentQty < quantity) {
      console.log(`${player.name} 沒有足夠的股票可賣`)
      return false
    }

    const revenue = stock.price * quantity
    player.money += revenue
    player.stocks.set(symbol, currentQty - quantity)

    if (player.stocks.get(symbol) === 0) {
      player.stocks.delete(symbol)
    }

    console.log(`${player.name} 賣出了 ${quantity} 股 ${stock.name}，獲得 $${revenue}`)
    return true
  }

  getPortfolioValue(player: Player): number {
    let total = 0
    player.stocks.forEach((quantity, symbol) => {
      const stock = this.game.state.stocks.find(s => s.symbol === symbol)
      if (stock) {
        total += stock.price * quantity
      }
    })
    return total
  }

  getTotalAssets(player: Player): number {
    let total = player.money

    // 地产价值
    player.properties.forEach(propId => {
      const space = this.game.state.spaces[propId] as any
      if (space.price) {
        total += space.price
        if (space.houses) {
          total += space.houses * space.houseCost
        }
      }
    })

    // 股票价值
    total += this.getPortfolioValue(player)

    return total
  }
}
