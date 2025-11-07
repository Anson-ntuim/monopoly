// UI管理器 - 處理所有UI互動
import { Game } from '../core/Game'
import { GameRenderer } from '../renderer/GameRenderer'
import { GameState, Player, Property, SpaceType, Station, Utility } from '../types'

export class UIManager {
  private game: Game
  private renderer: GameRenderer
  private canvas: HTMLCanvasElement
  private rightPanel: HTMLElement
  private diceRolling: boolean = false

  constructor(game: Game, canvas: HTMLCanvasElement) {
    this.game = game
    this.canvas = canvas
    this.renderer = new GameRenderer(canvas)

    this.createLayout()
    this.rightPanel = document.getElementById('right-panel')!

    // 監聽遊戲狀態變化
    this.game.onStateChange = (state: GameState) => {
      this.render()
    }

    this.render()
  }

  private createLayout() {
    // 已經在 index.html 中創建，這裡不需要做什麼
  }

  render() {
    this.renderer.render(this.game.state)
    this.updateRightPanel()
  }

  private updateRightPanel() {
    const state = this.game.state
    const player = this.game.getCurrentPlayer()

    if (state.gameOver) {
      this.showGameOver()
      return
    }

    this.rightPanel.innerHTML = `
      <!-- 當前玩家資訊 -->
      <div class="current-player-card">
        <div class="player-avatar" style="background: ${player.color};">
          <span class="player-number">${player.id + 1}</span>
        </div>
        <div class="player-info">
          <h2 style="color: ${player.color};">${player.name}</h2>
          <div class="player-stats">
            <div class="stat">
              <span class="stat-label">💰 現金</span>
              <span class="stat-value">$${player.money}</span>
            </div>
            <div class="stat">
              <span class="stat-label">🏠 地產</span>
              <span class="stat-value">${player.properties.length}</span>
            </div>
            <div class="stat">
              <span class="stat-label">📍 位置</span>
              <span class="stat-value">${state.spaces[player.position].name}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 骰子區域 -->
      <div class="dice-section">
        <h3>🎲 投擲骰子</h3>
        <div class="dice-container" id="dice-container">
          <div class="dice" id="dice1">${state.dice[0] || '?'}</div>
          <div class="dice" id="dice2">${state.dice[1] || '?'}</div>
        </div>
        ${state.dice[0] > 0 ? `<div class="dice-total">總點數: ${state.dice[0] + state.dice[1]}</div>` : ''}
        ${state.dice[0] === 0 ? '<button class="btn btn-primary btn-large" id="roll-dice-btn">🎲 投擲骰子</button>' : ''}
        ${player.inJail ? '<div class="jail-notice">⛓️ 你在監獄中！</div>' : ''}
      </div>

      <!-- 行動按鈕 -->
      <div class="action-section" id="action-buttons">
        ${this.getActionButtons(player, state.spaces[player.position])}
      </div>

      <!-- 玩家列表 -->
      <div class="players-section">
        <h3>👥 所有玩家</h3>
        <div class="players-list">
          ${state.players.map(p => `
            <div class="player-item ${p.id === state.currentPlayerIndex ? 'active' : ''} ${p.bankrupted ? 'bankrupted' : ''}">
              <div class="player-color" style="background: ${p.color};"></div>
              <div class="player-details">
                <div class="player-name">${p.name}</div>
                <div class="player-money">$${p.money}</div>
              </div>
              ${p.bankrupted ? '<span class="bankrupted-badge">破產</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <button class="btn btn-secondary" id="manage-property-btn">🏠 管理地產</button>
        <button class="btn btn-secondary" id="stock-market-btn">📈 股市交易</button>
        <button class="btn btn-danger" id="end-turn-btn">⏭️ 結束回合</button>
      </div>

      <!-- 遊戲資訊 -->
      <div class="game-info">
        <span>回合: ${state.turn}</span>
      </div>
    `

    // 綁定事件
    this.bindEvents()
  }

  private getActionButtons(player: Player, space: any): string {
    if (this.game.state.dice[0] === 0) {
      return ''
    }

    let buttons = ''

    if (space.type === SpaceType.PROPERTY || space.type === SpaceType.STATION || space.type === SpaceType.UTILITY) {
      if (space.owner === null) {
        buttons += `<button class="btn btn-success" data-action="buy" data-space="${space.id}">💰 購買 ${space.name} ($${space.price})</button>`
      } else if (space.owner === player.id && space.type === SpaceType.PROPERTY) {
        const prop = space as Property
        if (prop.houses < 5 && this.game.hasMonopoly(player, prop.color)) {
          buttons += `<button class="btn btn-warning" data-action="upgrade" data-space="${space.id}">🏗️ 升級 ${space.name} ($${prop.houseCost})</button>`
        }
      }
    }

    return buttons || '<div class="no-action">沒有可用的操作</div>'
  }

  private bindEvents() {
    // 投骰子按鈕
    const rollBtn = document.getElementById('roll-dice-btn')
    if (rollBtn) {
      rollBtn.onclick = () => this.rollDiceWithAnimation()
    }

    // 購買/升級按鈕
    const actionButtons = document.querySelectorAll('[data-action]')
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const action = target.getAttribute('data-action')
        const spaceId = parseInt(target.getAttribute('data-space') || '0')

        if (action === 'buy') {
          this.game.buyProperty(this.game.getCurrentPlayer(), spaceId)
          this.showToast(`成功購買 ${this.game.state.spaces[spaceId].name}！`)
        } else if (action === 'upgrade') {
          this.game.upgradeProperty(this.game.getCurrentPlayer(), spaceId)
          this.showToast(`成功升級 ${this.game.state.spaces[spaceId].name}！`)
        }
      })
    })

    // 管理地產
    const managePropBtn = document.getElementById('manage-property-btn')
    if (managePropBtn) {
      managePropBtn.onclick = () => this.showPropertyManagement()
    }

    // 股市交易
    const stockBtn = document.getElementById('stock-market-btn')
    if (stockBtn) {
      stockBtn.onclick = () => this.showStockMarket()
    }

    // 結束回合
    const endTurnBtn = document.getElementById('end-turn-btn')
    if (endTurnBtn) {
      endTurnBtn.onclick = () => this.endTurn()
    }
  }

  private async rollDiceWithAnimation() {
    if (this.diceRolling) return
    this.diceRolling = true

    const player = this.game.getCurrentPlayer()
    const dice1El = document.getElementById('dice1')!
    const dice2El = document.getElementById('dice2')!

    // 動畫：快速隨機變化
    let count = 0
    const animationInterval = setInterval(() => {
      dice1El.textContent = (Math.floor(Math.random() * 6) + 1).toString()
      dice2El.textContent = (Math.floor(Math.random() * 6) + 1).toString()
      dice1El.classList.add('rolling')
      dice2El.classList.add('rolling')
      count++
    }, 100)

    // 1秒後停止動畫並顯示結果
    setTimeout(async () => {
      clearInterval(animationInterval)

      if (player.inJail) {
        // 在監獄中的邏輯
        const dice = this.game.rollDice()
        dice1El.textContent = dice[0].toString()
        dice2El.textContent = dice[1].toString()
        dice1El.classList.remove('rolling')
        dice2El.classList.remove('rolling')

        if (dice[0] === dice[1]) {
          player.inJail = false
          player.jailTurns = 0
          this.showToast(`${player.name} 擲出雙倍骰，出獄了！`)
          this.game.movePlayer(player, dice[0] + dice[1])
          await this.game.handleSpace(player, this.game.state.spaces[player.position])
        } else {
          player.jailTurns++
          if (player.jailTurns >= 3) {
            player.inJail = false
            player.jailTurns = 0
            player.money -= 500
            this.showToast(`${player.name} 繳納 $500 出獄`)
            this.game.movePlayer(player, dice[0] + dice[1])
            await this.game.handleSpace(player, this.game.state.spaces[player.position])
          } else {
            this.showToast(`${player.name} 還在監獄中...`)
          }
        }
      } else {
        // 正常投骰子
        const dice = this.game.rollDice()
        dice1El.textContent = dice[0].toString()
        dice2El.textContent = dice[1].toString()
        dice1El.classList.remove('rolling')
        dice2El.classList.remove('rolling')

        this.showToast(`${player.name} 擲出 ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}`)

        await new Promise(resolve => setTimeout(resolve, 500))
        this.game.movePlayer(player, dice[0] + dice[1])
        await this.game.handleSpace(player, this.game.state.spaces[player.position])
      }

      this.diceRolling = false
      this.render()
    }, 1000)
  }

  private endTurn() {
    this.game.endTurn()
    this.game.state.dice = [0, 0]
    this.showToast(`輪到 ${this.game.getCurrentPlayer().name}`)
    this.render()
  }

  private showToast(message: string) {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('show'), 10)
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 3000)
  }

  private showPropertyManagement() {
    const player = this.game.getCurrentPlayer()
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>🏠 我的地產</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          ${player.properties.length === 0 ? '<p class="empty-state">還沒有任何地產</p>' : ''}
          <div class="property-list">
            ${player.properties.map(propId => {
              const space = this.game.state.spaces[propId] as any
              return `
                <div class="property-card">
                  <div class="property-header" ${space.color ? `style="background: ${space.color};"` : ''}>
                    <h3>${space.name}</h3>
                  </div>
                  <div class="property-body">
                    <div class="property-stat">
                      <span>價值</span>
                      <strong>$${space.price}</strong>
                    </div>
                    ${space.houses !== undefined ? `
                      <div class="property-stat">
                        <span>建築</span>
                        <strong>${space.houses === 5 ? '🏨 飯店' : space.houses > 0 ? `🏠 ${space.houses}棟` : '空地'}</strong>
                      </div>
                      <div class="property-stat">
                        <span>租金</span>
                        <strong>$${space.rent[space.houses]}</strong>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  private showStockMarket() {
    const player = this.game.getCurrentPlayer()
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>📈 股市交易所</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="stock-balance">
            <span>💰 可用現金：</span>
            <strong>$${player.money}</strong>
          </div>
          <div class="stock-list">
            ${this.game.state.stocks.map(stock => {
              const owned = player.stocks.get(stock.symbol) || 0
              const changeColor = stock.change >= 0 ? '#10B981' : '#EF4444'
              const changeSymbol = stock.change >= 0 ? '▲' : '▼'

              return `
                <div class="stock-card">
                  <div class="stock-info">
                    <h3>${stock.name}</h3>
                    <span class="stock-symbol">${stock.symbol}</span>
                  </div>
                  <div class="stock-price">
                    <div class="price-main">$${stock.price}</div>
                    <div class="price-change" style="color: ${changeColor};">
                      ${changeSymbol} ${Math.abs(stock.change).toFixed(2)}%
                    </div>
                  </div>
                  <div class="stock-owned">
                    持有: <strong>${owned}</strong> 股
                  </div>
                  <div class="stock-actions">
                    <input type="number" class="stock-qty" id="qty-${stock.symbol}" min="1" value="1" />
                    <button class="btn btn-success btn-sm" onclick="window.buyStock('${stock.symbol}')">買入</button>
                    <button class="btn btn-danger btn-sm" onclick="window.sellStock('${stock.symbol}')" ${owned === 0 ? 'disabled' : ''}>賣出</button>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    // 設置全域函數供按鈕調用
    (window as any).buyStock = (symbol: string) => {
      const qty = parseInt((document.getElementById(`qty-${symbol}`) as HTMLInputElement).value)
      if (this.game.stockMarket.buyStock(player, symbol, qty)) {
        this.showToast(`成功購買 ${qty} 股 ${symbol}`)
        document.querySelector('.modal-overlay')?.remove()
        this.showStockMarket()
        this.render()
      }
    }

    (window as any).sellStock = (symbol: string) => {
      const qty = parseInt((document.getElementById(`qty-${symbol}`) as HTMLInputElement).value)
      if (this.game.stockMarket.sellStock(player, symbol, qty)) {
        this.showToast(`成功賣出 ${qty} 股 ${symbol}`)
        document.querySelector('.modal-overlay')?.remove()
        this.showStockMarket()
        this.render()
      }
    }
  }

  private showGameOver() {
    const winner = this.game.state.players[this.game.state.winner!]
    this.rightPanel.innerHTML = `
      <div class="game-over">
        <h1>🎉 遊戲結束！</h1>
        <div class="winner-card">
          <div class="winner-avatar" style="background: ${winner.color};">
            <span class="player-number">${winner.id + 1}</span>
          </div>
          <h2>${winner.name} 獲勝！</h2>
          <div class="final-stats">
            <div class="stat">
              <span>💰 總資產</span>
              <span class="stat-value">$${this.game.stockMarket.getTotalAssets(winner)}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-large" onclick="location.reload()">🔄 重新開始</button>
      </div>
    `
  }
}
