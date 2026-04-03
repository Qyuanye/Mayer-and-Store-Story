import {
  getRandomNumber,
  getSingleTileNearbyBonus,
  multiByResource,
  updatePlayerData,
} from "./utils";
import { TileResConfig, TileType, gameConfig, randActivities, weatherEffect, type PlayerEffect } from "./data";
import { addResources, multiResource, checkTile } from "./utils";
import { playerData } from "./data";
import { scheduler } from "./schedular";
import { ProgressBar } from "./timebar.ts";

function applyTileBonus(): void {
  let totalAddRes: Resource = {
    wood: 0,
    metal: 0,
    water: 0,
    fabric: 0,
    stone: 0,
    food: 0,
  };
  for (let r = 0; r < gameConfig.GRID_SIZE; r++) {
    for (let c = 0; c < gameConfig.GRID_SIZE; c++) {
      const tile = checkTile({ row: r, col: c });
      if (!tile || !tile.type) continue;
      // 基础产出
      const tileType = tile.type as TileType;
      const config = TileResConfig[tileType];
      if (config?.baseBonus)
        totalAddRes = addResources(totalAddRes, multiResource(config.baseBonus, tile.level),);
      // 邻近加成
      const nearbyBonus = getSingleTileNearbyBonus(r, c);
      totalAddRes = addResources(totalAddRes, nearbyBonus);
      if (tile.activeEffects && tile.activeEffects.length > 0) {
        //道具加成
        tile.activeEffects.forEach((eff) => {
          if (eff.effect.modifierType == "flat")
            totalAddRes = addResources(totalAddRes, eff.effect.resourceModifier,);
           else
            totalAddRes = multiByResource(totalAddRes, eff.effect.resourceModifier,);
        });
        tile.activeEffects.forEach((eff) => eff.duration--);
        tile.activeEffects = tile.activeEffects.filter((eff) => eff.duration > 0,);
      }
    }
  }
  playerData.resource = addResources(playerData.resource, totalAddRes, true);
}

function updatePlayerRes() {
  document
    .querySelectorAll<HTMLSpanElement>("span.info-value")
    .forEach((spanElement) => {
      //从data-res属性获取key
      const key = spanElement.dataset.res as keyof Resource;
      if (!key || playerData.resource[key] === undefined) return;
      playerData.resource[key] = Math.min(
        playerData.resource[key],
        playerData.resourceLimit[key],
      );
      const currentVal = playerData.resource[key];
      const maxVal = playerData.resourceLimit[key];
      spanElement.innerText = String(currentVal);
      spanElement.toggleAttribute("data-max", currentVal >= maxVal);
    });
}

//-------------！！！！！----计算商店的收益-------！！！！！----------------
export let fixedCost = 0;
export let baseIncomeGlobal = 0;
let noSaleTurns = 0;

