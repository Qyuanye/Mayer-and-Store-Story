import {
  asyncDialog,
  hideTaskHint,
  showConfirmDialog,
  showInputDialog,
  showMenuDialog,
  showTaskHint,
  showTextDialog,
} from "./dialog";
import { scene } from "./main";
import {
  addResources,
  applyGlobalItemEffect,
  applyTileItemEffect,
  compResource,
  formatPlayerEffectString,
  formatResourceString,
  formatResRequirement,
  multiResource,
  subResources,
} from "./utils";
import { goldItems, globalItems, tileItems } from "./itemLibrary.ts";
import { baseIncomeGlobal, fixedCost } from "./tile.ts";
import { help, helpText1, helpText2, helpText3, helpText4 } from "./gtext.ts";
import {playerData, ShopGoods, TileDataConfig, TileResConfig} from "./data.ts";
import {presetTile, TileName, TileType} from "./types.ts";

export function menuPlaceTile(): void {
  //过滤不能放的
  const tileList = Object.values(TileName).filter(
    (e) => !["河流", "商店", "草地", "山地"].includes(e),
  );
  const tileKey = Object.values(TileType).filter(
    (e) => !["river", "shop", "grass", "mountain"].includes(e),
  ) as string[];
  const resReq = Object.entries(TileResConfig)
    .filter((e) => tileKey.includes(e[0]))
    .map((e) => formatResRequirement(e[1].placeCost!));
  //把附加信息拼上去
  const genRes = Object.entries(TileResConfig)
    .filter((e) => tileKey.includes(e[0]))
    .map((e) => formatResourceString(e[1].baseBonus!));
  const des = resReq.map((e, i) => genRes[i] + " || " + e);
  const effs = Object.entries(TileDataConfig)
    .filter((e) => tileKey.includes(e[0]))
    .map((e) => formatPlayerEffectString(e[1]));
  const finalTitles = tileList.map((e, i) => `${e}(效果 ${effs[i]})`);
  showMenuDialog("要放置什么?", finalTitles, des).then(async (e) => {
    if (e == -1) return;
    if (
      !compResource(TileResConfig[tileKey[e]].placeCost!, playerData.resource)
    ) {
      hideTaskHint();
      showTextDialog(["资源不够!"]);
      return;
    }
    showTaskHint("点击放置");
    const menuBtn = document.getElementById("menu") as HTMLButtonElement;
    menuBtn.textContent = "取消";
    await scene.makePlace(presetTile[tileKey[e] as TileType]);
    menuBtn.textContent = "菜单";
    //加玩家属性
    playerData.population += TileDataConfig[tileKey[e]].population ?? 0;
    playerData.popularity += TileDataConfig[tileKey[e]].popularity ?? 0;
    playerData.prosperity += TileDataConfig[tileKey[e]].prosperity ?? 0;
    hideTaskHint();
    subResources(playerData.resource, TileResConfig[tileKey[e]].placeCost!);
  });
}

export async function menuDemonishTile(): Promise<void> {
  showTaskHint("点击要拆除的区块");
  const menuBtn = document.getElementById("menu") as HTMLButtonElement;
  menuBtn.textContent = "取消";
  await scene.makeDemolish(); //等待拆除模式结束
  //恢复界面
  menuBtn.textContent = "菜单";
  hideTaskHint();
}

export function menuGoldshop() {
  const itemNames = goldItems.map((item) => item.name);
  const descriptions = goldItems.map((item) => item.description);
  const prices: number[] = goldItems.map((item) => item.price);
  showMenuDialog(
    "金币商店",
    itemNames,
    descriptions.map((e, i) => `价格:${prices[i]},描述:${e}`),
  ).then((selectedIndex) => {
    if (selectedIndex === -1) return;
    const selectedItem = goldItems[selectedIndex];
    if (playerData.gold < selectedItem.price) {
      showTextDialog(["金币不足!"]);
      return;
    }
    playerData.gold -= selectedItem.price;
    selectedItem.effect();
  });
}

