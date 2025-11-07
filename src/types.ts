// 遊戲核心類型定義

export enum SpaceType {
  PROPERTY = 'property',
  STATION = 'station',
  UTILITY = 'utility',
  START = 'start',
  JAIL = 'jail',
  FREE_PARKING = 'free_parking',
  GO_TO_JAIL = 'go_to_jail',
  CHANCE = 'chance',
  COMMUNITY_CHEST = 'community_chest',
  TAX = 'tax',
  STOCK_MARKET = 'stock_market'
}

export enum PropertyColor {
  BROWN = '#8B4513',
  LIGHT_BLUE = '#87CEEB',
  PINK = '#FF69B4',
  ORANGE = '#FFA500',
  RED = '#FF0000',
  YELLOW = '#FFD700',
  GREEN = '#00FF00',
  BLUE = '#0000FF'
}

export interface Space {
  id: number
  name: string
  type: SpaceType
  position: { x: number; y: number }
}

export interface Property extends Space {
  type: SpaceType.PROPERTY
  color: PropertyColor
  price: number
  rent: number[]  // [base, 1house, 2house, 3house, 4house, hotel]
  houseCost: number
  owner: number | null  // player index
  houses: number  // 0-4, 5 = hotel
  mortgaged: boolean
}

export interface Station extends Space {
  type: SpaceType.STATION
  price: number
  rent: number[]  // [1 station, 2 stations, 3 stations, 4 stations]
  owner: number | null
  mortgaged: boolean
}

export interface Utility extends Space {
  type: SpaceType.UTILITY
  price: number
  owner: number | null
  mortgaged: boolean
}

export interface Player {
  id: number
  name: string
  money: number
  position: number
  color: string
  inJail: boolean
  jailTurns: number
  properties: number[]  // space ids
  stocks: Map<string, number>  // stock symbol -> quantity
  bankrupted: boolean
}

export interface Stock {
  symbol: string
  name: string
  price: number
  history: number[]
  change: number  // percentage change
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  spaces: Space[]
  stocks: Stock[]
  turn: number
  dice: [number, number]
  gameOver: boolean
  winner: number | null
}

export interface Card {
  id: number
  type: 'chance' | 'community'
  description: string
  action: (game: any, player: Player) => void
}
