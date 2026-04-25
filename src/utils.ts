import { weatherIcons } from "./assets.ts";
import {gameConfig, nearbyResBonus, NeighborBonusConfig, playerData} from "./data";
import { scene } from "./main.ts";
import {
  effectName,
  type GlobalItem,
  type PlayerEffect,
  Rates,
  resourceName,
  type TileData,
  type TileItem, TileType,
  weatherName
} from "./types.ts";

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**获得周围3x3范围内的格子坐标（不含数据）
 */
export function getSurroundingTiles(
  start: Position,
  countSelf: boolean = false,
): Position[] {
  let nearbyCells: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!countSelf && dr === 0 && dc === 0) continue;
      const newRow = start.row + dr;
      const newCol = start.col + dc;
      if (
        newRow > -1 &&
        newRow < gameConfig.GRID_SIZE &&
        newCol > -1 &&
        newCol < gameConfig.GRID_SIZE
      )
        nearbyCells.push({ row: newRow, col: newCol });
    }
  }
  return nearbyCells;
}

export function multiResource(
    res: Partial<Resource>,
    factor: number,
    limitCheck: boolean = false,
): Resource {
  const keys: (keyof Resource)[] = [
    "wood",
    "metal",
    "water",
    "fabric",
    "stone",
    "food",
  ];
  const result = {} as Resource;
  for (const key of keys) {
    let value = Math.floor((res[key] ?? 0) * factor);
    if (limitCheck) {
      const limit = playerData.resourceLimit[key];
      if (value > limit) value = limit;
    }
    result[key] = value;
  }
  return result;
}


export function multiByResource(
    res1: Partial<Resource>,
    res2: Partial<Resource>,
    limitCheck: boolean = false,
): Resource {
  const keys: (keyof Resource)[] = [
    "wood",
    "metal",
    "water",
    "fabric",
    "stone",
    "food",
  ];
  const result = {} as Resource;
  for (const key of keys) {
    let value = res1[key] ?? 0;
    if (res2[key] !== undefined) {
      value = Math.floor(value * res2[key]!);
    }
    if (limitCheck) {
      const limit = playerData.resourceLimit[key];
      if (value > limit) value = limit;
    }
    result[key] = value;
  }
  return result;
}

export function addResources(
  res1: Partial<Resource>,
  res2: Partial<Resource>,
  limitCheck: boolean = false,
): Resource {
  const keys: (keyof Resource)[] = [
    "wood",
    "metal",
    "water",
    "fabric",
    "stone",
    "food",
  ];
  const result = {} as Resource;
  for (const key of keys) {
    let value = (res1[key] ?? 0) + (res2[key] ?? 0);
    if (limitCheck) {
      const limit = playerData.resourceLimit[key];
      if (value > limit) value = limit;
    }
    result[key] = value;
  }
  return result;
}

export function subResources(
  res1: Partial<Resource>,
  res2: Partial<Resource>,
): Resource {
  const keys: (keyof Resource)[] = [
    "wood",
    "metal",
    "water",
    "fabric",
    "stone",
    "food",
  ];
  const result = {} as Resource;
  for (const key of keys) {
    result[key] = (res1[key] ?? 0) - (res2[key] ?? 0);
  }
  return result;
}

/**
 * base是比较的基准，如果res不够就false
 */
export function compResource(
  base: Partial<Resource>,
  res: Partial<Resource>,
): boolean {
  const keys: (keyof Resource)[] = [
    "wood",
    "metal",
    "water",
    "fabric",
    "stone",
    "food",
  ];
  for (const key of keys) {
    const required = base[key] ?? 0;
    const available = res[key] ?? 0;
    if (available < required) return false;
  }
  return true;
}

/**
 * 获得周围上下左右的格子坐标,不包括自己
 */
export function getNearbyTiles(start: Position): Position[] {
  const nearby: Position[] = [];
  const dirs = [
    { r: 0, c: -1 },
    { r: 0, c: 1 },
    { r: -1, c: 0 },
    { r: 1, c: 0 },
  ];
  for (const d of dirs) {
    const row = start.row + d.r;
    const col = start.col + d.c;
    if (
      row >= 0 &&
      row < gameConfig.GRID_SIZE &&
      col >= 0 &&
      col < gameConfig.GRID_SIZE
    )
      nearby.push({ row, col });
  }
  return nearby;
}

/**
 * 传入一个坐标，获得格子的数据
 */
export function checkTile(cell: Position): TileData | undefined {
  if (!scene.grid[cell.row]) return undefined;
  return scene.grid[cell.row][cell.col].data;
}

