// 卡片系统（机会/命运）
import { Card, Player } from '../types'
import { Game } from './Game'

export class CardDeck {
  private cards: Card[]
  private type: 'chance' | 'community'
  private game: Game
  private currentIndex: number = 0

  constructor(type: 'chance' | 'community', game: Game) {
    this.type = type
    this.game = game
    this.cards = this.initializeCards()
    this.shuffle()
  }

  private initializeCards(): Card[] {
    if (this.type === 'chance') {
      return [
        {
          id: 1,
          type: 'chance',
          description: '銀行發放股息，獲得 $500',
          action: (game: Game, player: Player) => {
            player.money += 500
          }
        },
        {
          id: 2,
          type: 'chance',
          description: '前進到起點，獲得 $2000',
          action: (game: Game, player: Player) => {
            player.position = 0
            player.money += 2000
          }
        },
        {
          id: 3,
          type: 'chance',
          description: '股市大漲！所有持股價值增加10%',
          action: (game: Game, player: Player) => {
            player.stocks.forEach((qty, symbol) => {
              const stock = game.state.stocks.find(s => s.symbol === symbol)
              if (stock) {
                stock.price = Math.round(stock.price * 1.1)
              }
            })
          }
        },
        {
          id: 4,
          type: 'chance',
          description: '後退 3 步',
          action: (game: Game, player: Player) => {
            player.position = (player.position - 3 + 40) % 40
          }
        },
        {
          id: 5,
          type: 'chance',
          description: '醫療費用，支付 $500',
          action: (game: Game, player: Player) => {
            player.money -= 500
          }
        },
        {
          id: 6,
          type: 'chance',
          description: '中樂透！獲得 $2000',
          action: (game: Game, player: Player) => {
            player.money += 2000
          }
        },
        {
          id: 7,
          type: 'chance',
          description: '前往監獄',
          action: (game: Game, player: Player) => {
            player.position = 10
            player.inJail = true
            player.jailTurns = 0
          }
        },
        {
          id: 8,
          type: 'chance',
          description: '房屋維修費，每棟房屋 $250，每間飯店 $1000',
          action: (game: Game, player: Player) => {
            let cost = 0
            player.properties.forEach(propId => {
              const space = game.state.spaces[propId] as any
              if (space.houses) {
                cost += space.houses < 5 ? space.houses * 250 : 1000
              }
            })
            player.money -= cost
          }
        }
      ]
    } else {
      return [
        {
          id: 1,
          type: 'community',
          description: '生日快樂！每位玩家給你 $200',
          action: (game: Game, player: Player) => {
            game.state.players.forEach(p => {
              if (p.id !== player.id && !p.bankrupted) {
                p.money -= 200
                player.money += 200
              }
            })
          }
        },
        {
          id: 2,
          type: 'community',
          description: '獲得遺產 $1000',
          action: (game: Game, player: Player) => {
            player.money += 1000
          }
        },
        {
          id: 3,
          type: 'community',
          description: '股市崩盤！所有持股價值減少15%',
          action: (game: Game, player: Player) => {
            player.stocks.forEach((qty, symbol) => {
              const stock = game.state.stocks.find(s => s.symbol === symbol)
              if (stock) {
                stock.price = Math.round(stock.price * 0.85)
              }
            })
          }
        },
        {
          id: 4,
          type: 'community',
          description: '獲得投資收益 $1500',
          action: (game: Game, player: Player) => {
            player.money += 1500
          }
        },
        {
          id: 5,
          type: 'community',
          description: '繳納罰款 $500',
          action: (game: Game, player: Player) => {
            player.money -= 500
          }
        },
        {
          id: 6,
          type: 'community',
          description: '免費獲得一支股票！',
          action: (game: Game, player: Player) => {
            const randomStock = game.state.stocks[Math.floor(Math.random() * game.state.stocks.length)]
            const currentQty = player.stocks.get(randomStock.symbol) || 0
            player.stocks.set(randomStock.symbol, currentQty + 1)
          }
        },
        {
          id: 7,
          type: 'community',
          description: '慈善捐款 $300',
          action: (game: Game, player: Player) => {
            player.money -= 300
          }
        },
        {
          id: 8,
          type: 'community',
          description: '獲得稅務退款 $1000',
          action: (game: Game, player: Player) => {
            player.money += 1000
          }
        }
      ]
    }
  }

  private shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  draw(player: Player): Card {
    const card = this.cards[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.cards.length

    console.log(`${player.name} 抽到${this.type === 'chance' ? '機會' : '命運'}卡: ${card.description}`)
    card.action(this.game, player)

    return card
  }
}
