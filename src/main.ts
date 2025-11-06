// 主入口文件
import { Game } from './core/Game'
import { UIManager } from './ui/UIManager'

let game: Game | null = null
let uiManager: UIManager | null = null

// 初始化玩家设置界面
function initPlayerSetup() {
  const playerCountSelect = document.getElementById('player-count') as HTMLSelectElement
  const playerSetup = document.getElementById('player-setup')!

  function updatePlayerInputs() {
    const count = parseInt(playerCountSelect.value)
    const playerColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']
    const defaultNames = ['玩家1', '玩家2', '玩家3', '玩家4']

    playerSetup.innerHTML = ''

    for (let i = 0; i < count; i++) {
      const div = document.createElement('div')
      div.className = 'player-input'
      div.innerHTML = `
        <label style="color: ${playerColors[i]};">玩家 ${i + 1}:</label>
        <input type="text" id="player-${i}" value="${defaultNames[i]}" maxlength="10">
      `
      playerSetup.appendChild(div)
    }
  }

  playerCountSelect.addEventListener('change', updatePlayerInputs)
  updatePlayerInputs()
}

// 开始游戏
function startGame() {
  const playerCountSelect = document.getElementById('player-count') as HTMLSelectElement
  const count = parseInt(playerCountSelect.value)

  const playerNames: string[] = []
  for (let i = 0; i < count; i++) {
    const input = document.getElementById(`player-${i}`) as HTMLInputElement
    const name = input.value.trim() || `玩家${i + 1}`
    playerNames.push(name)
  }

  // 隐藏设置界面
  const setupScreen = document.getElementById('setup-screen')!
  const gameContainer = document.getElementById('game-container')!

  setupScreen.style.display = 'none'
  gameContainer.style.display = 'block'

  // 创建游戏
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
  game = new Game(playerNames)
  uiManager = new UIManager(game, canvas)

  console.log('🎮 遊戲開始！')
  console.log('玩家:', playerNames.join(', '))
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  initPlayerSetup()

  const startButton = document.getElementById('start-game')!
  startButton.addEventListener('click', startGame)

  console.log('🎲 大富翁遊戲已載入')
  console.log('📝 功能包含:')
  console.log('  ✅ 基本大富翁規則')
  console.log('  ✅ 地產購買與升級系統')
  console.log('  ✅ 股市交易系統')
  console.log('  ✅ 機會與命運卡片')
  console.log('  ✅ 2-4人遊戲')
  console.log('  ✅ 簡約卡通風格UI')
})

// 导出供调试使用
;(window as any).game = () => game
;(window as any).state = () => game?.state
