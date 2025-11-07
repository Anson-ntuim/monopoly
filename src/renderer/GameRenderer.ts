// 遊戲渲染器 - 卡通風格
import { GameState, Player, Space, Property, Station, Utility, SpaceType } from '../types'

export class GameRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private spaceSize: number = 80
  private boardSize: number = 880
  private centerSize: number = 600

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.resizeCanvas()
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  private resizeCanvas() {
    const container = this.canvas.parentElement!
    this.canvas.width = container.clientWidth
    this.canvas.height = container.clientHeight
  }

  render(state: GameState) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const offsetX = (this.canvas.width - this.boardSize) / 2
    const offsetY = (this.canvas.height - this.boardSize) / 2

    this.ctx.save()
    this.ctx.translate(offsetX, offsetY)

    // 繪製棋盤
    this.drawBoard(state)

    // 繪製玩家
    this.drawPlayers(state)

    // 繪製中央資訊面板
    this.drawCenterPanel(state)

    this.ctx.restore()
  }

  private drawBoard(state: GameState) {
    const spaces = state.spaces

    // 底部行 (0-10)
    for (let i = 0; i <= 10; i++) {
      const x = this.boardSize - (i * this.spaceSize)
      const y = this.boardSize - this.spaceSize
      this.drawSpace(spaces[i], x, y, state)
    }

    // 左側列 (11-19)
    for (let i = 11; i <= 19; i++) {
      const x = 0
      const y = this.boardSize - this.spaceSize - ((i - 10) * this.spaceSize)
      this.drawSpace(spaces[i], x, y, state)
    }

    // 頂部行 (20-30)
    for (let i = 20; i <= 30; i++) {
      const x = (i - 20) * this.spaceSize
      const y = 0
      this.drawSpace(spaces[i], x, y, state)
    }

    // 右側列 (31-39)
    for (let i = 31; i <= 39; i++) {
      const x = this.boardSize - this.spaceSize
      const y = (i - 30) * this.spaceSize
      this.drawSpace(spaces[i], x, y, state)
    }
  }

  private drawSpace(space: Space, x: number, y: number, state: GameState) {
    const ctx = this.ctx

    // 背景
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(x, y, this.spaceSize, this.spaceSize)

    // 邊框
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, this.spaceSize, this.spaceSize)

    // 顏色條（地產類）
    if (space.type === SpaceType.PROPERTY) {
      const prop = space as Property
      ctx.fillStyle = prop.color
      ctx.fillRect(x, y, this.spaceSize, 15)
    }

    // 所有權標記
    const owner = this.getSpaceOwner(space, state)
    if (owner !== null) {
      ctx.fillStyle = state.players[owner].color
      ctx.beginPath()
      ctx.arc(x + this.spaceSize - 15, y + 25, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // 房屋/酒店標記
    if (space.type === SpaceType.PROPERTY) {
      const prop = space as Property
      if (prop.houses > 0) {
        this.drawHouses(x, y, prop.houses)
      }
    }

    // 名稱
    ctx.fillStyle = '#333'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const name = space.name.length > 6 ? space.name.substring(0, 5) + '...' : space.name
    ctx.save()

    // 旋轉文字以適應空間位置
    if (space.id >= 1 && space.id <= 9) {
      // 底部
      ctx.fillText(name, x + this.spaceSize / 2, y + this.spaceSize - 25)
    } else if (space.id >= 11 && space.id <= 19) {
      // 左侧
      ctx.translate(x + 15, y + this.spaceSize / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(name, 0, 0)
    } else if (space.id >= 21 && space.id <= 29) {
      // 顶部
      ctx.fillText(name, x + this.spaceSize / 2, y + 25)
    } else if (space.id >= 31 && space.id <= 39) {
      // 右侧
      ctx.translate(x + this.spaceSize - 15, y + this.spaceSize / 2)
      ctx.rotate(Math.PI / 2)
      ctx.fillText(name, 0, 0)
    } else {
      // 角落
      ctx.fillText(name, x + this.spaceSize / 2, y + this.spaceSize / 2)
    }

    ctx.restore()

    // 特殊圖標
    this.drawSpaceIcon(space, x, y)
  }

  private drawHouses(x: number, y: number, count: number) {
    const ctx = this.ctx
    ctx.fillStyle = count === 5 ? '#FFD700' : '#228B22'

    if (count === 5) {
      // 酒店
      ctx.fillRect(x + 25, y + 30, 30, 20)
      ctx.fillStyle = '#FF0000'
      ctx.beginPath()
      ctx.moveTo(x + 25, y + 30)
      ctx.lineTo(x + 40, y + 20)
      ctx.lineTo(x + 55, y + 30)
      ctx.fill()
    } else {
      // 房屋
      const houseWidth = 12
      const startX = x + (this.spaceSize - count * houseWidth) / 2
      for (let i = 0; i < count; i++) {
        ctx.fillRect(startX + i * houseWidth, y + 35, 10, 10)
      }
    }
  }

  private drawSpaceIcon(space: Space, x: number, y: number) {
    const ctx = this.ctx
    const centerX = x + this.spaceSize / 2
    const centerY = y + this.spaceSize / 2

    ctx.font = '20px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    switch (space.type) {
      case SpaceType.START:
        ctx.fillText('🏁', centerX, centerY)
        break
      case SpaceType.JAIL:
        ctx.fillText('🚔', centerX, centerY)
        break
      case SpaceType.GO_TO_JAIL:
        ctx.fillText('👮', centerX, centerY)
        break
      case SpaceType.FREE_PARKING:
        ctx.fillText('🅿️', centerX, centerY)
        break
      case SpaceType.CHANCE:
        ctx.fillText('❓', centerX, centerY)
        break
      case SpaceType.COMMUNITY_CHEST:
        ctx.fillText('📦', centerX, centerY)
        break
      case SpaceType.TAX:
        ctx.fillText('💰', centerX, centerY)
        break
      case SpaceType.STATION:
        ctx.fillText('🚂', centerX, centerY)
        break
      case SpaceType.UTILITY:
        ctx.fillText('⚡', centerX, centerY)
        break
      case SpaceType.STOCK_MARKET:
        ctx.fillText('📈', centerX, centerY)
        break
    }
  }

  private getSpaceOwner(space: Space, state: GameState): number | null {
    const s = space as any
    return s.owner !== undefined ? s.owner : null
  }

  private drawPlayers(state: GameState) {
    state.players.forEach(player => {
      if (player.bankrupted) return

      const pos = this.getSpacePosition(player.position)
      const offsetIndex = state.players.filter(p => p.position === player.position && p.id < player.id).length

      const playerX = pos.x + 20 + (offsetIndex * 15)
      const playerY = pos.y + 20

      // 玩家棋子（卡通風格）
      const ctx = this.ctx
      ctx.fillStyle = player.color
      ctx.beginPath()
      ctx.arc(playerX, playerY, 12, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#FFF'
      ctx.lineWidth = 2
      ctx.stroke()

      // 玩家編號
      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText((player.id + 1).toString(), playerX, playerY)

      // 監獄標記
      if (player.inJail) {
        ctx.fillStyle = '#000'
        ctx.font = '16px Arial'
        ctx.fillText('⛓️', playerX, playerY - 20)
      }
    })
  }

  private getSpacePosition(spaceId: number): { x: number; y: number } {
    if (spaceId >= 0 && spaceId <= 10) {
      // 底部
      return {
        x: this.boardSize - (spaceId * this.spaceSize),
        y: this.boardSize - this.spaceSize
      }
    } else if (spaceId >= 11 && spaceId <= 19) {
      // 左侧
      return {
        x: 0,
        y: this.boardSize - this.spaceSize - ((spaceId - 10) * this.spaceSize)
      }
    } else if (spaceId >= 20 && spaceId <= 30) {
      // 顶部
      return {
        x: (spaceId - 20) * this.spaceSize,
        y: 0
      }
    } else {
      // 右侧
      return {
        x: this.boardSize - this.spaceSize,
        y: (spaceId - 30) * this.spaceSize
      }
    }
  }

  private drawCenterPanel(state: GameState) {
    const ctx = this.ctx
    const centerX = this.boardSize / 2
    const centerY = this.boardSize / 2
    const panelWidth = 500
    const panelHeight = 500

    // 面板背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight)

    ctx.strokeStyle = '#667eea'
    ctx.lineWidth = 4
    ctx.strokeRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight)

    // 標題
    ctx.fillStyle = '#667eea'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🎲 大富翁', centerX, centerY - 220)

    // 當前玩家資訊
    const currentPlayer = state.players[state.currentPlayerIndex]
    ctx.font = 'bold 18px Arial'
    ctx.fillStyle = currentPlayer.color
    ctx.fillText(`當前玩家: ${currentPlayer.name}`, centerX, centerY - 180)

    // 玩家列表
    let yOffset = centerY - 140
    state.players.forEach((player, index) => {
      if (player.bankrupted) return

      ctx.fillStyle = player.color
      ctx.fillRect(centerX - 220, yOffset - 10, 20, 20)

      ctx.fillStyle = '#333'
      ctx.font = '14px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`${player.name}: $${player.money}`, centerX - 190, yOffset + 5)

      // 地產數量
      ctx.font = '12px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(`地產: ${player.properties.length} | 位置: ${state.spaces[player.position].name}`, centerX - 190, yOffset + 22)

      yOffset += 45
    })

    // 骰子顯示
    if (state.dice[0] > 0) {
      const diceY = centerY + 80
      ctx.fillStyle = '#FFF'
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2

      // 骰子1
      ctx.fillRect(centerX - 60, diceY, 40, 40)
      ctx.strokeRect(centerX - 60, diceY, 40, 40)
      ctx.fillStyle = '#000'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(state.dice[0].toString(), centerX - 40, diceY + 25)

      // 骰子2
      ctx.fillStyle = '#FFF'
      ctx.fillRect(centerX + 20, diceY, 40, 40)
      ctx.strokeRect(centerX + 20, diceY, 40, 40)
      ctx.fillStyle = '#000'
      ctx.fillText(state.dice[1].toString(), centerX + 40, diceY + 25)

      // 總點數
      ctx.fillStyle = '#667eea'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`總點數: ${state.dice[0] + state.dice[1]}`, centerX, diceY + 60)
    }

    // 回合數
    ctx.fillStyle = '#999'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`回合: ${state.turn}`, centerX, centerY + 220)
  }

  // 繪製股市面板
  drawStockPanel(state: GameState, x: number, y: number, width: number, height: number) {
    const ctx = this.ctx

    // 面板背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)'
    ctx.fillRect(x, y, width, height)
    ctx.strokeStyle = '#667eea'
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, width, height)

    // 標題
    ctx.fillStyle = '#667eea'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('📈 股市交易所', x + width / 2, y + 30)

    // 股票列表
    let yOffset = y + 60
    state.stocks.forEach(stock => {
      ctx.fillStyle = '#333'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`${stock.name} (${stock.symbol})`, x + 20, yOffset)

      ctx.font = '14px Arial'
      ctx.fillText(`價格: $${stock.price}`, x + 20, yOffset + 20)

      // 漲跌
      const changeColor = stock.change >= 0 ? '#00AA00' : '#FF0000'
      const changeText = stock.change >= 0 ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`
      ctx.fillStyle = changeColor
      ctx.fillText(changeText, x + 150, yOffset + 20)

      yOffset += 50
    })
  }
}
