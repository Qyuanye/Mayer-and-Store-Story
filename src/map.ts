import { createNoise2D } from "simplex-noise";
import { getRandomNumber, checkTile } from "./utils.ts";
import { scene } from "./main";
import {presetTile, TileType} from "./types.ts";
import {gameConfig} from "./data.ts";

function fbm(noise2D: (x: number, y: number) => number, x: number, y: number, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * noise2D(x * frequency, y * frequency);
    max += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum / max;
}

export function generateMap(): void {
  const elevationNoise2D = createNoise2D();
  const moistureNoise2D = createNoise2D();
  const size = gameConfig.GRID_SIZE;
  const offsetX = Math.random() * 10000;
  const offsetY = Math.random() * 10000;
  const moistOffsetX = Math.random() * 10000;
  const moistOffsetY = Math.random() * 10000;

  const scale = 0.12          ;//缩放，越小越连续
  const moistureScale = 0.08;//湿度缩放，越小森林越密
  const elevOctaves = 5;     //叠加层数，越小地形越平
  const elevLacunarity = 4;//频率增幅，越小每层区别越小
  const elevGain = 0.5; //高频细节占比，越小地形越平
  const moistOctaves = 3;//小：森林分布越密
  const moistLacunarity = 2;//小：越密
  const moistGain = 0.6;//小：块状明显

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const nx = (r + offsetX) * scale;
      const ny = (c + offsetY) * scale;
      const elevationRaw = fbm(elevationNoise2D, nx, ny, elevOctaves, elevLacunarity, elevGain);
      const elevation = (elevationRaw + 1) / 2;
      const mx = (r + moistOffsetX) * moistureScale;
      const my = (c + moistOffsetY) * moistureScale;
      const moistureRaw = fbm(moistureNoise2D, mx, my, moistOctaves, moistLacunarity, moistGain);
      const moisture = (moistureRaw + 1) / 2;

      let type: TileType = TileType.grass;
      if (elevation > 0.67) {
        type = TileType.mountain;
      } else if (elevation < 0.35) {
        type = TileType.river;
      } else {
        if (moisture > 0.6) type = TileType.forest;
        else type = TileType.grass;
      }

      scene.updateTile(r, c, { data: { ...presetTile[type] } });
    }
  }

  let citiesPlaced = 0;
  let attempts = 0;
  while (citiesPlaced < 5 && attempts < 300) {
    const r = getRandomNumber(0, size - 1);
    const c = getRandomNumber(0, size - 1);
    const cell = checkTile({ row: r, col: c });
    if (cell && cell.type === TileType.grass) {
      scene.updateTile(r, c, { data: { ...presetTile[TileType.city] } });
      citiesPlaced++;
    }
    attempts++;
  }
}