export function updatePlayerData(): void {
  const dataTable: HTMLTableCellElement[] = Array.from(
    document.querySelectorAll<HTMLTableCellElement>(".value-table td"), //6个
  ).slice(0, 6);
  const strings: { [key: number]: string } = {
    1: `金钱:${playerData.money}`,
    2: `黄金:${playerData.gold}`,
    3: `人气:${playerData.popularity}`,
    4: `繁荣度:${playerData.prosperity}`,
    5: `人口:${playerData.population}`,
    6: `评级: `,
  };
  dataTable.forEach((table, index) => {
    if (index < 5) table.textContent = strings[index + 1] as string;
    if (index === 5) {
      //最大评级S对应分数800，超过800分显示S
      if (Math.floor(playerData.score / 100) > 7) table.textContent = "评级: S";
      else
        table.textContent = ((strings[index + 1] as string) +
          Rates[Math.floor(playerData.score / 100)]) as keyof typeof Rates;
    }
  });
  //天气图标
  const iconContainer = document.getElementById("weatherIconContainer");
  const textContainer = document.getElementById("weatherText");
  if (iconContainer && textContainer) {
    iconContainer.innerHTML = "";
    const newIcon = weatherIcons[playerData.weather.type];
    if (newIcon) iconContainer.appendChild(newIcon);
    textContainer.textContent =
      weatherName[playerData.weather.type] + `(${playerData.weather.last}天)`;
  }
}

export function applyGlobalItemEffect(item: GlobalItem) {
  const effect = item.effect;
  for (const key in effect) {
    const value = effect[key as keyof PlayerEffect];
    if (value !== undefined) {
      playerData[key as keyof PlayerEffect] += value;
    }
  }
}

export function formatResourceString(
    resources: includeRes,
    type: "cost" | "bonus" = "bonus",
    remaining?: number,
): string {
  const entries = Object.entries(resources).filter(([, value]) => value && value !== 0);
  if (entries.length === 0) return "";
  const sign = type === "cost" ? "-" : "+";
  const typeName = type === "cost" ? "消耗" : "产出";
  const parts = entries.map(([key, value]) => {
    const name = resourceName[key as keyof Resource] || key;
    return `${name}${sign}${value}`;
  });
  let result = `${typeName}:${parts.join(",")}`;
  if (remaining !== undefined)
    result += `\n加成剩余${remaining}回合`;
  return result;
}

export function formatResRequirement(res: includeRes): string {
  const entries = Object.entries(res).filter(([, value]) => value && value !== 0);
  if (entries.length === 0) return "";
  const parts = entries.map(([key, value]) => {
    const name = resourceName[key as keyof Resource] || key;
    return `${name}:${value}`;
  });
  return `需要资源${parts.join("，")}`;
}

export async function applyTileItemEffect(item: TileItem): Promise<boolean> {
  const pos = await scene.makeSelect(item.targetTileTypes);
  if (!pos) {
    return false;
  }
  const tile=checkTile(pos)!;
  if (!tile.activeEffects) {
    tile.activeEffects = [];
  }
  tile.activeEffects.push({
    duration:item.duration,
    effect: item.effect,
    sourceName:item.name
  });
  return true;
}

export function getSingleTileNearbyBonus(row: number, col: number): Partial<Resource> {
  const currentCell = checkTile({ row, col });
  if (!currentCell || !currentCell.type) return {};
  let totalBonus: Partial<Resource> = {};
  const neighbors = getNearbyTiles({ row, col });
  //遍历加成关系
  NeighborBonusConfig.forEach(config => {
    //检查当前地块有没有加成关系
    if (config.types.includes(currentCell.type as TileType)) {
      //找另一方
      const targetType = config.types.find(t => t !== currentCell.type)
          || currentCell.type;
      //计算相邻有多少个
      let count = 0;
      neighbors.forEach(pos => {
        if (checkTile(pos)?.type === targetType)  count++;
      });
      if (count > 0 && nearbyResBonus[config.bonusKey]) {
        const bonusValues = nearbyResBonus[config.bonusKey];
        for (const [resKey, value] of Object.entries(bonusValues)) {
          const key = resKey as keyof Resource;
          totalBonus[key] = (totalBonus[key] || 0) + (value! * count);
        }
      }
    }
  });
  return totalBonus;
}

export function formatPlayerEffectString(eff:PlayerEffect):string{
  const entries=Object.entries(eff).filter(([_,value]) => value&&value !== 0);
  if (entries.length === 0) return "";
  const parts=entries.map(([k,v])=>{
    const name=effectName[k as keyof PlayerEffect];
    return `${name}:+${v}`;
  })
  return parts.join(",")
}