import {multiResource} from "./utils.ts";
import {showTextDialog} from "./dialog.ts";
import {type GlobalItem, type TileItem, TileType} from "./types.ts";
import {playerData} from "./data.ts";

export const globalItems: Record<string, GlobalItem> = {
  propaganda_poster: {
    id: "global_prop_001",
    name: "📰宣传海报",
    description: "在城市各处张贴，提升繁荣度与人气",
    effect: {
      popularity: 10,
      prosperity: 5,
    },
    buyPrice: 1000,
    sellPrice: 350,
  },

  city_festival: {
    id: "global_prop_002",
    name: "🎉城市庆典",
    description: "举办庆典活动，大幅提升城市人气与繁荣度",
    effect: {
      popularity: 12,
      prosperity: 10,
    },
    buyPrice: 1200,
    sellPrice: 550,
  },

  tax_incentive: {
    id: "global_econ_001",
    name: "💰税收优惠政策",
    description: "吸引更多居民和企业入驻，提升繁荣度与人口",
    effect: {
      population: 20,
      prosperity: 10,
    },
    buyPrice: 2100,
    sellPrice: 900,
  },
  population_boom: {
    id: "global_social_001",
    name: "👨‍👩‍👧人口增长计划",
    description: "‍鼓励生育，提升人口与人气",
    effect: {
      population: 20,
      popularity: 10,
    },
    buyPrice: 2100,
    sellPrice: 1000,
  },

  green_initiative: {
    id: "global_env_001",
    name: "🌿绿色倡议",
    description: "举行环保活动，提升人气与繁荣度",
    effect: {
      popularity: 5,
      prosperity: 8,
    },
    buyPrice: 950,
    sellPrice: 400,
  },
};

export const tileItems: Record<string, TileItem> = {
  lumber_permit: {
    id: "tile_forest_001",
    name: "🪓伐木许可证",
    description: "允许在森林中额外采伐，提升10天内的木头与纤维产出",
    targetTileTypes: [TileType.forest],
    effect: {
      resourceModifier: {
        wood: 2,
        fabric: 2,
      },
      modifierType: "multiplier",
    },
    duration: 10,
    buyPrice: 1500,
    sellPrice: 400,
  },
  forest_conservation: {
    id: "tile_forest_002",
    name: "🌲森林保护计划",
    description: "保护森林生态，大量提高资源产出",
    targetTileTypes: [TileType.forest],
    effect: {
      resourceModifier: {
        wood: 3,
        fabric: 2,
      },
      modifierType: "multiplier",
    },
    duration: 15,
    buyPrice: 3000,
    sellPrice: 1500,
  },

  fishing_net: {
    id: "tile_river_001",
    name: "🎣渔网",
    description: "在河流中捕鱼，增加食物产量与水资源获取",
    targetTileTypes: [TileType.river],
    effect: {
      resourceModifier: {
        food: 1.5,
        water:2.0,
      },
      modifierType: "multiplier",
    },
    duration: 10,
    buyPrice: 2000,
    sellPrice: 1100,
  },

  water_purifier: {
    id: "tile_river_002",
    name: "💧净水装置",
    description: "净化河水，提升水质和水量",
    
    targetTileTypes: [TileType.river],
    effect: {
      resourceModifier: {
        water: 2.5,
        food: 2,
      },
      modifierType: "multiplier",
    },
    duration: 12,
    buyPrice: 3000,
    sellPrice: 1400,
  },

  skyscraper_plan: {
    id: "tile_city_001",
    name: "🏢摩天大楼计划",
    description: "在城市区域建设高层建筑",
    targetTileTypes: [TileType.city],
    effect: {
      resourceModifier: {
        food: 2,
        metal: 2,
      },
      modifierType: "multiplier",
    },
    duration: 20,

    buyPrice: 2900,
    sellPrice: 1500,
  },

  urban_farming: {
    id: "tile_city_002",
    name: "🌱都市农业",
    description: "在城市中发展垂直农场",
    targetTileTypes: [TileType.city],
    effect: {
      resourceModifier: {
        food: 3,
        water: 2,
      },
      modifierType: "multiplier",
    },
    duration: 15,
    buyPrice: 2500,
    sellPrice: 1500,
  },

  automation_upgrade: {
    id: "tile_factory_001",
    name: "⚙️自动化升级",
    description: "提升工厂自动化水平",
    targetTileTypes: [TileType.factory],
    effect: {
      resourceModifier: {
        metal: 2.0,
        food: 1.5,
        fabric: 1.5,
      },
      modifierType: "multiplier",
    },
    duration: 10,
    buyPrice: 3500,
    sellPrice: 1600,
  },

  pollution_control: {
    id: "tile_factory_002",
    name: "🏭污染控制系统",
    description: "减少工厂污染，提升周边居民满意度",
    targetTileTypes: [TileType.factory],
    effect: {
      resourceModifier: {
        metal: 2,
        food: 1.5,
        fabric: 1.5,
      },
      modifierType: "multiplier",
    },
    duration: 10,
    buyPrice: 3300,
    sellPrice: 1500,
  },

  international_route: {
    id: "tile_airport_001",
    name: "✈️国际航线",
    description: "开通国际航线，增加多种资源收入",
    targetTileTypes: [TileType.airport],
    effect: {
      resourceModifier: {
        food: 2.5,
        metal: 3,
        fabric: 2.5,
      },
      modifierType: "multiplier",
    },
    duration: 10,
    buyPrice: 6000,
    sellPrice:2900,
  },

  mining_operation: {
    id: "tile_mountain_001",
    name: "⛏️采矿作业",
    description: "在山地开采矿产资源",
    targetTileTypes: [TileType.mountain],
    effect: {
      resourceModifier: {
        metal: 3,
        food: 1.5,
      },
      modifierType: "multiplier",
    },
    duration: 10,
    buyPrice: 2700,
    sellPrice: 1300,
  },

  mountain_resort: {
    id: "tile_mountain_002",
    name: "🏔️山地度假村",
    description: "开发山地旅游资源",
    targetTileTypes: [TileType.mountain],
    effect: {
      resourceModifier: {
        food: 3,
        stone:2
      },
      modifierType: "multiplier",
    },
    duration: 15,
    buyPrice: 2500,
    sellPrice: 1100,
  },

  irrigation_system: {
    id: "tile_grass_002",
    name: "💦灌溉系统",
    description: "安装高效灌溉设备",
    targetTileTypes: [TileType.river],
    effect: {
      resourceModifier: {
        water: 2,
      },
      modifierType: "multiplier",
    },
    duration: 10,
    buyPrice: 3200,
    sellPrice: 1500,
  },
};

export const goldItems: GoldItem[] = [
  {
    id: "warehouseExpand",
    name: "仓库扩大",
    description: "增大资源的储存上限20%",
    price: 5,
    effect: () => {
      playerData.resourceLimit = multiResource(playerData.resourceLimit, 1.2);
      showTextDialog(["仓库上限已提升20%！"]);
    },
  },
];