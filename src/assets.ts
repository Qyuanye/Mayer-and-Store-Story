import { TileType } from "./data";
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
import ice from "./assets/weather/ice.svg?url"
import thunder from "./assets/weather/thunder.svg?url"

export const tileImages: Record<string, HTMLImageElement> = {};

const svgPaths: Record<TileType, string> = {
    [TileType.city]: city,
    [TileType.forest]: forest,
    [TileType.river]: river,
    [TileType.shop]: shop,
    [TileType.grass]: grass,
    [TileType.factory]: factory,
    [TileType.airport]: airport,
    [TileType.mountain]:mountain
};

export async function preloadAssets(): Promise<void> {
    const promises = Object.entries(svgPaths).map(([type, path]) => {
        return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                tileImages[type] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`无法加载资源: ${path}`);
                resolve();
            };
        });
    });
    await Promise.all(promises);
}