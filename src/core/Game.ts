// 遊戲主控制器
import { GameState, Player, Space, Property, Station, Utility, Stock, SpaceType } from '../types'
import { BOARD_SPACES, INITIAL_STOCKS } from '../data/boardData'
import { StockMarket } from './StockMarket'
import { CardDeck } from './CardDeck'

export class Game {
  state: GameState
  stockMarket: StockMarket
  chanceCards: CardDeck
  communityCards: CardDeck
  onStateChange: ((state: GameState) => void) | null = null

  constructor(playerNames: string[]) {
    // 初始化玩家
    const playerColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']
    const players: Player[] = playerNames.map((name, index) => ({
      id: index,
      name,
      money: 15000,
      position: 0,
      color: playerColors[index],
      inJail: false,
      jailTurns: 0,
      properties: [],
      stocks: new Map(),
      bankrupted: false
    }))

    // 初始化棋盤空間
    const spaces = this.initializeSpaces()

    // 初始化股票
    const stocks = INITIAL_STOCKS.map(s => ({
      ...s,
      history: [s.price],
      change: 0
    }))

    this.state = {
      players,
      currentPlayerIndex: 0,
      spaces,
      stocks,
      turn: 1,
      dice: [0, 0],
      gameOver: false,
      winner: null
    }

    this.stockMarket = new StockMarket(this)
    this.chanceCards = new CardDeck('chance', this)
    this.communityCards = new CardDeck('community', this)
  }

  private initializeSpaces(): Space[] {
    return BOARD_SPACES as Space[]
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex]
  }

  rollDice(): [number, number] {
    const dice1 = Math.floor(Math.random() * 6) + 1
    const dice2 = Math.floor(Math.random() * 6) + 1
    this.state.dice = [dice1, dice2]
    return [dice1, dice2]
  }

  movePlayer(player: Player, steps: number) {
    const oldPosition = player.position
    player.position = (player.position + steps) % 40

    // 經過起點獲得獎勵
    if (player.position < oldPosition) {
      player.money += 2000
      this.log(`${player.name} 經過起點，獲得 $2000`)
    }

    this.notifyStateChange()
  }

  async handleSpace(player: Player, space: Space) {
    switch (space.type) {
      case SpaceType.PROPERTY:
      case SpaceType.STATION:
      case SpaceType.UTILITY:
        await this.handlePropertySpace(player, space as Property | Station | Utility)
        break
      case SpaceType.CHANCE:
        this.chanceCards.draw(player)
        break
      case SpaceType.COMMUNITY_CHEST:
        this.communityCards.draw(player)
        break
      case SpaceType.TAX:
        this.handleTax(player, space)
        break
      case SpaceType.GO_TO_JAIL:
        this.sendToJail(player)
        break
      case SpaceType.STOCK_MARKET:
        // 股市交易介面將由UI處理
        break
    }
  }

  private async handlePropertySpace(player: Player, property: Property | Station | Utility) {
    const prop = property as any

    if (prop.owner === null) {
      // 無主地產，可以購買
      return  // UI will handle purchase
    } else if (prop.owner !== player.id && !prop.mortgaged) {
      // 支付租金
      const rent = this.calculateRent(property)
      const owner = this.state.players[prop.owner]

      if (player.money >= rent) {
        player.money -= rent
        owner.money += rent
        this.log(`${player.name} 支付 $${rent} 租金給 ${owner.name}`)
      } else {
        this.log(`${player.name} 沒有足夠的錢支付租金！`)
        // TODO: Handle bankruptcy
      }
    }

    this.notifyStateChange()
  }

  calculateRent(property: Property | Station | Utility): number {
    const prop = property as any

    if (property.type === SpaceType.PROPERTY) {
      const p = prop as Property
      return p.rent[p.houses]
    } else if (property.type === SpaceType.STATION) {
      const station = prop as Station
      const owner = this.state.players[station.owner!]
      const stationCount = this.state.spaces
        .filter(s => s.type === SpaceType.STATION && (s as Station).owner === owner.id)
        .length
      return station.rent[stationCount - 1]
    } else if (property.type === SpaceType.UTILITY) {
      const owner = this.state.players[prop.owner!]
      const utilityCount = this.state.spaces
        .filter(s => s.type === SpaceType.UTILITY && (s as Utility).owner === owner.id)
        .length
      const diceSum = this.state.dice[0] + this.state.dice[1]
      return utilityCount === 1 ? diceSum * 40 : diceSum * 100
    }

    return 0
  }

  buyProperty(player: Player, spaceId: number): boolean {
    const space = this.state.spaces[spaceId] as any

    if (space.owner !== null || space.owner !== undefined) {
      return false
    }

    if (player.money < space.price) {
      this.log(`${player.name} 沒有足夠的錢購買 ${space.name}`)
      return false
    }

    player.money -= space.price
    space.owner = player.id
    player.properties.push(spaceId)

    this.log(`${player.name} 購買了 ${space.name}，花費 $${space.price}`)
    this.notifyStateChange()
    return true
  }

  upgradeProperty(player: Player, spaceId: number): boolean {
    const space = this.state.spaces[spaceId]

    if (space.type !== SpaceType.PROPERTY) {
      return false
    }

    const property = space as Property

    if (property.owner !== player.id) {
      return false
    }

    if (property.houses >= 5) {
      this.log(`${property.name} 已經達到最高等級`)
      return false
    }

    // 檢查是否擁有整組地產
    if (!this.hasMonopoly(player, property.color)) {
      this.log(`必須擁有整組相同顏色的地產才能升級`)
      return false
    }

    if (player.money < property.houseCost) {
      this.log(`${player.name} 沒有足夠的錢升級 ${property.name}`)
      return false
    }

    player.money -= property.houseCost
    property.houses++

    const buildingType = property.houses === 5 ? '飯店' : `${property.houses}棟房屋`
    this.log(`${player.name} 在 ${property.name} 建造了 ${buildingType}`)

    this.notifyStateChange()
    return true
  }

  hasMonopoly(player: Player, color: string): boolean {
    const sameColorProps = this.state.spaces.filter(
      s => s.type === SpaceType.PROPERTY && (s as Property).color === color
    ) as Property[]

    return sameColorProps.every(p => p.owner === player.id)
  }

  private handleTax(player: Player, space: Space) {
    const tax = space.id === 4 ? 2000 : 1000  // 所得稅 vs 奢侈稅
    player.money -= tax
    this.log(`${player.name} 繳納了 $${tax} 的稅金`)
    this.notifyStateChange()
  }

  private sendToJail(player: Player) {
    player.position = 10  // 監獄位置
    player.inJail = true
    player.jailTurns = 0
    this.log(`${player.name} 被送進監獄`)
    this.notifyStateChange()
  }

  endTurn() {
    // 更新股市
    this.stockMarket.updatePrices()

    // 下一個玩家
    do {
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length
    } while (this.getCurrentPlayer().bankrupted && !this.state.gameOver)

    // 檢查遊戲是否結束
    const activePlayers = this.state.players.filter(p => !p.bankrupted)
    if (activePlayers.length === 1) {
      this.state.gameOver = true
      this.state.winner = activePlayers[0].id
      this.log(`🎉 ${activePlayers[0].name} 贏得了遊戲！`)
    }

    if (this.state.currentPlayerIndex === 0) {
      this.state.turn++
    }

    this.notifyStateChange()
  }

  private log(message: string) {
    console.log(`[回合 ${this.state.turn}] ${message}`)
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.state)
    }
  }
}
