import { CONFIG } from '../config.js';
import { TileState, TileType } from '../level/Tile.js';

export class BoardRenderer {
  #gridLayer = null;
  #lastLayoutKey = null;

  computeLayout(gridWidth, gridHeight, tileSize, canvasWidth, canvasHeight) {
    const boardWidth = gridWidth * tileSize;
    const boardHeight = gridHeight * tileSize;
    return {
      offsetX: 0,
      offsetY: 0,
      tileSize,
      boardWidth,
      boardHeight,
      canvasWidth,
      canvasHeight,
    };
  }

  resetGridCache() {
    this.#gridLayer = null;
    this.#lastLayoutKey = null;
  }

  #ensureGridLayer(layout, gridWidth, gridHeight) {
    const key = `${gridWidth}-${gridHeight}-${layout.tileSize}`;
    if (this.#lastLayoutKey === key && this.#gridLayer) {
      return;
    }
    this.#lastLayoutKey = key;
    const { tileSize, boardWidth, boardHeight } = layout;
    const canvas = document.createElement('canvas');
    canvas.width = boardWidth;
    canvas.height = boardHeight;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= gridWidth; i += 1) {
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, boardHeight);
    }
    for (let j = 0; j <= gridHeight; j += 1) {
      ctx.moveTo(0, j * tileSize);
      ctx.lineTo(boardWidth, j * tileSize);
    }
    ctx.stroke();
    this.#gridLayer = canvas;
  }

  #drawTileShape(ctx, tile, tileSize) {
    const half = tileSize / 2;
    const qrt = tileSize / 4;

    ctx.beginPath();

    if (tile.type === TileType.Consumer) {
      ctx.moveTo(0, -half);
      ctx.lineTo(0, 0);
    } else if (tile.type === TileType.I) {
      ctx.moveTo(0, -half);
      ctx.lineTo(0, half);
    } else if (tile.type === TileType.L) {
      ctx.moveTo(0, -half);
      ctx.lineTo(0, 0);
      ctx.lineTo(half, 0);
    } else if (tile.type === TileType.Y) {
      ctx.moveTo(0, -half);
      ctx.lineTo(0, 0);
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
    } else if (tile.type === TileType.X) {
      ctx.moveTo(0, -half);
      ctx.lineTo(0, half);
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
    }

    ctx.stroke();

    if (tile.isPowerPlant) {
      ctx.fillRect(-qrt, -qrt, half, half);
    } else if (tile.type === TileType.Consumer) {
      ctx.beginPath();
      ctx.arc(0, 0, qrt, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  render(ctx, level, layout, cssWidth, cssHeight) {
    const tileGrid = level.tileGrid;
    const gridWidth = level.gridWidth;
    const gridHeight = level.gridHeight;
    const { offsetX, offsetY, tileSize } = layout;
    const halfPi = Math.PI / 180;
    const lineWidth =
      (tileSize / CONFIG.grid.tileSizeMax) * CONFIG.colors.tileLineWidth;

    this.#ensureGridLayer(layout, gridWidth, gridHeight);
    ctx.drawImage(this.#gridLayer, offsetX, offsetY);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let x = 0; x < gridWidth; x += 1) {
      for (let y = 0; y < gridHeight; y += 1) {
        const tile = tileGrid[x][y];
        if (!tile) {
          continue;
        }

        const cx = offsetX + x * tileSize + tileSize / 2;
        const cy = offsetY + y * tileSize + tileSize / 2;
        const connected = tile.tileState === TileState.Connected;
        const color = connected ? CONFIG.colors.connected : CONFIG.colors.tile;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.globalCompositeOperation = 'source-over';
        ctx.translate(cx, cy);
        ctx.rotate(tile.getNormalizedRotation() * halfPi);
        this.#drawTileShape(ctx, tile, tileSize);
        ctx.restore();

        if (tile.locked) {
          ctx.fillStyle = CONFIG.colors.locked;
          ctx.fillRect(
            offsetX + x * tileSize,
            offsetY + y * tileSize,
            tileSize,
            tileSize,
          );
        }
      }
    }

    if (level.pause) {
      ctx.fillStyle = CONFIG.colors.pauseOverlay;
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', cssWidth / 2, cssHeight / 2);
    }
  }
}
