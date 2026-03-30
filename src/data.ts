import {showTextDialog} from "./dialog.ts";

export enum Color {
  lightBlue = "#e1f0ff",
  blue = "#4a90e2",
  lightGreen = "#c9ebd0",
  green = "#19ff05c7",
  yellow = "#fff3cd",
  lightRed = "#ffb1b8",
  black = "#333333",
  white = "#ffffff",
  lightYellow = "#fff9e6",
  gold = "#ffc107",
  orange = "#fd7e14",
  lightPurple = "#f0e6ff",
  purple = "#9b59b6",
  deepPurple = "#6c3483",
  borderGray = "#e1e4e8",
  textGray = "#6c757d",
  disabledGray = "#ced4da",
  darkGray = "#495057",
  pink = "#ffd1dc",
  teal = "#b2f0e5",
  brown = "#e6d5b8",
}

export enum TileType {
  city = "city",
  forest = "forest",
  river = "river",
  shop = "shop",
  grass = "grass",
  factory = "factory",
  airport = "airport",
  mountain = "mountain",
}

export const TileName: Record<TileType, string> = {
  [TileType.city]: "城市",
  [TileType.forest]: "森林",
  [TileType.river]: "河流",
  [TileType.shop]: "商店",
  [TileType.grass]: "草地",
  [TileType.factory]: "工厂",
  [TileType.airport]: "机场",
  [TileType.mountain]: "山地",
};

//预设场景(遗留代码)
export const presetTile: Record<TileType, TileData> = {
  [TileType.forest]: {
    type: TileType.forest,
    bgColor: Color.green,
    textColor: Color.white,
    level: 1,
  },
  [TileType.city]: {
    type: TileType.city,
    bgColor: Color.lightBlue,
    textColor: Color.white,
    level: 1,
  },
  [TileType.mountain]: {
    type: TileType.mountain,
    bgColor: Color.yellow,
    textColor: Color.white,
    level: 1,
  },
  [TileType.river]: {
    type: TileType.river,
    bgColor: Color.blue,
    textColor: Color.white,
    level: 1,
  },
  [TileType.shop]: {
    type: TileType.shop,
    bgColor: Color.lightRed,
    textColor: Color.white,
    level: 1,
  },
  [TileType.grass]: {
    type: TileType.grass,
    bgColor: Color.lightGreen,
    textColor: Color.black,
    level: 1,
  },
  [TileType.airport]: {
    type: TileType.airport,
    bgColor: Color.gold,
    textColor: Color.white,
    level: 1,
  },
  [TileType.factory]: {
    type: TileType.factory,
    bgColor: Color.brown,
    textColor: Color.white,
    level: 1,
  },
} as Record<TileType, TileData>;

export enum Rates {
  F,
  E,
  D,
  C,
  B,
  A,
  S,
}
//ENG2CHN
export const resourceName: Record<keyof Resource, string> = {
  wood: "木材",
  metal: "金属",
  water: "水",
  fabric: "纤维",
  stone: "石头",
  food: "食物",
};
export const effectName:Record<keyof PlayerEffect,string>={
popularity:"人气",
  population:"人口",
  money:"金钱",
  gold:"金币",
  prosperity:"繁荣度",
  score:"分数"
}


export let playerData: PlayerDatas = {
  day:1,
  money: 800,
  gold: 10,
  popularity: 100,
  prosperity: 150,
  population: 200,
  rate: Rates.F,
  score: 0,
  name: "玩家",
  totalprofit: 0,
  position: { row: 0, col: 0 },
  lasttotalIncome: 0,
  lastnetIncome: 0,
  mapdata: [],
  resource: {
    wood: 100,
    metal: 100,
    water: 120,
    fabric: 100,
    stone: 100,
    food: 100,
  },
  resourceLimit: {
    wood: 200,
    metal: 200,
    water: 200,
    fabric: 200,
    stone: 200,
    food: 200,
  },
  inventory: [],
  unlockGoods: [
    {
      name: "🧻卫生纸", //卫生纸默认解锁
      price: 15, //默认值
      cost: 5,
      refPrice: 10,
      baseDemand: 0.032,
      elasticity: 1.3,
      costRes: {
        wood: 1,
      },
      unlockRes: {},
      sold: 0,
      onSale: true,
    },
  ],
  weather:{
    type:"sunny",last:10,
    effect:{
      prosperity:0,
      popularity:0
    }
  }
};

//配置
export const gameConfig = {
  FIXED_COST: 60,
  GRID_SIZE: 12, //格子大小
  DAY_SECOND: 12,//一天的秒数
  SHOW_TILE_TEXT:true,
};

