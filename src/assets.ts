import {TileType, Weather} from "./types.ts";
import airport from "./assets/tile/airport.svg?url"
import city from "./assets/tile/city.svg?url"
import factory from "./assets/tile/factory.svg?url"
import forest from "./assets/tile/forest.svg?url"
import grass from "./assets/tile/grass.svg?url"
import mountain from "./assets/tile/mountain.svg?url"
import river from "./assets/tile/river.svg?url"
import shop from "./assets/tile/shop.svg?url"

import sunny from "./assets/weather/sunny.svg?url"
import rainy from "./assets/weather/rainy.svg?url"
import foggy from "./assets/weather/foggy.svg?url"
import hailstorm from "./assets/weather/hailstorm.svg?url"
import thunderstorm from "./assets/weather/thunderstorm.svg?url"

import drop from "./assets/weather/drop.svg?url"
import fog from "./assets/weather/fog.svg?url"
import ice from "./assets/weather/ice.svg?url"
import thunder from "./assets/weather/thunder.svg?url"

export const tileImages: Record<string, HTMLImageElement> = {};
export const weatherIcons: Record<string, HTMLImageElement> = {};
export const weatherAnime:Record<string, HTMLImageElement> = {};

const tileImgPaths: Record<TileType, string> = {
    [TileType.city]: city,
    [TileType.forest]: forest,
    [TileType.river]: river,
    [TileType.shop]: shop,
    [TileType.grass]: grass,
    [TileType.factory]: factory,
    [TileType.airport]: airport,
    [TileType.mountain]:mountain
};

const weatherIconPaths:Record<Weather,string>={
    [Weather.sunny]:sunny,
    [Weather.rainy]:rainy,
    [Weather.foggy]:foggy,
    [Weather.hail]:hailstorm,
    [Weather.thunder]:thunderstorm
}

const weatherAnimePaths:Record<Exclude<Weather, Weather.sunny>,string>={
    [Weather.rainy]:drop,
    [Weather.foggy]:fog,
    [Weather.hail]:ice,
    [Weather.thunder]:thunder
}

async function preloadImageAssets<T extends string>(
    pathMap: Record<T, string>,
    targetMap: Record<T, HTMLImageElement>
): Promise<void> {
    const promises = Object.entries(pathMap).map(([key, path]) => {
        return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.src = path as string;
            img.onload = () => {
                targetMap[key as T] = img;
                resolve();
            };
            img.onerror = () => reject(new Error(`无法加载资源:${key}, ${path}`));
        });
    });
    await Promise.all(promises);
}

export async function preloadAllAssets(): Promise<void> {
    await Promise.all([
        preloadImageAssets(tileImgPaths, tileImages),
        preloadImageAssets(weatherAnimePaths, weatherAnime),
        preloadImageAssets(weatherIconPaths, weatherIcons),
    ]);
}