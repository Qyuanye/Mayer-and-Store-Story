import {
  asyncDialog,
  hideTaskHint,
  showButtonTextDialog,
  showErrorHint,
  showTaskHint,
  showTextDialog,
} from "./dialog";
import { state } from "./main";
import {
  addResources,
  checkTile,
  compResource,
  formatResourceString,
  formatResRequirement,
  getSingleTileNearbyBonus,
  multiByResource,
  multiResource,
  subResources,
} from "./utils";
import {tileImages} from "./assets.ts";
import {Color, type GridCell, presetTile, type TileData, TileName, TileType} from "./types.ts";
import {gameConfig, levelupRes, playerData, TileDataConfig, TileResConfig} from "./data.ts";

interface EnvParticle {
  type: 'leaf' | 'smoke' | 'ripple';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export class GameScene {
  private canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  public placeMode: boolean = false;
  public demolishMode: boolean = false;
  public showMsgMode: boolean = false;
  public tileItemSelect: boolean = false;
  private demolishActive: boolean = false;
  public currentPosition: Position = { row: 0, col: 0 };
  public grid: GridCell[][] = []; //保存格子数据
  private placeResolver: ((pos: Position | null) => void) | null = null;
  private demolishResolver: ((pos: Position | null) => void) | null = null;
  private selectResolver: ((pos: Position | null) => void) | null = null;
  private tileAnimations: Map<string, { type: 'place' | 'upgrade' | 'demolish'; startTime: number; duration: number }> = new Map();
  private _animFrameId: number = 0;
  private envParticles: EnvParticle[] = [];
  private _lastEnvSpawn: number = 0;
  private _envFrameId: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    window.addEventListener("resize", () => this.refresh());
    this.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
    this.refresh();
  }

  public startTileAnim(row: number, col: number, type: 'place' | 'upgrade' | 'demolish'): void {
    this.tileAnimations.set(`${row},${col}`, { type, startTime: performance.now(), duration: type === 'place' ? 400 : 300 });
    if (!this._animFrameId) this._startAnimLoop();
  }

  private _startAnimLoop(): void {
    if (this._animFrameId) return;
    const tick = () => {
      this.draw();
      const now = performance.now();
      let hasActive = false;
      for (const anim of this.tileAnimations.values()) {
        if (now - anim.startTime < anim.duration) { hasActive = true; break; }
      }
      for (const [key, anim] of this.tileAnimations) {
        if (now - anim.startTime >= anim.duration) this.tileAnimations.delete(key);
      }
      if (hasActive) {
        this._animFrameId = requestAnimationFrame(tick);
      } else {
        this._animFrameId = 0;
        this.draw();
      }
    };
    this._animFrameId = requestAnimationFrame(tick);
  }

  private _startEnvLoop(): void {
    if (this._envFrameId) return;
    const tick = (timestamp: number) => {
      this._spawnEnvParticles(timestamp);
      this._updateEnvParticles(timestamp);
      this.draw();
      if (this._anyEnvTile() || this.envParticles.length > 0) {
        this._envFrameId = requestAnimationFrame(tick);
      } else {
        this._envFrameId = 0;
      }
    };
    this._envFrameId = requestAnimationFrame(tick);
  }

  private _anyEnvTile(): boolean {
    for (let r = 0; r < gameConfig.GRID_SIZE; r++) {
      for (let c = 0; c < gameConfig.GRID_SIZE; c++) {
        const t = this.grid[r]?.[c]?.data?.type as string;
        if (t === 'forest' || t === 'factory' || t === 'river') return true;
      }
    }
    return false;
  }