//地块的基础资源数据,顺序和tiletype对应
//placecost，放置消耗，basebonus每日基础产出，refundbonus摧毁返还
export const TileResConfig: Record<string, TileConfigData> = {
  city: {
    placeCost: {
      wood: 120,
      stone: 100,
      water: 100,
      metal: 40,
      fabric: 50,
      food: 100,
    },
    baseBonus: { food: 2, water: 1, metal: 2 },
    refundBonus: { wood: 60, stone: 50, metal: 20, water: 50, food: 50 },
  },
  forest: {
    placeCost: { wood: 100, water: 100 },
    baseBonus: { wood: 1, fabric: 1 },
    refundBonus: { wood: 50, water: 50 },
  },
  river: {
    baseBonus: { water: 1, food: 1 },
  },
  shop: {},
  grass: {},
  factory: {
    placeCost: { metal: 100, stone: 150, wood: 50, food: 100 },
    baseBonus: { metal: 4, stone: 2 ,fabric:2,food:2},
    refundBonus: { metal: 50, stone: 75, wood: 25, food: 50 },
  },
  airport: {
    placeCost: { metal: 200, stone: 300, wood: 100, fabric: 150 },
    baseBonus: { metal: 3, fabric: 2, wood: 2, stone: 2, food: 3 },
    refundBonus: { metal: 100, stone: 150, wood: 50, fabric: 75 },
  },
  mountain: {
    baseBonus: { metal: 1, stone: 1 ,food:1},
  },
};

//地块配置2，用于管理繁荣度等数据
export const TileDataConfig: Record<string, PlayerEffect> = {
  city: {
    population: 15, //75-125
    prosperity: 10, //50
    popularity: 10, //50-100
  },
  forest: {
    prosperity: 2, //75-25
  },
  river: {
    prosperity: 2,
  },
  shop: {},
  grass: {},
  factory: {
    popularity: 25,
    prosperity: 25,
  },
  airport: {
    population: 70,
    prosperity: 30,
    popularity: 30,
  },
  mountain: {
    prosperity: 2,
  },
};

// 定义地块之间的加成关系
export const NeighborBonusConfig = [
  { types: [TileType.forest, TileType.river], bonusKey: "fr" },
  { types: [TileType.city, TileType.shop], bonusKey: "cs" },
  { types: [TileType.forest, TileType.city], bonusKey: "fc" },
  { types: [TileType.airport, TileType.city], bonusKey: "ac" },
  { types: [TileType.factory, TileType.airport], bonusKey: "fa" },
  { types: [TileType.factory, TileType.mountain], bonusKey: "fm" },
];

export const nearbyResBonus: Record<string, Partial<Resource>> = {
  fr: { wood: 1, water: 1, food: 1 },
  cs: { metal: 1, food: 1 },
  fc: { wood: 1, food: 1, fabric: 1 },
  ac: { food: 2, stone: 1 },
  fa: { metal: 1, food: 1, wood: 1 },
  fm: { stone: 1, wood: 1 },
};

type Weather="sunny"|"rainy"|"thunder"|"foggy"|"ice";

export interface PlayerDatas {
  day:number;
  money: number;
  gold: number;
  popularity: number;
  prosperity: number;
  population: number;
  totalprofit: number;
  rate: Rates;
  score: number;
  name: string;
  position: Position;
  mapdata: TileData[][];
  resource: Resource;
  resourceLimit: Resource;
  inventory: InventoryItem[];
  unlockGoods: GoodsStatus[];
  lasttotalIncome: number;
  lastnetIncome: number;
  weather:{type:Weather,
    last:number,
    effect:PlayerEffect
  }
}

//玩家属性效果
export type PlayerEffect = Partial<
  Pick<
    PlayerDatas,
    "popularity" | "population" | "money" | "gold" | "prosperity" | "score"
  >
>;

//地块道具，使用在地块上，影响该地块资源产出
export interface TileItem extends BaseItem {
  targetTileTypes: TileType[]; //允许使用的地块类型（空数组表示所有类型）
  effect: ResourceEffect; //只影响地块资源产出
  duration: number; //持续回合数为 undefined
}
//全局道具，直接使用，影响玩家属性
export interface GlobalItem extends BaseItem {
  effect: PlayerEffect;
}

//资源产出效果
export type ResourceEffect = {
  resourceModifier: Partial<Record<keyof Resource, number>>; //资源倍率或固定值
  modifierType: "multiplier" | "flat"; //是乘算还是加算
};

export interface TileEffect {
  duration: number;
  effect: ResourceEffect;
  sourceName?: string;
}

export interface TileData {
  type: TileType;
  bgColor: Color;
  textColor: Color;
  level: number;
  activeEffects?: TileEffect[];
}

export interface GridCell {
  x: number; //在画布上的物理坐标 X
  y: number; //在画布上的物理坐标 Y
  width: number; //格子宽度
  height: number; //格子高度
  row: number; //行索引
  col: number; //列索引
  data: TileData; //格子数据
}

