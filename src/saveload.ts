import { scene } from "./main";
import * as CryptoJS from "crypto-js";
import {playerData, type PlayerDatas} from "./data";
import { showTextDialog } from "./dialog";

//我也不知道这个意义是什么
const SECRET_KEY = "skey"; 
const SECRET_IV = "gamesavefile"; 

function encryptData(data: string): string | boolean {
  try {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(SECRET_IV);
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (error) {
    return false;
  }
}

function handleError(error: any): void {
  showTextDialog(["发生错误"]);
}

/**
 * @param replacer JSON.stringify 替换器
 * @param space 格式化缩进
 */
function makeSaveFile<T>(
  data: T,
  fileName: string = "Game.sav",
  replacer: (key: string, value: any) => any = (_, value) => {
    if (value instanceof Date) return value.toLocaleString();
    return value;
  },
  space: number = 2,
): boolean {
  try {
    let jsonStr = JSON.stringify(data, replacer, space);
    const encrypted = encryptData(jsonStr);
    if (typeof encrypted === "string") jsonStr = encrypted;
    else return false;
    const blob = new Blob([jsonStr], {
      type: "application/json; charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.click();
    URL.revokeObjectURL(url); 
    return true;
  } catch (error) {
    return false;
  }
}

function decryptData<T>(encryptedStr: string): T | void {
  try {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(SECRET_IV);
    const decrypted = CryptoJS.AES.decrypt(encryptedStr, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const jsonStr = CryptoJS.enc.Utf8.stringify(decrypted);
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    handleError(error);
  }
}

export function loadGame(file: File): Promise<PlayerDatas | void> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const encryptedStr = event.target?.result as string;
      const data = decryptData<PlayerDatas>(encryptedStr);
      if (data) {
        Object.assign(playerData, data);
        //恢复地图数据
        if (data.mapdata)
          for (let r = 0; r < scene.grid.length; r++)
            for (let c = 0; c < scene.grid[r].length; c++)
              scene.updateTile(r, c, { data: data.mapdata[r][c] });
        scene.draw(); //确保刷新
        showTextDialog(["加载成功"]);
        resolve();
      } else {
        showTextDialog(["加载失败"]);
        resolve();
      }
    };
    reader.onerror = () => {
      showTextDialog(["文件读取失败"]);
      resolve();
    };
    reader.readAsText(file);
  });
}

export function saveGame() {
  playerData.mapdata = scene.grid.map((row) => row.map((cell) => cell.data));
  if (makeSaveFile(playerData)) {
    showTextDialog(["保存成功"]);
    return;
  }
  showTextDialog(["保存失败"]);
}
