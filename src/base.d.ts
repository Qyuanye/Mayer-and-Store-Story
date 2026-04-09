declare interface Resource {
    wood: number;
    metal: number;
    water: number;
    fabric: number;
    stone: number;
    food: number;
}

declare interface Position {
    row: number;
    col: number;
}

declare type includeRes = Partial<Resource>;

declare interface TileConfigData {
    placeCost?: includeRes;
    baseBonus?: includeRes;
    refundBonus?: includeRes;
}
//背包中的道具条目
declare interface InventoryItem {
    id: string; //英文（id
    nameCh: string; //中文名
    quantity: number; //当前数量（堆叠）
}

//基础道具属性（所有道具共有）
declare interface BaseItem {
    id: string; //唯一标识
    name: string; //道具名称
    description: string; //道具描述
    buyPrice: number;
    sellPrice: number;
}

declare interface GoldItem{
    id:string,
    name:string,
    description:string,
    price:number
    effect:()=>void,
}

declare interface Appstats {
    currentMode:string,
    cancelAction:()=>void
}