//地块升级要的基础资源
export const levelupRes = {
  [TileType.forest]: {
    water: 50,
    food: 40,
    fabric: 20,
  },
  [TileType.river]: {
    water: 70,
    food: 60,
  },
  [TileType.city]: {
    water: 70,
    food: 50,
    stone: 60,
    metal: 80,
    fabric: 50,
    wood: 60,
  },
  [TileType.factory]: {
    water: 100,
    food: 80,
    stone: 100,
    metal: 80,
    fabric: 100,
  },
  [TileType.mountain]: {
    water: 40,
    wood: 50,
    stone: 100,
    metal: 100,
  },
  [TileType.airport]: {
    water: 130,
    food: 100,
    stone: 100,
    metal: 100,
    fabric: 120,
  },
};

export interface Goods {
  name: string;
  price: number; //定价
  cost: number; //固定成本
  costRes: includeRes; //每日消耗
  unlockRes: includeRes; //解锁所需资源
  refPrice: number; //参考价，隐藏值，不显示
  baseDemand: number; //基础需求系数(<0.15)平均每人每天要多少，直接影响销量
  elasticity: number; //价格弹性系数(1-3)需求对价格变化的敏感度
}

export interface GoodsStatus extends Goods {
  sold: number; //售出数目
  onSale: boolean;
}

export const ShopGoods: Goods[] = [
  {
    name: "🍜方便面",
    price: 35,
    cost: 20,
    refPrice: 30,
    baseDemand: 0.025,
    elasticity: 1.4,
    costRes: {
      food: 3,
      water: 2,
    },
    unlockRes: {
      food: 100,
      water: 100,
    },
  },
  {
    name: "🥼服装",
    price: 60,
    cost: 30,
    refPrice: 45,
    baseDemand: 0.015,
    elasticity: 1.7,
    costRes: {
      fabric: 2,
      wood: 1,
      metal: 1,
    },
    unlockRes: {
      fabric: 100,
      wood: 100,
      metal: 100,
    },
  },
  {
    name: "⚒️日用工具",
    price: 50,
    refPrice: 40,
    cost: 35,
    baseDemand: 0.02,
    elasticity: 1.5,
    costRes: {
      metal: 1,
      wood: 1,
      stone: 1,
    },
    unlockRes: {
      metal: 100,
      wood: 100,
      stone: 80,
    },
  },
  {
    name: "⌚电子手表",
    price: 100,
    refPrice: 80,
    cost: 70,
    baseDemand: 0.013,
    elasticity: 1.8,
    costRes: {
      metal: 1,
      wood: 1,
    },
    unlockRes: {
      metal: 200,
      wood: 150,
      fabric: 150,
    },
  },
  {
    name: "💻电脑",
    price: 400,
    refPrice: 350,
    cost: 320,
    baseDemand: 0.012,
    elasticity: 2.3,
    costRes: {
      metal: 2,
      wood: 1,
      fabric: 1,
      stone: 1,
    },
    unlockRes: {
      metal: 200,
      wood: 100,
      fabric: 150,
      stone: 200,
    },
  },
  {
    name: "📿奢侈品",
    price: 600,
    refPrice: 520,
    cost: 420,
    baseDemand: 0.005,
    elasticity: 2,
    costRes: {
      metal: 3,
      wood: 2,
      fabric: 1,
      stone: 1,
    },
    unlockRes: {
      metal: 200,
      wood: 150,
      fabric: 150,
      stone: 120,
    },
  },
];

export interface RandomActivity {
  requirement:PlayerEffect,
  triggered: boolean;
  activity: () => void;
}


export const randActivities:RandomActivity[]=[
  {
    requirement:{
     money:5000
    },
    triggered:false,
    activity:()=>{
      showTextDialog(["你完成了赚到五千块成就\n人口与繁荣度已提升！"])
      playerData.population+=3;
      playerData.prosperity+=3;
    }
  },
  {
    requirement:{
     money:10000
    },
    triggered:false,
    activity:()=>{
      showTextDialog(["你完成了赚到一万块成就\n获得10金币！"])
      playerData.gold+=10;
    }
  },
  {
    requirement:{
     money:50000
    },
    triggered:false,
    activity:()=>{
      showTextDialog(["你完成了赚到五万块成就\n获得20金币！"])
      playerData.gold+=20;
    }
  },
  {
    requirement:{
     population:200
    },
    triggered:false,
    activity:()=>{
      showTextDialog(["你完成了200人口成就\n人气已提升！"])
      playerData.popularity+=2;
    }
  }
]

export const weatherEffect:Record<Weather,PlayerEffect>={
  sunny:{
    get popularity(){
      return playerData.popularity*0.03;
    }
  },
  rainy:{
    get popularity(){
      return playerData.popularity*0.03;
    }
  },
  foggy:{
  },
  thunder:{
    get popularity(){
      return playerData.popularity*0.07;
    }
  },
  ice:{
    get prosperity(){
      return playerData.prosperity*0.07;
    }
  }
}