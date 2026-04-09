import { asyncDialog, showTaskHint, hideTaskHint} from "./dialog";
import { updatePlayerData } from "./utils";
import { saveGame, loadGame } from "./saveload";
import { mainLoop } from "./tile";
import {
  menuDemonishTile,
  menuGoldshop,
  menuHelp,
  menuItem,
  menuPlaceTile,
  menuShop,
} from "./menu";
import { GameScene } from "./scene.ts";
import { generateMap } from "./map.ts";
import { initText, introduction } from "./gtext.ts";
import {presetTile, TileType} from "./types.ts";
import {playerData} from "./data.ts";
import {preloadAllAssets} from "./assets.ts";

export const scene = new GameScene("mainCanvas");
export let state: Appstats = {
  currentMode: 'normal', 
  cancelAction: () => scene.cancelMode() 
};

async function newGame(): Promise<void> {
  scene.refresh();
  await asyncDialog("text", initText);
  await asyncDialog<string>(
  "input",
  "请输入你的名字",
  (value) => (!value.trim() ? "名字不能为空" : null),
  "text",
  true,
  true,
  "确定叫这个名字吗？",
  "确定要放弃取名字吗？",
  );
  generateMap();
  await asyncDialog("text", [
    "首先你需要放置你的第一个商店，点击任意处来放置。",
  ]);
  showTaskHint("点击区块放置");
  const pos = await scene.makePlace(presetTile[TileType.shop]);
  hideTaskHint();
  playerData.position = pos as Position;
  updatePlayerData();
  scene.showMsgMode = true;
  await asyncDialog("text", introduction);
}

function addListener(): void {
  document.getElementById("save")?.addEventListener("click", () => saveGame());
  document.getElementById("place")?.addEventListener("click", () => menuPlaceTile());
  document.getElementById("demolish")?.addEventListener("click", () => menuDemonishTile());
  document.getElementById("goldshop")?.addEventListener("click", () => menuGoldshop());
  document.getElementById("items")?.addEventListener("click", () => menuItem());
  document.getElementById("myshop")?.addEventListener("click", () => menuShop());
  document.getElementById("help")?.addEventListener("click", () => menuHelp());
  window.addEventListener("load", function () {
    const menu = document.getElementById("menu") as HTMLButtonElement;
    const sidebar = document.getElementById("sidebarMenu");
    const infoPanel = document.getElementById("infoPanel");
    const save = document.getElementById('save') as HTMLButtonElement;
    if (!menu || !sidebar || !infoPanel || !save) return;
    save.disabled = true;
    menu.disabled = true;
    const cloneBtn = menu.cloneNode(true) as HTMLButtonElement;
    menu.parentNode!.replaceChild(cloneBtn, menu);
    cloneBtn.onclick = function (e) {
      e.stopPropagation();
      if (state.currentMode !== 'normal') {
        state.cancelAction();
      } else {
        sidebar.classList.toggle("visible");
        infoPanel.classList.toggle("visible");
      }
    };

    const sidebarButtons = sidebar.querySelectorAll("button");
    sidebarButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        sidebar.classList.remove("visible");
        infoPanel.classList.remove("visible");
      });
    });
  });
}


(async () => {
  try {
    await preloadAllAssets();
  } catch (err) {
    await asyncDialog("text", [
      `资源加载失败，可能会导致无法显示图片。${(err as Error).message}`,
    ]);
  }
  addListener();
  const shouldLoad = await asyncDialog("confirm", "加载存档吗?");
  if (shouldLoad) {
    const loadFile = document.createElement("input");
    loadFile.type = "file";
    loadFile.accept = ".sav";
    loadFile.style.display = "none";
    document.body.appendChild(loadFile);
    await new Promise<void>((resolve, reject) => {
      loadFile.addEventListener("change", async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            await loadGame(file);
            resolve();
          } catch (err) {
            reject(err);
          }
        } else resolve();
      });
      const timeout = setTimeout(() => {
        loadFile.remove();
        resolve();
      }, 30000);
      loadFile.addEventListener("cancel", () => clearTimeout(timeout));
      loadFile.click();
    });
    document.body.removeChild(loadFile);
  }
  if (!shouldLoad || (shouldLoad && !playerData.mapdata.length))
    await newGame();
  const save = document.querySelector("#save") as HTMLButtonElement;
  const menu = document.querySelector("#menu") as HTMLButtonElement;
  save.disabled = false;
  menu.disabled = false;
  mainLoop();
})();