export function menuItem() {
  showMenuDialog("operation", ["购买", "售卖", "背包"]).then((e) => {
    if (e == -1) return;
    if (e == 0) {
      //buy
      const keys = [...Object.keys(globalItems), ...Object.keys(tileItems)];
      const des: string[] = [
        ...Object.values(globalItems).map((e) => e.description),
        ...Object.values(tileItems).map((e) => e.description),
      ];
      const items: string[] = [
        ...Object.values(globalItems).map((e) => e.name),
        ...Object.values(tileItems).map((e) => e.name),
      ];
      const prices: number[] = [
        ...Object.values(globalItems).map((item) => item.buyPrice),
        ...Object.values(tileItems).map((e) => e.buyPrice),
      ];
      showMenuDialog(
        "购买道具",
        items,
        des.map((e, i) => `价格:${prices[i]},效果:${e}`),
      ).then((e) => {
        if (e == -1) return;
        if (playerData.money < prices[e]) {
          showTextDialog(["钱不够!"]);
          return;
        }
        playerData.money -= prices[e];
        //判断这个物品有没有，有就直接数目加一不push
        const existing = playerData.inventory.find(
          (item) => item.id === keys[e],
        );
        if (existing) {
          existing.quantity++;
        } else {
          playerData.inventory.push({
            id: keys[e],
            nameCh: items[e],
            quantity: 1,
          });
        }
        showTextDialog([`成功购买${items[e]}`]);
      });
    } else if (e === 1) {
      //sell
      const itemName = playerData.inventory.map((e) => e.nameCh);
      const itemID = playerData.inventory.map((e) => e.id);
      const prices = itemID.map((e) => {
        if (Object.keys(globalItems).includes(e))
          return globalItems[e].sellPrice;
        return tileItems[e].sellPrice;
      });
      const des = itemID.map((e) => {
        if (Object.keys(globalItems).includes(e))
          return globalItems[e].description;
        return tileItems[e].description;
      });
      showMenuDialog(
        "卖出道具",
        itemName,
        des.map((e, i) => `售出价格:${prices[i]},效果:${e}`),
      ).then((e) => {
        if (e == -1) return;
        playerData.inventory[e].quantity--;
        playerData.money += prices[e];
        if (playerData.inventory[e].quantity == 0) {
          playerData.inventory.splice(e, 1);
        }
        showTextDialog([`成功卖出${itemName[e]}`]);
      });
    } else {
      //背包
      let globalUse = true;
      let tileUse = true;
      const itemName = playerData.inventory.map((e) => e.nameCh);
      const id = playerData.inventory.map((e) => e.id);
      const des = id.map((e) => {
        if (Object.keys(globalItems).includes(e))
          return globalItems[e].description;
        return tileItems[e].description;
      });
      showMenuDialog("背包", itemName, des).then(async (e) => {
        if (e === -1) return;
        await asyncDialog("confirm", `确定要使用${itemName[e]}吗？`).then(
          async (choice) => {
            if (!choice) {
              globalUse = choice;
              return;
            }
            const globalItemKeys = Object.keys(globalItems);
            //执行效果，区分哪类道具
            if (globalItemKeys.includes(playerData.inventory[e].id)) {
              //玩家类道具
              //找是具体哪个道具
              const item = globalItems[playerData.inventory[e].id];
              applyGlobalItemEffect(item);
              showTextDialog([`已使用${itemName[e]}!`]);
            } else {
              //地块类道具
              const menuBtn = document.getElementById(
                "menu",
              ) as HTMLButtonElement;
              menuBtn.textContent = "取消";
              showTaskHint("点击要使用的地块");
              const item = tileItems[playerData.inventory[e].id];
              await applyTileItemEffect(item).then((choice) => {
                if (choice) showTextDialog([`已使用${itemName[e]}!`]);
                tileUse = choice;
              });
              hideTaskHint();
              menuBtn.textContent = "菜单";
            }
          },
        );
        //扣除
        if (!tileUse || !globalUse) return;
        playerData.inventory[e].quantity--;
        if (playerData.inventory[e].quantity == 0)
          playerData.inventory.splice(e, 1);
      });
    }
  });
}