  private _spawnEnvParticles(timestamp: number): void {
    if (timestamp - this._lastEnvSpawn < 80) return;
    this._lastEnvSpawn = timestamp;
    const maxParticles = 200;
    if (this.envParticles.length >= maxParticles) return;
    const cellW = this.canvas.width / gameConfig.GRID_SIZE;
    const cellH = this.canvas.height / gameConfig.GRID_SIZE;
    for (let r = 0; r < gameConfig.GRID_SIZE; r++) {
      for (let c = 0; c < gameConfig.GRID_SIZE; c++) {
        if (this.envParticles.length >= maxParticles) return;
        const cell = this.grid[r]?.[c];
        const type = cell?.data?.type as string;
        const cx = cell.x;
        const cy = cell.y;
        if (type === 'forest' && Math.random() < 0.25) {
          const maxLife = 3 + Math.random() * 2;
          this.envParticles.push({
            type: 'leaf', x: cx + Math.random() * cellW, y: cy - 2,
            vx: (Math.random() - 0.5) * 20, vy: 8 + Math.random() * 15,
            life: Math.min(2.5 + Math.random() * 2, maxLife), maxLife,
            size: 2 + Math.random() * 3,
          });
        } else if (type === 'factory' && Math.random() < 0.4) {
          const maxLife = 2 + Math.random() * 2;
          this.envParticles.push({
            type: 'smoke', x: cx + cellW * 0.2 + Math.random() * cellW * 0.6,
            y: cy + cellH * 0.5,
            vx: (Math.random() - 0.5) * 10, vy: -(10 + Math.random() * 20),
            life: Math.min(1.5 + Math.random() * 2, maxLife), maxLife,
            size: 4 + Math.random() * 6,
          });
        } else if (type === 'river' && Math.random() < 0.35) {
          const maxLife = 1 + Math.random() * 1;
          this.envParticles.push({
            type: 'ripple', x: cx + Math.random() * cellW, y: cy + Math.random() * cellH,
            vx: 0, vy: 0,
            life: Math.min(0.8 + Math.random() * 1.2, maxLife), maxLife,
            size: 3 + Math.random() * 4,
          });
        }
      }
    }
  }

