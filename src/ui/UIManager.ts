// UI管理器 - 处理所有UI交互
import { Game } from '../core/Game'
import { GameRenderer } from '../renderer/GameRenderer'
import { GameState, Player, Property, SpaceType, Station, Utility } from '../types'

export class UIManager {
  private game: Game
  private renderer: GameRenderer
  private canvas: HTMLCanvasElement

  // UI元素
  private actionPanel: HTMLElement
  private messageBox: HTMLElement
  private propertyPanel: HTMLElement
  private stockPanel: HTMLElement

  constructor(game: Game, canvas: HTMLCanvasElement) {
    this.game = game
    this.canvas = canvas
    this.renderer = new GameRenderer(canvas)

    this.createUIElements()
    this.setupEventListeners()

    // 监听游戏状态变化
    this.game.onStateChange = (state: GameState) => {
      this.render()
    }

    this.render()
  }

  private createUIElements() {
    const gameContainer = document.getElementById('game-container')!

    // 创建UI容器
    const uiContainer = document.createElement('div')
    uiContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `
    gameContainer.appendChild(uiContainer)

    // 动作面板
    this.actionPanel = document.createElement('div')
    this.actionPanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      pointer-events: auto;
      display: flex;
      gap: 10px;
      align-items: center;
    `
    uiContainer.appendChild(this.actionPanel)

    // 消息框
    this.messageBox = document.createElement('div')
    this.messageBox.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      max-width: 300px;
      pointer-events: auto;
      font-size: 14px;
      color: #333;
    `
    uiContainer.appendChild(this.messageBox)

    // 地产面板（隐藏）
    this.propertyPanel = document.createElement('div')
    this.propertyPanel.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      pointer-events: auto;
      display: none;
      max-width: 500px;
      z-index: 100;
    `
    uiContainer.appendChild(this.propertyPanel)

    // 股市面板（隐藏）
    this.stockPanel = document.createElement('div')
    this.stockPanel.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      pointer-events: auto;
      display: none;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 100;
    `
    uiContainer.appendChild(this.stockPanel)
  }

  private setupEventListeners() {
    // 这里不需要额外的监听器，因为按钮会在渲染时动态创建
  }

  render() {
    this.renderer.render(this.game.state)
    this.updateActionPanel()
    this.updateMessageBox()
  }

  private updateActionPanel() {
    const player = this.game.getCurrentPlayer()
    const space = this.game.state.spaces[player.position]

    this.actionPanel.innerHTML = ''

    if (this.game.state.gameOver) {
      const winner = this.game.state.players[this.game.state.winner!]
      this.actionPanel.innerHTML = `
        <div style="text-align: center; font-size: 24px; color: #667eea;">
          🎉 ${winner.name} 獲勝！
        </div>
      `
      return
    }

    // 玩家信息
    const info = document.createElement('div')
    info.style.cssText = 'margin-right: 20px; font-weight: bold;'
    info.innerHTML = `
      <div style="color: ${player.color};">${player.name}</div>
      <div style="font-size: 12px; color: #666;">💰 $${player.money}</div>
    `
    this.actionPanel.appendChild(info)

    // 投骰子按钮
    if (this.game.state.dice[0] === 0) {
      const rollBtn = this.createButton('🎲 投骰子', () => this.rollDice())
      this.actionPanel.appendChild(rollBtn)
    } else {
      // 当前位置行动按钮
      this.createActionButtons(player, space)
    }

    // 其他操作
    const manageBtn = this.createButton('🏠 管理地產', () => this.showPropertyManagement())
    manageBtn.style.background = '#95E1D3'
    this.actionPanel.appendChild(manageBtn)

    const stockBtn = this.createButton('📈 股市', () => this.showStockMarket())
    stockBtn.style.background = '#FFE66D'
    this.actionPanel.appendChild(stockBtn)

    const endBtn = this.createButton('結束回合', () => this.endTurn())
    endBtn.style.background = '#FF6B6B'
    this.actionPanel.appendChild(endBtn)
  }

  private createActionButtons(player: Player, space: any) {
    if (space.type === SpaceType.PROPERTY || space.type === SpaceType.STATION || space.type === SpaceType.UTILITY) {
      if (space.owner === null) {
        // 可以购买
        const buyBtn = this.createButton(`💰 購買 ($${space.price})`, () => {
          if (this.game.buyProperty(player, space.id)) {
            this.showMessage(`成功購買 ${space.name}！`)
          }
        })
        buyBtn.style.background = '#4ECDC4'
        this.actionPanel.appendChild(buyBtn)
      } else if (space.owner === player.id && space.type === SpaceType.PROPERTY) {
        // 自己的地产，可以升级
        const prop = space as Property
        if (prop.houses < 5 && this.game.hasMonopoly(player, prop.color)) {
          const upgradeBtn = this.createButton(`🏗️ 升級 ($${prop.houseCost})`, () => {
            if (this.game.upgradeProperty(player, space.id)) {
              this.showMessage(`成功升級 ${space.name}！`)
            }
          })
          upgradeBtn.style.background = '#FFE66D'
          this.actionPanel.appendChild(upgradeBtn)
        }
      }
    }
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.textContent = text
    btn.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: transform 0.2s, box-shadow 0.2s;
    `

    btn.onmouseover = () => {
      btn.style.transform = 'translateY(-2px)'
      btn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)'
    }

    btn.onmouseout = () => {
      btn.style.transform = 'translateY(0)'
      btn.style.boxShadow = 'none'
    }