export function applyShopBonus(): void {
  const { population, unlockGoods, popularity } = playerData;
  const BASE_FIXED_COST = gameConfig.FIXED_COST;
  //基础收入=人口X0.12XMax[1,[(繁荣度+人气)/2]^1.4]
  const amplifier = Math.pow(
    Math.max(1, (playerData.prosperity + popularity) / 200),
    1.4,
  );
  const computedBaseIncome = Math.floor(population * 0.12 * amplifier);
  //初始化或恢复baseIncomeGlobal
  if (!baseIncomeGlobal || baseIncomeGlobal < computedBaseIncome) {
    baseIncomeGlobal = computedBaseIncome;
  }
  //选出正在卖的
  const sellingGoods = unlockGoods.filter((g) => g.onSale);
  //若钱为负数不让卖货
  const allowSales = playerData.money > 0;
  let remainingResource: Resource = { ...playerData.resource };
  let totalSalesRevenue = 0;
  let totalMoneyCost = 0;
  let anySoldThisTurn = false;
  //计算每个商品销量
  for (const goods of sellingGoods) {
    //动态参考价=refPrice * (prosperity / 100)
    const dynamicRefPrice = Math.max(
      1,
      Math.floor(goods.refPrice * (playerData.prosperity / 100)),
    ); //60
    // 潜在需求：人口 * baseDemand * Amplifier（阶梯/放大效果）
    const potentialDemand = Math.floor(
      population * goods.baseDemand * amplifier,
    ); //45
    //价格比率=参考价 / 实际价，用于需求衰减/放大
    const priceRatio = dynamicRefPrice / Math.max(1, goods.price); //1.3
    //动态弹性，售价高于参考价时弹性会增加
    let currentElasticity = goods.elasticity; //1.5
    if (goods.price > dynamicRefPrice) {
      const premiumRatio =
        (goods.price - dynamicRefPrice) / Math.max(1, dynamicRefPrice);
      currentElasticity += Math.pow(premiumRatio, 2) * 2; //惩罚强度
    }
    //需求量
    let idealSold = Math.floor(
      potentialDemand * Math.pow(priceRatio, currentElasticity),
    ); //67
    if (idealSold < 0) idealSold = 0;
    //如果整体不允许销售销量为0
    let actualSold = allowSales ? idealSold : 0;
    //以最缺资源为瓶颈
    if (actualSold > 0) {
      let maxByResource = Infinity;
      for (const [resKey, perUnit] of Object.entries(goods.costRes)) {
        const key = resKey as keyof Resource;
        if (!perUnit || perUnit <= 0) continue;
        const avail = remainingResource[key] ?? 0;
        const possible = Math.floor(avail / perUnit);
        if (possible < maxByResource) maxByResource = possible;
      }
      if (maxByResource < actualSold) actualSold = Math.max(0, maxByResource);
    }
    //单件固定成本
    if (actualSold > 0 && goods.cost > 0) {
      const affordableByMoney = Math.floor(playerData.money / goods.cost);
      if (affordableByMoney < actualSold)
        actualSold = Math.max(0, affordableByMoney);
    }
    goods.sold = actualSold;
    totalSalesRevenue += goods.price * actualSold;
    totalMoneyCost += goods.cost * actualSold;
    //扣除资源，卖出多少扣多少倍
    if (actualSold > 0) {
      for (const [resKey, perUnit] of Object.entries(goods.costRes)) {
        const key = resKey as keyof Resource;
        const need = perUnit * actualSold;
        remainingResource[key] = Math.max(
          0,
          (remainingResource[key] ?? 0) - need,
        );
      }
    }
    if (actualSold > 0) anySoldThisTurn = true;
    //繁荣度反馈
    //如果售价低于参考价，繁荣小幅增长/售价远高于参考价，繁荣减缓或倒退
    const priceGapRatio =
      (goods.price - dynamicRefPrice) / Math.max(1, dynamicRefPrice);
    if (goods.price <= dynamicRefPrice) {
      // 奖励：基于该商品的被购买量和基准比率，微小提升繁荣
      const prosperityGain = Math.max(
        0,
        Math.floor(actualSold * 0.01 * (1 + goods.baseDemand)),
      );
      playerData.prosperity += prosperityGain;
    } else {
      //当溢价大于20%时显著惩罚
      if (priceGapRatio > 0.2) {
        const penalty = Math.max(
          0,
          Math.floor(actualSold * 0.001 * (priceGapRatio * 5)),
        );
        playerData.prosperity = Math.max(0, playerData.prosperity - penalty);
      }
    }
  }
  //更新资源
  playerData.resource = {
    wood: remainingResource.wood,
    metal: remainingResource.metal,
    water: remainingResource.water,
    fabric: remainingResource.fabric,
    stone: remainingResource.stone,
    food: remainingResource.food,
  };
  //固定成本随繁荣增长
  let scaledFixedCost = 0;
  if (anySoldThisTurn) {
    scaledFixedCost = Math.floor(
      BASE_FIXED_COST * Math.max(1, 1 + playerData.prosperity / 280),
    );
  }
  fixedCost = scaledFixedCost;
  //免卖回血机制
  if (playerData.money > 0 && !anySoldThisTurn) {
    noSaleTurns += 1;
    if (noSaleTurns >= 4) {
      const roundsOver = noSaleTurns - 2;
      baseIncomeGlobal = Math.max(
        0,
        Math.floor(baseIncomeGlobal / Math.pow(2, roundsOver)),
      );
    }
  } else {
    noSaleTurns = 0;
    baseIncomeGlobal = computedBaseIncome;
  }
  playerData.lasttotalIncome = totalSalesRevenue + baseIncomeGlobal;
  playerData.lastnetIncome =
    playerData.lasttotalIncome - totalMoneyCost - scaledFixedCost;
  playerData.money = Math.floor(playerData.money + playerData.lastnetIncome);
  playerData.totalprofit = Math.floor(
    playerData.totalprofit + playerData.lastnetIncome,
  );
  const profitFactor =
    playerData.totalprofit > 0
      ? Math.log10(10 + playerData.totalprofit / 1000)
      : -Math.log10(10 - playerData.totalprofit / 1000);
  playerData.score = Math.floor(
    60 * profitFactor + playerData.population / 10 + playerData.prosperity / 10,
  );
  playerData.day+=1;
}

