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

export enum Weather{
    sunny="sunny",
    rainy="rainy",
    thunder="thunder",
    foggy="foggy",
    hail="hail"
}

export const weatherName:Record<Weather,string>={
    [Weather.sunny]:"晴天",
    [Weather.rainy]:"雨天",
    [Weather.thunder]:"雷雨天",
    [Weather.foggy]:"雾天",
    [Weather.hail]:"冰雹"
}

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

export interface RandomActivity {
    requirement:PlayerEffect,
    triggered: boolean;
    activity: () => void;
}