    btn.onclick = onClick
    return btn
  }

  private async rollDice() {
    const player = this.game.getCurrentPlayer()

    if (player.inJail) {
      // 在监狱中
      const dice = this.game.rollDice()
      if (dice[0] === dice[1]) {
        player.inJail = false
        player.jailTurns = 0
        this.showMessage(`${player.name} 擲出雙倍骰，出獄了！`)
        this.game.movePlayer(player, dice[0] + dice[1])
        await this.game.handleSpace(player, this.game.state.spaces[player.position])
      } else {
        player.jailTurns++
        if (player.jailTurns >= 3) {
          player.inJail = false
          player.jailTurns = 0
          player.money -= 500
          this.showMessage(`${player.name} 繳納 $500 出獄`)
          this.game.movePlayer(player, dice[0] + dice[1])
          await this.game.handleSpace(player, this.game.state.spaces[player.position])
        } else {
          this.showMessage(`${player.name} 還在監獄中...`)
        }
      }
    } else {
      // 正常投骰子
      const dice = this.game.rollDice()
      this.showMessage(`${player.name} 擲出 ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}`)

      this.game.movePlayer(player, dice[0] + dice[1])
      await this.game.handleSpace(player, this.game.state.spaces[player.position])
    }

    this.render()
  }

  private endTurn() {
    this.game.endTurn()
    this.game.state.dice = [0, 0]
    this.showMessage(`輪到 ${this.game.getCurrentPlayer().name}`)
    this.render()
  }

  private showMessage(message: string) {
    this.messageBox.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong style="color: #667eea;">📢 訊息</strong>
      </div>
      <div>${message}</div>
    `

    setTimeout(() => {
      this.messageBox.innerHTML = ''
    }, 4000)
  }

  private showPropertyManagement() {
    const player = this.game.getCurrentPlayer()

    this.propertyPanel.innerHTML = `
      <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">🏠 我的地產</h2>
      <div style="max-height: 400px; overflow-y: auto;">
        ${player.properties.map(propId => {
          const space = this.game.state.spaces[propId] as any
          let html = `
            <div style="padding: 15px; margin: 10px 0; background: #f5f5f5; border-radius: 10px;">
              <div style="font-weight: bold; color: #333;">${space.name}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">
                價值: $${space.price}
          `

          if (space.type === SpaceType.PROPERTY) {
            const prop = space as Property
            html += ` | 房屋: ${prop.houses} | 租金: $${prop.rent[prop.houses]}`
          }

          html += `</div></div>`
          return html
        }).join('')}
      </div>
      <button id="close-property" style="
        width: 100%;
        margin-top: 20px;
        padding: 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
      ">關閉</button>
    `

    this.propertyPanel.style.display = 'block'

    document.getElementById('close-property')!.onclick = () => {
      this.propertyPanel.style.display = 'none'
    }
  }

  private showStockMarket() {
    const player = this.game.getCurrentPlayer()

    this.stockPanel.innerHTML = `
      <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">📈 股市交易所</h2>
      <div style="background: #f0f0f0; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <strong>現金: $${player.money}</strong>
      </div>
      <div id="stocks-list">
        ${this.game.state.stocks.map(stock => {
          const owned = player.stocks.get(stock.symbol) || 0
          const changeColor = stock.change >= 0 ? '#00AA00' : '#FF0000'
          const changeSymbol = stock.change >= 0 ? '▲' : '▼'

          return `
            <div style="padding: 15px; margin: 10px 0; background: #f9f9f9; border-radius: 10px; border: 2px solid #ddd;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                  <div style="font-weight: bold; font-size: 16px;">${stock.name} (${stock.symbol})</div>
                  <div style="font-size: 14px; color: #666;">持有: ${owned} 股</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 20px; font-weight: bold;">$${stock.price}</div>
                  <div style="color: ${changeColor}; font-size: 14px;">
                    ${changeSymbol} ${Math.abs(stock.change).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 10px;">
                <input type="number" id="qty-${stock.symbol}" min="1" value="1" style="
                  width: 80px;
                  padding: 8px;
                  border: 2px solid #ddd;
                  border-radius: 5px;
                  font-size: 14px;
                ">
                <button onclick="window.buyStock('${stock.symbol}')" style="
                  flex: 1;
                  padding: 8px 16px;
                  background: #00AA00;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  font-weight: bold;
                ">買入</button>
                <button onclick="window.sellStock('${stock.symbol}')" style="
                  flex: 1;
                  padding: 8px 16px;
                  background: #FF0000;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  font-weight: bold;
                " ${owned === 0 ? 'disabled' : ''}>賣出</button>
              </div>
            </div>
          `
        }).join('')}
      </div>
      <button id="close-stock" style="
        width: 100%;
        margin-top: 20px;
        padding: 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: bold;
      ">關閉</button>
    `

    this.stockPanel.style.display = 'block'

    // 设置全局函数供按钮调用
    (window as any).buyStock = (symbol: string) => {
      const qty = parseInt((document.getElementById(`qty-${symbol}`) as HTMLInputElement).value)
      if (this.game.stockMarket.buyStock(player, symbol, qty)) {
        this.showMessage(`成功購買 ${qty} 股 ${symbol}`)
        this.showStockMarket()  // 刷新面板
        this.render()
      }
    }

    (window as any).sellStock = (symbol: string) => {
      const qty = parseInt((document.getElementById(`qty-${symbol}`) as HTMLInputElement).value)
      if (this.game.stockMarket.sellStock(player, symbol, qty)) {
        this.showMessage(`成功賣出 ${qty} 股 ${symbol}`)
        this.showStockMarket()  // 刷新面板
        this.render()
      }
    }

    document.getElementById('close-stock')!.onclick = () => {
      this.stockPanel.style.display = 'none'
    }
  }
}