  private _updateEnvParticles(timestamp: number): void {
    const dt = 1 / 60;
    this.envParticles = this.envParticles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return true;
    });
  }

  public refresh(): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.initGrid();
    this.draw();
    if (this._anyEnvTile() && !this._envFrameId) this._startEnvLoop();
  }

  private initGrid(): void {
    const cellW = this.canvas.width / gameConfig.GRID_SIZE;
    const cellH = this.canvas.height / gameConfig.GRID_SIZE;
    const newGrid: GridCell[][] = [];
    for (let r = 0; r < gameConfig.GRID_SIZE; r++) {
      const rowData: GridCell[] = [];
      for (let c = 0; c < gameConfig.GRID_SIZE; c++) {
        const oldCell = this.grid[r]?.[c];
        rowData.push({
          x: c * cellW,
          y: r * cellH,
          width: cellW,
          height: cellH,
          row: r,
          col: c,
          data: {
            type: oldCell?.data.type || "",
            bgColor: oldCell?.data.bgColor || Color.white,
            textColor: oldCell?.data.textColor || Color.black,
            level: oldCell?.data.level || 1,
          },
        });
      }
      newGrid.push(rowData);
    }
    this.grid = newGrid;
  }

  public draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let r = 0; r < gameConfig.GRID_SIZE; r++) {
      for (let c = 0; c < gameConfig.GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        ctx.fillStyle = cell.data.bgColor;
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
        ctx.strokeStyle = "#e1e8ed";
        ctx.lineWidth = 1;
        ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        if (cell.data.type) {
          const img = tileImages[cell.data.type];
          if (img) {
            ctx.drawImage(img, cell.x, cell.y, cell.width, cell.height);
          }
          if (gameConfig.SHOW_TILE_TEXT || !img) {
            ctx.save(); 
            let fontSize = cell.width * 0.27;
            if (TileName[cell.data.type].length > 2)
              fontSize = (cell.width / TileName[cell.data.type].length) * 0.8;
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = cell.data.textColor || "#333333";
            ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                TileName[cell.data.type],
                cell.x + cell.width / 2,
                cell.y + cell.height / 2,
            );
            ctx.restore(); //恢复画布状态清空阴影效果
          }
          if (cell.data.level && cell.data.level > 1) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            const badgeSize = cell.width * 0.3;
            ctx.fillRect(cell.x, cell.y, badgeSize, badgeSize);
            ctx.fillStyle = "white";
            ctx.font = `bold ${badgeSize * 0.6}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                `v${cell.data.level}`,
                cell.x + badgeSize / 2,
                cell.y + badgeSize / 2
            );
          }
        }}
    }
    // 绘制地块动画叠加层
    for (const [key, anim] of this.tileAnimations) {
      const [r, c] = key.split(',').map(Number);
      const cell = this.grid[r]?.[c];
      if (!cell) continue;
      const now = performance.now();
      const elapsed = now - anim.startTime;
      if (elapsed >= anim.duration) continue;
      const t = 1 - elapsed / anim.duration;
      ctx.lineWidth = 3 * t;
      if (anim.type === 'place') {
        ctx.fillStyle = `rgba(76, 175, 80, ${t * 0.35})`;
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
        ctx.strokeStyle = `rgba(76, 175, 80, ${t})`;
        ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
      } else if (anim.type === 'upgrade') {
        ctx.fillStyle = `rgba(255, 215, 0, ${t * 0.4})`;
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
        ctx.strokeStyle = `rgba(255, 215, 0, ${t})`;
        ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
      } else if (anim.type === 'demolish') {
        ctx.fillStyle = `rgba(244, 67, 54, ${t * 0.4})`;
        ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
      }
    }
    // 绘制环境粒子
    for (const p of this.envParticles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      if (p.type === 'leaf') {
        const a = alpha * 0.7;
        ctx.fillStyle = `rgba(60, 140, 40, ${a})`;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        const a = alpha * 0.7;
        const r = p.size * (1.2 + alpha * 0.6);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `rgba(80, 80, 90, ${a * 0.9})`);
        grad.addColorStop(0.4, `rgba(100, 100, 115, ${a * 0.6})`);
        grad.addColorStop(1, `rgba(130, 130, 145, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ripple') {
        const a = alpha * 0.7;
        const progress = 1 - alpha;
        const radius = p.size * (0.3 + progress);
        ctx.strokeStyle = `rgba(160, 210, 250, ${a})`;
        ctx.lineWidth = 1.2 * (1 - progress * 0.7);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const col = Math.floor(clickX / (this.canvas.width / gameConfig.GRID_SIZE));
    const row = Math.floor(clickY / (this.canvas.height / gameConfig.GRID_SIZE));
    //道具选择模式
    if (this.tileItemSelect && this.selectResolver) {
      this.selectResolver({ row, col });
      return;
    }
    if (row >= 0 && row < gameConfig.GRID_SIZE && col >= 0 && col < gameConfig.GRID_SIZE) {
      this.currentPosition = { row, col };
      //拆除模式
      if (this.demolishMode && this.demolishResolver) {
        this.demolishResolver({ row, col });
        return;
      }
      //放置模式
      if (this.placeMode && this.placeResolver) {
        this.placeResolver({ row, col });
        return;
      }
      //信息查看模式
      if (this.showMsgMode) {
        this.makeMessage(row, col);
      }
    }
  }

  public async makeSelect(
    targetTileTypes: TileType[] = [],
  ): Promise<Position | null> {
    state.currentMode='itemSelect'
    this.tileItemSelect = true;
    this.placeMode = false;
    this.demolishMode = false;
    this.showMsgMode = false;
    let hint = "请点击你要使用道具的地块";
    if (targetTileTypes.length > 0) {
      hint += `\n(仅限: ${targetTileTypes.map(e=>TileName[e]).join(", ")})`;
    }
    await asyncDialog("text", [hint]);
    let finalPosition: Position | null = null;
    while (this.tileItemSelect) {
      const pos = await new Promise<Position | null>((resolve) => {
        this.selectResolver = resolve;
      });
      if (!pos || !this.tileItemSelect) break;
      const cellData = checkTile(pos);
      if (!cellData) continue;
      if (
        targetTileTypes.length > 0 &&
        !targetTileTypes.includes(cellData.type)
      ) {
        await asyncDialog("text", [
          `该道具无法用于[${TileName[cellData.type]}]！`,
          `请选择: ${targetTileTypes.map(e=>TileName[e]).join(", ")}`,
        ]);
        continue;
      }
      const isConfirmed = await asyncDialog(
        "confirm",
        `确定要将道具应用于 (${pos.row}, ${pos.col}) 的[${TileName[cellData.type]}]吗？`,
      );
      if (!this.tileItemSelect) break;
      if (isConfirmed) {
        finalPosition = pos;
        break;
      }
    }
    this.selectResolver = null;
    this.tileItemSelect = false;
    this.showMsgMode = true;
    return finalPosition;
  }

  public async makeDemolish(): Promise<void> {
    state.currentMode='demolish'
    if (this.demolishActive) return;
    this.demolishActive = true;
    this.demolishMode = true;
    this.placeMode = false;
    while (this.demolishMode) {
      const pos = await new Promise<Position | null>((resolve) => {
          this.demolishResolver = resolve;
      })
      if (!pos || !this.demolishMode) break;
      const tileData = checkTile(pos);
      if (!tileData) continue;
      const unRemovable = [TileType.grass, TileType.river, TileType.mountain,TileType.shop];
      const chnName=TileName[tileData.type];
      if (unRemovable.includes(tileData.type as TileType)) {
        await asyncDialog("text", [`[${chnName}]是基础地形，无法拆除！`]);
        continue;
      }
      const isConfirmed = await asyncDialog(
        "confirm",
        `确定要拆除位于 (${pos.row}, ${pos.col}) 的 ${chnName} 吗？`,
      );
      if (isConfirmed) {
        this.grid[pos.row][pos.col].data = { ...presetTile[TileType.grass] };
        this.startTileAnim(pos.row, pos.col, 'demolish');
        this.draw();
        const tileKey = Object.keys(TileType).find(
          (key) => TileType[key as keyof typeof TileType] === tileData.type,
        );
        if (!tileKey) {
          showTextDialog(["未知类型"]); //err
          continue;
        }
        //扣除玩家属性
        playerData.population-=(TileDataConfig[tileKey].population??0)*tileData.level;
        playerData.popularity-=(TileDataConfig[tileKey].popularity??0)*tileData.level;
        playerData.prosperity-=(TileDataConfig[tileKey].prosperity??0)*tileData.level;
        //返还资源
        const refundBonus = TileResConfig[tileKey]?.refundBonus;
        if (refundBonus) {
          playerData.resource = addResources(playerData.resource, refundBonus, true);
          await asyncDialog("text", [
            `拆除成功！已返还资源\n${formatResourceString(refundBonus)}`,
          ]);
        } else await asyncDialog("text", ["拆除成功！"]);
        this.demolishMode = false;
        break;
      }
    }
    this.demolishResolver = null;
    this.demolishMode = false;
    this.demolishActive = false;
  }

public cancelMode = (): void => {
    this.placeMode = false;
    this.demolishMode = false;
    this.tileItemSelect = false;
    this.demolishActive = false; 
    this.showMsgMode = true;
    if (this.placeResolver) {
      this.placeResolver(null);
      this.placeResolver = null;
    }
    if (this.demolishResolver) {
      this.demolishResolver(null);
      this.demolishResolver = null;
    }
    if (this.selectResolver) {
      this.selectResolver(null);
      this.selectResolver = null;
    }
    if (state)state.currentMode = "normal";
  };


  public async makePlace(data: TileData): Promise<{ row: number; col: number } | null> {
    if (state) state.currentMode = 'place';
    this.placeMode = true;
    this.showMsgMode = false;
    this.demolishMode = false;
    let finalPos: Position | null = null;
    while (this.placeMode) {
      const pos = await new Promise<Position | null>((resolve) => {
        this.placeResolver = resolve;
      });
      if (!pos || !this.placeMode) break;
      const targetCell = checkTile(pos);
      if (!targetCell) continue;
      if (targetCell.type !== TileType.grass) {
        showTextDialog(['只能放在草地上!']);
        continue;
      }
      //资源是否足够
      let cost: includeRes = {};
      if (data.type !== TileType.shop) {
        const tileKey = Object.keys(TileType).find(k => TileType[k as keyof typeof TileType] === data.type);
        cost = TileResConfig[tileKey || ""].placeCost || {};
        if (!compResource(cost, playerData.resource)) {
          showErrorHint("资源不够");
          continue;
        }
      }
      //二次确认
      const isConfirmed = await asyncDialog("confirm", "确定要放置在这里吗?");
      if (isConfirmed && this.placeMode) {
        this.updateTile(pos.row, pos.col, { data: { ...data } });
        this.startTileAnim(pos.row, pos.col, 'place');
        if (data.type !== TileType.shop) {
          playerData.resource = subResources(playerData.resource, cost);
        }
        finalPos = pos;
        break;
      }
    }
    this.placeMode = false;
    this.placeResolver = null;
    this.showMsgMode = true;
    return finalPos;
  }

  private makeMessage(row: number, col: number): void {
    const data: TileData | undefined = checkTile({ row, col });
    if (!data) return;
    //点店铺显示利润情况
    if (data.type == TileType.shop) {
      showTextDialog([
        `商店\n昨日营收:${Math.floor(playerData.lasttotalIncome)}\n昨日利润:${Math.floor(playerData.lastnetIncome)}`,
      ]);
      return;
    }
    const tileKey = data.type;
    let bonusText = "产出: 无";
    if (tileKey && TileResConfig[tileKey]) {
      const config = TileResConfig[tileKey];
      //基础产出等级*base
      let currentTileBase: Partial<Resource> = {};
      if (config.baseBonus) {
        for (const [resKey, value] of Object.entries(config.baseBonus)) {
          currentTileBase[resKey as keyof Resource] = value * data.level;
        }
      }
      let finalBonus: Partial<Resource> = { ...currentTileBase };
      let effectText = "";
      if (data.activeEffects && data.activeEffects.length > 0) {
        //拼效果字符串
        effectText = "\n[当前生效效果]:\n" + data.activeEffects.map(eff =>
          `- ${eff.sourceName || '未知'}: 剩余 ${eff.duration} 天`).join("\n");
        //把加成算上去
        data.activeEffects.forEach(e=>{
          const modifier=e.effect.resourceModifier
          if(e.effect.modifierType=='flat'){
            finalBonus = addResources(finalBonus,modifier);
          }else{
            finalBonus=multiByResource(finalBonus,modifier);
            console.log(modifier)
          }
        })
      }
      //临近加成
      const nearbyBonus = getSingleTileNearbyBonus(row, col);
      finalBonus = addResources(finalBonus, nearbyBonus);
        bonusText = formatResourceString(finalBonus, "bonus")+effectText;
    //升级地块功能
    if (Object.keys(levelupRes).includes(data.type)) {
      const levelres = levelupRes[
        data.type as keyof typeof levelupRes
      ] as includeRes;
      const req=multiResource(levelres,data.level);
      const reqstring=formatResRequirement(req);
      showButtonTextDialog(
        [`${TileName[data.type]} 的等级为 Lv:${data.level}\n${bonusText}\n升级需要资源:\n${reqstring.slice(4)}`],
        "升级地块",
        () => {
          if (!compResource(req, playerData.resource)) {
            showErrorHint("资源不够!");
          } else {
            playerData.resource=subResources(playerData.resource, req);
            showTaskHint("升级成功!");
            data.level += 1;
            this.startTileAnim(row, col, 'upgrade');
            //修改数值
            playerData.population+=TileDataConfig[tileKey!].population??0;
            playerData.popularity+=TileDataConfig[tileKey!].popularity??0;
            playerData.prosperity+=TileDataConfig[tileKey!].prosperity??0;
            setTimeout(() => {
              hideTaskHint();
            }, 3000);
          }
        },
      );
    } else {
      showTextDialog([`${data.type} 的等级为 Lv:${data.level}\n${bonusText}`]);
    }
  }}

  public updateTile(row: number, col: number, data: Partial<GridCell>): void {
    if (this.grid[row] && this.grid[row][col]) {
      this.grid[row][col] = { ...this.grid[row][col], ...data };
      this.draw();
      if (this._anyEnvTile() && !this._envFrameId) this._startEnvLoop();
    }
  }
}