export function menuShop() {
  showMenuDialog("选择操作", [
    "经营情况",
    "在售商品",
    "研究商品",
    "调整定价",
    "管理商品",
  ]).then((e) => {
    if (e == -1) return;
    if (e == 0) {
      const onSell = playerData.unlockGoods.filter((e) => e.onSale);
      const reqRes = onSell
        .map((e) => multiResource(e.costRes, e.sold))
        .reduce(
          (total, res) => addResources(total, res),
          {} as Partial<Resource>,
        );
      showTextDialog([
        `${playerData.name}的商店第${playerData.day}日数据
        1. 总营收:${Math.floor(playerData.lasttotalIncome || 0)}
        2. 基础营收:${baseIncomeGlobal}
        3. 商品营收:${onSell.map((e) => e.price * e.sold).reduce((total, i) => total + i, 0)}
        4. 基础成本:${fixedCost}
        5. 商品金钱成本:${onSell.map((e) => e.cost * e.sold).reduce((total, i) => total + i, 0)}
        6. 商品资源成本:${formatResRequirement(reqRes).slice(4)}
        7. 利润:${Math.floor(playerData.lastnetIncome || 0)}`,
      ]);
      return;
    } else if (e == 1) {
      const onSell = playerData.unlockGoods.filter((e) => e.onSale);
      showMenuDialog(
        "onsell",
        onSell.map((e) => e.name),
        onSell.map(
          (e) =>
            `定价:${e.price}，单件成本:${e.cost}，昨日售出:${e.sold}，
              单件需要资源:${formatResRequirement(e.costRes).slice(4)}，
              昨日消耗:${formatResRequirement(multiResource(e.costRes, e.sold)).slice(4)}，
              昨日利润:${e.sold * (e.price - e.cost)}`,
        ),
      );
    } else if (e == 2) {
      //过滤出没有的
      const onSell = playerData.unlockGoods.map((e) => e.name);
      const locked = ShopGoods.filter((e) => !onSell.includes(e.name));
      const names = locked.map((e) => e.name);
      const requirement: string[] = locked.map((e) =>
        formatResRequirement(e.unlockRes),
      );
      showMenuDialog("研究商品", names, requirement).then((e) => {
        if (e == -1) return;
        showConfirmDialog(`要研究${names[e]}吗?`, () => {
          if (!compResource(locked[e].unlockRes, playerData.resource)) {
            showTextDialog(["资源不足!"]);
            return;
          } else {
            playerData.resource = subResources(
              playerData.resource,
              locked[e].unlockRes,
            );
            showTextDialog([`已解锁商品${names[e]}!`]);
            playerData.unlockGoods.push({
              ...locked[e],
              sold: 0,
              onSale: false,
            });
          }
        });
      });
    } else if (e == 3) {
      const onSell = playerData.unlockGoods;
      showMenuDialog(
        "修改商品定价",
        onSell.map((e) => e.name),
        onSell.map((e) => e.price.toString()),
      ).then((e) => {
        if (e == -1) return;
        showInputDialog<number>(
          "输入新定价:",
          (value) => {
            if (
              value === null ||
              value === undefined ||
              isNaN(value) ||
              value.toString().trim() === ""
            ) {
              return "请输入有效的数字!";
            }
            return value < 0 ? "价格不能为负数!" : null;
          },
          () => {},
          (v) => {
            onSell[e].price = v;
            showTextDialog(["修改成功!"]);
            return;
          },
        );
        return;
      });
    } else if (e == 4) {
      const goods = playerData.unlockGoods;
      const names = goods.map((e) => e.name);
      const status = goods.map((e) => (e.onSale ? "在售" : "停售"));
      showMenuDialog("选择是否售卖商品", names, status).then((e) => {
        if (e == -1) return;
        showConfirmDialog(
          `要将${names[e]}改为${goods[e].onSale ? "停售" : "在售"}吗？`,
          () => {
            goods[e].onSale = !goods[e].onSale;
            showTaskHint("已修改!");
            setTimeout(() => hideTaskHint(), 3000);
          },
        );
      });
    }
  });
}

export function menuHelp() {
  showMenuDialog("帮助", help).then((e) => {
    if (e == -1) return;
    if (e == 0) showTextDialog(helpText1);
    if (e == 1) showTextDialog(helpText2);
    if (e == 2) showTextDialog(helpText3);
    if (e == 3) showTextDialog(helpText4);
  });
}
