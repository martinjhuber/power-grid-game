import { CONFIG } from '../config.js';
import { TileState, TileType } from '../level/Tile.js';

export class BoardRenderer {
  #gridLayer = null;
  #lastLayoutKey = null;
  #borderLayer = null;
  #lastBorderKey = null;
  #wrapBorderLayer = null;
  #lastWrapBorderKey = null;

  computeLayout(gridWidth, gridHeight, tileSize) {
    const tileSizePx = Math.round(tileSize);
    const borderWidth = Math.max(1, Math.round(tileSizePx / 5));
    const boardWidth = gridWidth * tileSizePx;
    const boardHeight = gridHeight * tileSizePx;
    return {
      borderWidth,
      offsetX: borderWidth,
      offsetY: borderWidth,
      tileSize: tileSizePx,
      boardWidth,
      boardHeight,
      canvasWidth: boardWidth + 2 * borderWidth,
      canvasHeight: boardHeight + 2 * borderWidth,
    };
  }

  resetGridCache() {
    this.#gridLayer = null;
    this.#lastLayoutKey = null;
    this.#borderLayer = null;
    this.#lastBorderKey = null;
    this.#wrapBorderLayer = null;
    this.#lastWrapBorderKey = null;
  }

  #parseHexColor(hex) {
    let value = hex.replace('#', '');
    if (value.length === 3) {
      value = value
        .split('')
        .map((char) => char + char)
        .join('');
    }
    return {
      r: Number.parseInt(value.slice(0, 2), 16),
      g: Number.parseInt(value.slice(2, 4), 16),
      b: Number.parseInt(value.slice(4, 6), 16),
    };
  }

  #buildBorderLayer(layout, mode) {
    const { canvasWidth, canvasHeight, borderWidth, offsetX, offsetY, boardWidth, boardHeight } =
      layout;
    const width = canvasWidth;
    const height = canvasHeight;
    const innerLeft = offsetX;
    const innerTop = offsetY;
    const innerRight = offsetX + boardWidth;
    const innerBottom = offsetY + boardHeight;
    const inner =
      mode === 'bounded' ? this.#parseHexColor(CONFIG.colors.borderInner) : null;
    const outer = this.#parseHexColor(CONFIG.colors.pageBackground);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const layerCtx = canvas.getContext('2d');
    const image = layerCtx.createImageData(width, height);
    const { data } = image;

    for (let py = 0; py < height; py += 1) {
      for (let px = 0; px < width; px += 1) {
        const cx = px + 0.5;
        const cy = py + 0.5;
        const dx = Math.max(innerLeft - cx, cx - innerRight, 0);
        const dy = Math.max(innerTop - cy, cy - innerBottom, 0);
        const dist = Math.max(dx, dy);

        if (dist <= 0 || dist > borderWidth) {
          continue;
        }

        const t = dist / borderWidth;
        const i = (py * width + px) * 4;

        if (mode === 'bounded') {
          data[i] = Math.round(inner.r + (outer.r - inner.r) * t);
          data[i + 1] = Math.round(inner.g + (outer.g - inner.g) * t);
          data[i + 2] = Math.round(inner.b + (outer.b - inner.b) * t);
          data[i + 3] = 255;
        } else {
          data[i] = outer.r;
          data[i + 1] = outer.g;
          data[i + 2] = outer.b;
          data[i + 3] = Math.round(255 * t);
        }
      }
    }

    layerCtx.putImageData(image, 0, 0);
    return canvas;
  }

  #ensureBoundedBorderLayer(layout) {
    const key = `${layout.canvasWidth}-${layout.canvasHeight}-${layout.borderWidth}-${CONFIG.colors.borderInner}-${CONFIG.colors.pageBackground}`;
    if (this.#lastBorderKey === key && this.#borderLayer) {
      return;
    }
    this.#lastBorderKey = key;
    this.#borderLayer = this.#buildBorderLayer(layout, 'bounded');
  }

  #ensureWrapBorderOverlayLayer(layout) {
    const key = `wrap-${layout.canvasWidth}-${layout.canvasHeight}-${layout.borderWidth}-${CONFIG.colors.pageBackground}`;
    if (this.#lastWrapBorderKey === key && this.#wrapBorderLayer) {
      return;
    }
    this.#lastWrapBorderKey = key;
    this.#wrapBorderLayer = this.#buildBorderLayer(layout, 'wrap');
  }

  #ensureGridLayer(layout, gridWidth, gridHeight) {
    const key = `${gridWidth}-${gridHeight}-${layout.tileSize}-${CONFIG.colors.grid}`;
    if (this.#lastLayoutKey === key && this.#gridLayer) {
      return;
    }
    this.#lastLayoutKey = key;
    const { tileSize, boardWidth, boardHeight } = layout;
    const width = Math.round(boardWidth) + 1;
    const height = Math.round(boardHeight) + 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const layerCtx = canvas.getContext('2d');
    const { r, g, b } = this.#parseHexColor(CONFIG.colors.grid);
    const image = layerCtx.createImageData(width, height);
    const { data } = image;

    const setPixel = (px, py) => {
      if (px < 0 || py < 0 || px >= width || py >= height) {
        return;
      }
      const i = (py * width + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    };

    for (let i = 0; i <= gridWidth; i += 1) {
      const x = Math.round(i * tileSize);
      for (let py = 0; py < height; py += 1) {
        setPixel(x, py);
      }
    }

    for (let j = 0; j <= gridHeight; j += 1) {
      const y = Math.round(j * tileSize);
      for (let px = 0; px < width; px += 1) {
        setPixel(px, y);
      }
    }

    layerCtx.putImageData(image, 0, 0);
    this.#gridLayer = canvas;
  }

  #drawTileShape(ctx, tile, tileSize, linesOnly = false) {
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

    if (linesOnly) {
      return;
    }

    if (tile.isPowerPlant) {
      ctx.fillRect(-qrt, -qrt, half, half);
    } else if (tile.type === TileType.Consumer) {
      ctx.beginPath();
      ctx.arc(0, 0, qrt, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #drawTileAt(ctx, tile, tileSize, cx, cy, rotationDeg, lineWidth, { preview = false } = {}) {
    const halfPi = Math.PI / 180;
    const connected = tile.tileState === TileState.Connected;
    const color = connected ? CONFIG.colors.connected : CONFIG.colors.tile;

    ctx.save();
    if (preview) {
      ctx.globalAlpha = CONFIG.colors.wrapPreviewAlpha;
    }
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.translate(cx, cy);
    ctx.rotate(rotationDeg * halfPi);
    this.#drawTileShape(ctx, tile, tileSize, preview);
    ctx.restore();

    if (tile.isPowerPlant && !preview) {
      this.#drawPowerPlantBolt(ctx, cx, cy, tileSize);
    }

    if (tile.type === TileType.Consumer && !tile.isPowerPlant && !preview) {
      this.#drawConsumerHouse(ctx, cx, cy, tileSize);
    }
  }

  #tileIconScale(tileSize) {
    return (tileSize / 40) * 0.5;
  }

  #tileIconLineWidth(tileSize) {
    return Math.max(1.5, tileSize * 0.04);
  }

  #drawConsumerHouse(ctx, cx, cy, tileSize) {
    const scale = this.#tileIconScale(tileSize);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = CONFIG.colors.consumerHouse;
    ctx.strokeStyle = CONFIG.colors.consumerHouse;
    ctx.lineWidth = this.#tileIconLineWidth(tileSize);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -10 * scale);
    ctx.lineTo(7 * scale, -2 * scale);
    ctx.lineTo(7 * scale, 8 * scale);
    ctx.lineTo(-7 * scale, 8 * scale);
    ctx.lineTo(-7 * scale, -2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  #drawPowerPlantBolt(ctx, cx, cy, tileSize) {
    const scale = this.#tileIconScale(tileSize);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = CONFIG.colors.powerPlantBolt;
    ctx.strokeStyle = CONFIG.colors.powerPlantBolt;
    ctx.lineWidth = this.#tileIconLineWidth(tileSize);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(5 * scale, -12 * scale);
    ctx.lineTo(-6 * scale, 1 * scale);
    ctx.lineTo(0, 1 * scale);
    ctx.lineTo(-5 * scale, 12 * scale);
    ctx.lineTo(6 * scale, -1 * scale);
    ctx.lineTo(0, -1 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  #drawBoundedBorder(ctx, layout) {
    this.#ensureBoundedBorderLayer(layout);
    ctx.drawImage(this.#borderLayer, 0, 0);
  }

  #drawWrapBorderOverlay(ctx, layout) {
    this.#ensureWrapBorderOverlayLayer(layout);
    ctx.drawImage(this.#wrapBorderLayer, 0, 0);
  }

  #clipWrapStrip(ctx, side, layout, index, lineWidth) {
    const capPad = lineWidth / 2;
    const { borderWidth, offsetX, offsetY, tileSize, boardWidth, boardHeight } = layout;

    ctx.beginPath();
    if (side === 'left') {
      ctx.rect(-capPad, offsetY + index * tileSize, borderWidth + 2 * capPad, tileSize);
    } else if (side === 'right') {
      ctx.rect(
        offsetX + boardWidth - capPad,
        offsetY + index * tileSize,
        borderWidth + 2 * capPad,
        tileSize,
      );
    } else if (side === 'top') {
      ctx.rect(offsetX + index * tileSize, -capPad, tileSize, borderWidth + 2 * capPad);
    } else {
      ctx.rect(
        offsetX + index * tileSize,
        offsetY + boardHeight - capPad,
        tileSize,
        borderWidth + 2 * capPad,
      );
    }
    ctx.clip();
  }

  #drawWrapPreviews(ctx, level, layout, lineWidth) {
    const { borderWidth, offsetX, offsetY, tileSize, boardWidth, boardHeight } = layout;
    const gridWidth = level.gridWidth;
    const gridHeight = level.gridHeight;
    const tileGrid = level.tileGrid;

    for (let y = 0; y < gridHeight; y += 1) {
      const tile = tileGrid[gridWidth - 1][y];
      const cx = offsetX - tileSize / 2;
      const cy = offsetY + y * tileSize + tileSize / 2;
      ctx.save();
      this.#clipWrapStrip(ctx, 'left', layout, y, lineWidth);
      this.#drawTileAt(ctx, tile, tileSize, cx, cy, tile.rotation, lineWidth, { preview: true });
      ctx.restore();
    }

    for (let y = 0; y < gridHeight; y += 1) {
      const tile = tileGrid[0][y];
      const cx = offsetX + boardWidth + tileSize / 2;
      const cy = offsetY + y * tileSize + tileSize / 2;
      ctx.save();
      this.#clipWrapStrip(ctx, 'right', layout, y, lineWidth);
      this.#drawTileAt(ctx, tile, tileSize, cx, cy, tile.rotation, lineWidth, { preview: true });
      ctx.restore();
    }

    for (let x = 0; x < gridWidth; x += 1) {
      const tile = tileGrid[x][gridHeight - 1];
      const cx = offsetX + x * tileSize + tileSize / 2;
      const cy = offsetY - tileSize / 2;
      ctx.save();
      this.#clipWrapStrip(ctx, 'top', layout, x, lineWidth);
      this.#drawTileAt(ctx, tile, tileSize, cx, cy, tile.rotation, lineWidth, { preview: true });
      ctx.restore();
    }

    for (let x = 0; x < gridWidth; x += 1) {
      const tile = tileGrid[x][0];
      const cx = offsetX + x * tileSize + tileSize / 2;
      const cy = offsetY + boardHeight + tileSize / 2;
      ctx.save();
      this.#clipWrapStrip(ctx, 'bottom', layout, x, lineWidth);
      this.#drawTileAt(ctx, tile, tileSize, cx, cy, tile.rotation, lineWidth, { preview: true });
      ctx.restore();
    }
  }

  render(ctx, level, layout, cssWidth, cssHeight) {
    const tileGrid = level.tileGrid;
    const gridWidth = level.gridWidth;
    const gridHeight = level.gridHeight;
    const { offsetX, offsetY, tileSize } = layout;
    const lineWidth =
      (tileSize / CONFIG.grid.tileSizeMax) * CONFIG.colors.tileLineWidth;

    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    if (!level.wrap) {
      this.#drawBoundedBorder(ctx, layout);
    }

    ctx.fillStyle = CONFIG.colors.lockedBackground;
    for (let x = 0; x < gridWidth; x += 1) {
      for (let y = 0; y < gridHeight; y += 1) {
        const tile = tileGrid[x][y];
        if (!tile?.locked) {
          continue;
        }
        ctx.fillRect(
          offsetX + x * tileSize,
          offsetY + y * tileSize,
          tileSize,
          tileSize,
        );
      }
    }

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

        ctx.save();
        this.#drawTileAt(ctx, tile, tileSize, cx, cy, tile.rotation, lineWidth);
        ctx.restore();
      }
    }

    if (level.wrap) {
      this.#drawWrapPreviews(ctx, level, layout, lineWidth);
      this.#drawWrapBorderOverlay(ctx, layout);
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