function doRandomActivity(): void {
  const { prosperity, population, money, popularity } = playerData;
  //需要用到的玩家数据
  const data = { money, prosperity, population, popularity };
  let triggeredThisTurn = false;
  //筛选出未触发过的且排序一下
  const act = randActivities
    .map((item, index) => ({ item, index }))
    .filter((wrapper) => !wrapper.item.triggered)
    .sort((a, b) => {
      const reqA = a.item.requirement;
      const reqB = b.item.requirement;
      const keyA = Object.keys(reqA)[0] as keyof PlayerEffect;
      const keyB = Object.keys(reqB)[0] as keyof PlayerEffect;
      if (keyA !== keyB) return keyA.localeCompare(keyB);
      const valA = reqA[keyA];
      const valB = reqB[keyB];
      return (valA ?? 0) > (valB ?? 0) ? 1 : -1;
    });
  //事件的key名
  const keys = act.map((e) => Object.keys(e.item.requirement)[0]);
  Object.entries(data).forEach(([key, value]) => {
    if (triggeredThisTurn) return;//触发一次
    const matched = keys.indexOf(key);//按key逐一匹配
    if (matched < 0) return;
    const pvalue = Object.entries(data).find((e) => {
      if (e[0] === key) return e[1];
    })!;
    if (value <= pvalue[1]) {
      randActivities[act[matched].index].triggered = true;
      act[matched].item.activity();
      triggeredThisTurn = true;
    }
  });
}

function doWeatherActivity(): void {
  playerData.weather.last -= 1;
  const doWeatherEffect: (bonus: boolean) => void = (bonus) => {
    switch (playerData.weather.type) {
      case "sunny": {
          playerData.weather.effect.popularity! -=bonus?
            -weatherEffect.sunny.popularity!:weatherEffect.sunny.popularity!;
        break;
      }
      case "rainy": {
          playerData.weather.effect.popularity! -=bonus?
            -weatherEffect.rainy.popularity!:weatherEffect.rainy.popularity!;
        break;
      }
      case "foggy":
        break;
      case "ice":
      case "thunder": {
          playerData.weather.effect.prosperity! -=bonus?
            -weatherEffect.ice.prosperity!:weatherEffect.ice.prosperity!;
        break;
      }
      default:
        break;
    }
  };
  const makeWeather: () => void = () => {
    //清除之前的
    doWeatherEffect(true);
    const prob = getRandomNumber(0, 10) / 10;
    if (prob < 0.5) playerData.weather.type = "sunny";
    else if (prob >= 0.5 && prob < 0.7) playerData.weather.type = "rainy";
    else if (prob >= 0.7 && prob < 0.8) playerData.weather.type = "foggy";
    else if (prob >= 0.8 && prob < 0.9) playerData.weather.type = "ice";
    else playerData.weather.type = "thunder";
    playerData.weather.last = playerData.weather.type === "sunny" ? 10 : 5;
  };
  if (playerData.weather.last === 0) {
    makeWeather();
    doWeatherEffect(false);
  }else if(playerData.weather.type==='sunny'&&playerData.weather.last===10){
    doWeatherEffect(true);
  }else if(playerData.weather.type!=='sunny'&&playerData.weather.last===5){
    doWeatherEffect(true);
  }
  playWeatherAnim();
}

function playWeatherAnim():void{

}

const progressBar = new ProgressBar(gameConfig.DAY_SECOND, 5, () => {
  applyShopBonus();
  applyTileBonus();
  doRandomActivity();
  doWeatherActivity();
});

let lastTimestamp = 0;
function barLoop(timestamp: number) {
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
    requestAnimationFrame(barLoop);
    return;
  }
  lastTimestamp = timestamp;
  progressBar.update(deltaTime);
  requestAnimationFrame(barLoop);
}

export function mainLoop(): void {
  requestAnimationFrame(barLoop);
  scheduler.addTask(updatePlayerData, 0, -1, 500);
  scheduler.addTask(updatePlayerRes, 0, -1, 500);
  scheduler.start();
}
