// 棋盤資料定義
import { Space, SpaceType, PropertyColor } from '../types'

export const BOARD_SPACES: Partial<Space>[] = [
  // Bottom row (0-10)
  { id: 0, name: '起點', type: SpaceType.START },
  { id: 1, name: '台北市', type: SpaceType.PROPERTY, color: PropertyColor.BROWN, price: 600, rent: [20, 100, 300, 900, 1600, 2500], houseCost: 500 },
  { id: 2, name: '命運', type: SpaceType.COMMUNITY_CHEST },
  { id: 3, name: '新北市', type: SpaceType.PROPERTY, color: PropertyColor.BROWN, price: 600, rent: [40, 200, 600, 1800, 3200, 4500], houseCost: 500 },
  { id: 4, name: '所得稅', type: SpaceType.TAX },
  { id: 5, name: '股市交易所', type: SpaceType.STOCK_MARKET },
  { id: 6, name: '桃園市', type: SpaceType.PROPERTY, color: PropertyColor.LIGHT_BLUE, price: 1000, rent: [60, 300, 900, 2700, 4000, 5500], houseCost: 500 },
  { id: 7, name: '機會', type: SpaceType.CHANCE },
  { id: 8, name: '新竹市', type: SpaceType.PROPERTY, color: PropertyColor.LIGHT_BLUE, price: 1000, rent: [60, 300, 900, 2700, 4000, 5500], houseCost: 500 },
  { id: 9, name: '台中市', type: SpaceType.PROPERTY, color: PropertyColor.LIGHT_BLUE, price: 1200, rent: [80, 400, 1000, 3000, 4500, 6000], houseCost: 500 },
  { id: 10, name: '監獄/探監', type: SpaceType.JAIL },

  // Left side (11-20)
  { id: 11, name: '彰化市', type: SpaceType.PROPERTY, color: PropertyColor.PINK, price: 1400, rent: [100, 500, 1500, 4500, 6250, 7500], houseCost: 1000 },
  { id: 12, name: '電力公司', type: SpaceType.UTILITY, price: 1500 },
  { id: 13, name: '雲林縣', type: SpaceType.PROPERTY, color: PropertyColor.PINK, price: 1400, rent: [100, 500, 1500, 4500, 6250, 7500], houseCost: 1000 },
  { id: 14, name: '嘉義市', type: SpaceType.PROPERTY, color: PropertyColor.PINK, price: 1600, rent: [120, 600, 1800, 5000, 7000, 9000], houseCost: 1000 },
  { id: 15, name: '股市交易所', type: SpaceType.STOCK_MARKET },
  { id: 16, name: '台南市', type: SpaceType.PROPERTY, color: PropertyColor.ORANGE, price: 1800, rent: [140, 700, 2000, 5500, 7500, 9500], houseCost: 1000 },
  { id: 17, name: '命運', type: SpaceType.COMMUNITY_CHEST },
  { id: 18, name: '高雄市', type: SpaceType.PROPERTY, color: PropertyColor.ORANGE, price: 1800, rent: [140, 700, 2000, 5500, 7500, 9500], houseCost: 1000 },
  { id: 19, name: '屏東縣', type: SpaceType.PROPERTY, color: PropertyColor.ORANGE, price: 2000, rent: [160, 800, 2200, 6000, 8000, 10000], houseCost: 1000 },
  { id: 20, name: '股市交易所', type: SpaceType.STOCK_MARKET },

  // Top row (21-30)
  { id: 21, name: '宜蘭縣', type: SpaceType.PROPERTY, color: PropertyColor.RED, price: 2200, rent: [180, 900, 2500, 7000, 8750, 10500], houseCost: 1500 },
  { id: 22, name: '機會', type: SpaceType.CHANCE },
  { id: 23, name: '花蓮縣', type: SpaceType.PROPERTY, color: PropertyColor.RED, price: 2200, rent: [180, 900, 2500, 7000, 8750, 10500], houseCost: 1500 },
  { id: 24, name: '台東縣', type: SpaceType.PROPERTY, color: PropertyColor.RED, price: 2400, rent: [200, 1000, 3000, 7500, 9250, 11000], houseCost: 1500 },
  { id: 25, name: '股市交易所', type: SpaceType.STOCK_MARKET },
  { id: 26, name: '澎湖縣', type: SpaceType.PROPERTY, color: PropertyColor.YELLOW, price: 2600, rent: [220, 1100, 3300, 8000, 9750, 11500], houseCost: 1500 },
  { id: 27, name: '金門縣', type: SpaceType.PROPERTY, color: PropertyColor.YELLOW, price: 2600, rent: [220, 1100, 3300, 8000, 9750, 11500], houseCost: 1500 },
  { id: 28, name: '自來水公司', type: SpaceType.UTILITY, price: 1500 },
  { id: 29, name: '馬祖', type: SpaceType.PROPERTY, color: PropertyColor.YELLOW, price: 2800, rent: [240, 1200, 3600, 8500, 10250, 12000], houseCost: 1500 },
  { id: 30, name: '入獄', type: SpaceType.GO_TO_JAIL },

  // Right side (31-39)
  { id: 31, name: '基隆市', type: SpaceType.PROPERTY, color: PropertyColor.GREEN, price: 3000, rent: [260, 1300, 3900, 9000, 11000, 12750], houseCost: 2000 },
  { id: 32, name: '苗栗縣', type: SpaceType.PROPERTY, color: PropertyColor.GREEN, price: 3000, rent: [260, 1300, 3900, 9000, 11000, 12750], houseCost: 2000 },
  { id: 33, name: '命運', type: SpaceType.COMMUNITY_CHEST },
  { id: 34, name: '南投縣', type: SpaceType.PROPERTY, color: PropertyColor.GREEN, price: 3200, rent: [280, 1500, 4500, 10000, 12000, 14000], houseCost: 2000 },
  { id: 35, name: '股市交易所', type: SpaceType.STOCK_MARKET },
  { id: 36, name: '機會', type: SpaceType.CHANCE },
  { id: 37, name: '信義區', type: SpaceType.PROPERTY, color: PropertyColor.BLUE, price: 3500, rent: [350, 1750, 5000, 11000, 13000, 15000], houseCost: 2000 },
  { id: 38, name: '奢侈稅', type: SpaceType.TAX },
  { id: 39, name: '大安區', type: SpaceType.PROPERTY, color: PropertyColor.BLUE, price: 4000, rent: [500, 2000, 6000, 14000, 17000, 20000], houseCost: 2000 }
]

export const INITIAL_STOCKS = [
  { symbol: 'TECH', name: '科技股', price: 100 },
  { symbol: 'BANK', name: '金融股', price: 150 },
  { symbol: 'REAL', name: '房地產股', price: 200 },
  { symbol: 'FOOD', name: '食品股', price: 80 },
  { symbol: 'ENRG', name: '能源股', price: 120 }
]
