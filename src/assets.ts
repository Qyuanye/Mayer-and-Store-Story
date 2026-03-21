import { TileType } from "./data";
import airport from "./assets/airport.svg?url"
import city from "./assets/city.svg?url"
import factory from "./assets/factory.svg?url"
import forest from "./assets/forest.svg?url"
import grass from "./assets/grass.svg?url"
import mountain from "./assets/mountain.svg?url"
import river from "./assets/river.svg?url"
import shop from "./assets/shop.svg?url"

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