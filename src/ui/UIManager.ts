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

    // 監聽租金支付事件
    this.game.onRentPayment = async (amount: number, ownerName: string, propertyName: string, payer: Player, owner: Player) => {
      await this.showRentNotification(amount, ownerName, propertyName, payer, owner)
    }

    // 監聽抽卡事件
    this.game.onCardDrawn = async (cardType: 'chance' | 'community', description: string) => {
      await this.showCardModal(cardType, description)
    }

    this.render()
  }

  private createLayout() {
    // 已經在 index.html 中創建，這裡不需要做什麼
  }

  render() {
    // 重置骰子標記，確保新回合可以投骰子
    if (this.game.state.dice[0] === 0) {
      this.diceRolling = false
    }
    console.log('[UIManager] render() 被調用，當前玩家:', this.game.getCurrentPlayer().name, 'dice:', this.game.state.dice)
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
        <button class="btn btn-secondary" id="show-rules-btn">📖 遊戲規則</button>
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
      return '<div class="no-action">請投擲骰子開始回合</div>'
    }

    let content = ''

    // 顯示格子資訊卡片
    content += this.getSpaceInfoCard(player, space)

    // 顯示操作按鈕
    content += this.getSpaceActionButtons(player, space)

    return content
  }

  private getSpaceInfoCard(player: Player, space: any): string {
    let infoHTML = '<div class="space-info-card">'

    switch (space.type) {
      case SpaceType.PROPERTY:
        const prop = space as Property
        infoHTML += `
          <div class="info-header" style="background: ${prop.color};">
            <h3>${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-row">
              <span>💰 售價</span>
              <strong>$${prop.price}</strong>
            </div>
            <div class="info-section">
              <div class="info-subtitle">租金明細</div>
              <div class="rent-table">
                <div class="rent-row"><span>空地</span><span>$${prop.rent[0]}</span></div>
                <div class="rent-row"><span>1棟房</span><span>$${prop.rent[1]}</span></div>
                <div class="rent-row"><span>2棟房</span><span>$${prop.rent[2]}</span></div>
                <div class="rent-row"><span>3棟房</span><span>$${prop.rent[3]}</span></div>
                <div class="rent-row"><span>4棟房</span><span>$${prop.rent[4]}</span></div>
                <div class="rent-row"><span>飯店</span><span>$${prop.rent[5]}</span></div>
              </div>
            </div>
            <div class="info-row">
              <span>🏗️ 建造費用</span>
              <strong>$${prop.houseCost}</strong>
            </div>
            ${prop.owner !== null ? `
              <div class="info-row owner-info">
                <span>👤 地主</span>
                <strong style="color: ${this.game.state.players[prop.owner].color};">${this.game.state.players[prop.owner].name}</strong>
              </div>
              <div class="info-row">
                <span>🏠 建築</span>
                <strong>${prop.houses === 5 ? '🏨 飯店' : prop.houses > 0 ? `🏠 ${prop.houses}棟` : '空地'}</strong>
              </div>
            ` : ''}
          </div>
        `
        break

      case SpaceType.STATION:
        const station = space as Station
        infoHTML += `
          <div class="info-header" style="background: #333;">
            <h3>🚂 ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-row">
              <span>💰 售價</span>
              <strong>$${station.price}</strong>
            </div>
            <div class="info-section">
              <div class="info-subtitle">租金明細</div>
              <div class="rent-table">
                <div class="rent-row"><span>1個車站</span><span>$${station.rent[0]}</span></div>
                <div class="rent-row"><span>2個車站</span><span>$${station.rent[1]}</span></div>
                <div class="rent-row"><span>3個車站</span><span>$${station.rent[2]}</span></div>
                <div class="rent-row"><span>4個車站</span><span>$${station.rent[3]}</span></div>
              </div>
            </div>
            ${station.owner !== null ? `
              <div class="info-row owner-info">
                <span>👤 地主</span>
                <strong style="color: ${this.game.state.players[station.owner].color};">${this.game.state.players[station.owner].name}</strong>
              </div>
            ` : ''}
          </div>
        `
        break

      case SpaceType.UTILITY:
        const utility = space as Utility
        infoHTML += `
          <div class="info-header" style="background: #4299e1;">
            <h3>⚡ ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-row">
              <span>💰 售價</span>
              <strong>$${utility.price}</strong>
            </div>
            <div class="info-section">
              <div class="info-subtitle">租金計算</div>
              <div class="rent-table">
                <div class="rent-row"><span>1個公用設施</span><span>骰子點數 × 40</span></div>
                <div class="rent-row"><span>2個公用設施</span><span>骰子點數 × 100</span></div>
              </div>
            </div>
            ${utility.owner !== null ? `
              <div class="info-row owner-info">
                <span>👤 地主</span>
                <strong style="color: ${this.game.state.players[utility.owner].color};">${this.game.state.players[utility.owner].name}</strong>
              </div>
            ` : ''}
          </div>
        `
        break

      case SpaceType.START:
        infoHTML += `
          <div class="info-header" style="background: #48bb78;">
            <h3>🏁 ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-message">
              恭喜！每次經過或停留在起點可獲得 <strong>$2000</strong>
            </div>
          </div>
        `
        break

      case SpaceType.JAIL:
        infoHTML += `
          <div class="info-header" style="background: #718096;">
            <h3>🔒 ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-message">
              您只是來訪問監獄，沒有任何懲罰
            </div>
          </div>
        `
        break

      case SpaceType.FREE_PARKING:
        infoHTML += `
          <div class="info-header" style="background: #9f7aea;">
            <h3>🅿️ ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-message">
              免費停車，好好休息一下吧！
            </div>
          </div>
        `
        break

      case SpaceType.GO_TO_JAIL:
        infoHTML += `
          <div class="info-header" style="background: #e53e3e;">
            <h3>👮 ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-message">
              直接前往監獄！不能通過起點，不能領取 $2000
            </div>
          </div>
        `
        break

      case SpaceType.TAX:
        const taxAmount = space.id === 4 ? 2000 : 1000
        infoHTML += `
          <div class="info-header" style="background: #f56565;">
            <h3>💸 ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-row">
              <span>繳納稅金</span>
              <strong>$${taxAmount}</strong>
            </div>
          </div>
        `
        break

      case SpaceType.CHANCE:
        infoHTML += `
          <div class="info-header" style="background: #ed8936;">
            <h3>❓ ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-message">
              抽取機會卡，可能是好事也可能是壞事...
            </div>
          </div>
        `
        break

      case SpaceType.COMMUNITY_CHEST:
        infoHTML += `
          <div class="info-header" style="background: #38b2ac;">
            <h3>📦 ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-message">
              抽取命運卡，看看會發生什麼吧！
            </div>
          </div>
        `
        break

      case SpaceType.STOCK_MARKET:
        infoHTML += `
          <div class="info-header" style="background: #667eea;">
            <h3>📈 ${space.name}</h3>
          </div>
          <div class="info-body">
            <div class="info-message">
              歡迎來到股市交易所！點擊下方按鈕進行交易
            </div>
          </div>
        `
        break
    }

    infoHTML += '</div>'
    return infoHTML
  }

  private getSpaceActionButtons(player: Player, space: any): string {
    let buttons = '<div class="action-buttons-container">'

    console.log('[UIManager] getSpaceActionButtons:', {
      spaceId: space.id,
      spaceName: space.name,
      spaceType: space.type,
      owner: space.owner,
      playerId: player.id,
      hasOwner: space.owner !== null && space.owner !== undefined
    })

    if (space.type === SpaceType.PROPERTY || space.type === SpaceType.STATION || space.type === SpaceType.UTILITY) {
      if (space.owner === null || space.owner === undefined) {
        // 無主地產 - 可以購買
        console.log('[UIManager] 顯示購買按鈕')
        buttons += `<button class="btn btn-success btn-large" data-action="buy" data-space="${space.id}">💰 購買 ($${space.price})</button>`
      } else if (space.owner === player.id) {
        // 自己的地產
        if (space.type === SpaceType.PROPERTY) {
          const prop = space as Property
          if (prop.houses < 5) {
            buttons += `<button class="btn btn-warning btn-large" data-action="upgrade" data-space="${space.id}">🏗️ 建造/升級 ($${prop.houseCost})</button>`
          } else if (prop.houses === 5) {
            buttons += '<div class="action-hint">✅ 已達最高等級（飯店）</div>'
          }
        } else {
          buttons += '<div class="action-hint">✅ 這是你的資產</div>'
        }
      } else {
        // 別人的地產 - 已經自動支付租金
        buttons += '<div class="action-hint">💸 已支付租金給地主</div>'
      }
    } else if (space.type === SpaceType.STOCK_MARKET) {
      buttons += `<button class="btn btn-primary btn-large" onclick="document.getElementById('stock-market-btn').click()">📈 開啟股市交易</button>`
    } else {
      buttons += '<div class="action-hint">無需額外操作</div>'
    }

    buttons += '</div>'
    return buttons
  }

  private bindEvents() {
    // 投骰子按鈕
    const rollBtn = document.getElementById('roll-dice-btn')
    if (rollBtn) {
      rollBtn.onclick = async () => {
        if (!this.diceRolling) {
          await this.rollDiceWithAnimation()
        }
      }
    }

    // 購買/升級按鈕
    const actionButtons = document.querySelectorAll('[data-action]')
    console.log('[UIManager] 找到操作按鈕數量:', actionButtons.length)
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const action = target.getAttribute('data-action')
        const spaceId = parseInt(target.getAttribute('data-space') || '0')

        console.log('[UIManager] 按鈕被點擊:', { action, spaceId })

        if (action === 'buy') {
          const success = this.game.buyProperty(this.game.getCurrentPlayer(), spaceId)
          if (success) {
            this.showToast(`成功購買 ${this.game.state.spaces[spaceId].name}！`)
          } else {
            this.showToast(`無法購買 ${this.game.state.spaces[spaceId].name}`)
          }
        } else if (action === 'upgrade') {
          const success = this.game.upgradeProperty(this.game.getCurrentPlayer(), spaceId)
          if (success) {
            this.showToast(`成功升級 ${this.game.state.spaces[spaceId].name}！`)
          } else {
            this.showToast(`無法升級 ${this.game.state.spaces[spaceId].name}`)
          }
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

    // 遊戲規則
    const rulesBtn = document.getElementById('show-rules-btn')
    if (rulesBtn) {
      rulesBtn.onclick = () => this.showRules()
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
        console.log('[UIManager] 玩家移動後位置:', player.position, '格子:', this.game.state.spaces[player.position].name)
        await this.game.handleSpace(player, this.game.state.spaces[player.position])
      }

      this.diceRolling = false
      console.log('[UIManager] 骰子動畫結束，即將 render，dice:', this.game.state.dice)
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

  private showMoneyAnimation(amount: number, isGain: boolean = false, targetElement?: HTMLElement) {
    const money = document.createElement('div')
    money.className = `money-animation ${isGain ? 'gain' : ''}`
    money.textContent = `${isGain ? '+' : '-'}$${amount}`

    // 如果提供了目標元素，從該元素位置顯示動畫
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      money.style.left = rect.left + rect.width / 2 + 'px'
      money.style.top = rect.top + rect.height / 2 + 'px'
    } else {
      // 否則在右側面板中間顯示
      const rightPanel = document.getElementById('right-panel')!
      const rect = rightPanel.getBoundingClientRect()
      money.style.left = rect.left + rect.width / 2 + 'px'
      money.style.top = rect.top + rect.height / 2 + 'px'
    }

    document.body.appendChild(money)

    setTimeout(() => {
      if (money.parentNode) {
        document.body.removeChild(money)
      }
    }, 2000)
  }

  private showRentNotification(amount: number, ownerName: string, propertyName: string, payer: Player, owner: Player): Promise<void> {
    return new Promise((resolve) => {
      const notification = document.createElement('div')
      notification.className = 'rent-notification'
      notification.innerHTML = `
        <h3>💰 需支付租金</h3>
        <div style="font-size: 1.1em; color: #718096; margin-bottom: 10px;">
          ${propertyName}
        </div>
        <div class="amount">$${amount}</div>
        <div class="owner-name">支付給 ${ownerName}</div>
        <button class="btn btn-primary" style="margin-top: 20px;" id="pay-rent-btn">
          確認支付
        </button>
      `
      document.body.appendChild(notification)

      document.getElementById('pay-rent-btn')!.onclick = () => {
        document.body.removeChild(notification)

        // 顯示支付者的金錢減少動畫
        this.showMoneyAnimation(amount, false)

        // 稍微延遲後顯示接收者的金錢增加動畫
        setTimeout(() => {
          this.showMoneyAnimation(amount, true)
        }, 200)

        resolve()
      }
    })
  }

  private showCardModal(cardType: 'chance' | 'community', description: string): Promise<void> {
    return new Promise((resolve) => {
      const isChance = cardType === 'chance'
      const modal = document.createElement('div')
      modal.className = 'card-modal-overlay'
      modal.innerHTML = `
        <div class="card-modal ${isChance ? 'chance-card' : 'community-card'}">
          <div class="card-icon">${isChance ? '❓' : '📦'}</div>
          <h2>${isChance ? '機會' : '命運'}</h2>
          <div class="card-description">
            ${description}
          </div>
          <button class="btn btn-primary btn-large" id="card-ok-btn">
            確認
          </button>
        </div>
      `
      document.body.appendChild(modal)

      document.getElementById('card-ok-btn')!.onclick = () => {
        document.body.removeChild(modal)
        resolve()
      }
    })
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

  private showRules() {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.innerHTML = `
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>📖 遊戲規則說明</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="rules-content">
            <section class="rule-section">
              <h3>🎯 遊戲目標</h3>
              <p>透過購買地產、建設房屋、股票投資，累積財富成為最後存活的玩家！</p>
            </section>

            <section class="rule-section">
              <h3>🎲 基本規則</h3>
              <ul>
                <li><strong>回合制</strong>：玩家輪流進行回合</li>
                <li><strong>投擲骰子</strong>：每回合開始投擲 2 個骰子，依點數前進</li>
                <li><strong>起點獎勵</strong>：每次經過或停在起點獲得 $2000</li>
                <li><strong>初始資金</strong>：每位玩家起始擁有 $15000</li>
              </ul>
            </section>

            <section class="rule-section">
              <h3>🏠 地產系統</h3>
              <ul>
                <li><strong>購買地產</strong>：踩到無主地產可以購買</li>
                <li><strong>支付租金</strong>：踩到他人地產需支付租金給地主</li>
                <li><strong>建設房屋</strong>：擁有同色全組地產後可建造房屋（最多 4 棟）</li>
                <li><strong>升級飯店</strong>：擁有 4 棟房屋後可升級為飯店</li>
                <li><strong>租金倍增</strong>：房屋和飯店越多，租金越高</li>
              </ul>
            </section>

            <section class="rule-section">
              <h3>📈 股市交易</h3>
              <ul>
                <li><strong>買賣股票</strong>：在股市交易所可以買賣 5 種股票</li>
                <li><strong>價格波動</strong>：每回合結束時股價會隨機波動</li>
                <li><strong>投資策略</strong>：低買高賣以賺取差價</li>
                <li><strong>持股查看</strong>：可隨時查看持有的股票數量</li>
              </ul>
            </section>

            <section class="rule-section">
              <h3>🎴 特殊格子</h3>
              <ul>
                <li><strong>機會 ❓</strong>：抽取機會卡，可能獲得獎勵或懲罰</li>
                <li><strong>命運 📦</strong>：抽取命運卡，觸發隨機事件</li>
                <li><strong>監獄 🚔</strong>：被關 3 回合或擲出雙倍骰才能出獄</li>
                <li><strong>入獄 👮</strong>：直接送往監獄</li>
                <li><strong>稅金 💰</strong>：需繳納固定金額的稅</li>
                <li><strong>車站 🚂</strong>：擁有越多車站，租金越高</li>
                <li><strong>公用事業 ⚡</strong>：租金依骰子點數計算</li>
              </ul>
            </section>

            <section class="rule-section">
              <h3>🏆 勝利條件</h3>
              <ul>
                <li>當只剩一位玩家未破產時，該玩家獲勝</li>
                <li>破產條件：現金不足支付租金或其他費用</li>
              </ul>
            </section>

            <section class="rule-section">
              <h3>💡 遊戲技巧</h3>
              <ul>
                <li>優先購買同色地產組合，才能建造房屋</li>
                <li>建造房屋可大幅提高租金收入</li>
                <li>善用股市系統增加財富</li>
                <li>保留足夠現金應對突發支出</li>
                <li>策略性地選擇投資目標</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)
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
