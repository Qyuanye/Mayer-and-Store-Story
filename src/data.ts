import {showTextDialog} from "./dialog.ts";
import {
  type Goods,
  type PlayerDatas,
  type PlayerEffect,
  type RandomActivity,
  Rates,
  TileType,
  Weather
} from "./types.ts";

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
    type:Weather.rainy,last:10,
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
  [Weather.sunny]:{
    get popularity(){
      return playerData.popularity*0.03;
    }
  },
  [Weather.rainy]:{
    get popularity(){
      return playerData.popularity*0.03;
    }
  },
  [Weather.foggy]:{
  },
  [Weather.thunder]:{
    get popularity(){
      return playerData.popularity*0.07;
    }
  },
  [Weather.hail]:{
    get prosperity(){
      return playerData.prosperity*0.07;
    }
  }
}