import { CONFIG } from '../config.js';

export function measureColumnWidth(gameColumn) {
  return gameColumn.clientWidth;
}

export function measureMaxBoardHeight(hudElement) {
  const hudRect = hudElement.getBoundingClientRect();
  const gap = 12;
  const bottomPadding = 16;
  return Math.max(120, window.innerHeight - hudRect.bottom - gap - bottomPadding);
}

export function computeGameDimensions(gridWidth, gridHeight, columnWidth, maxBoardHeight, isMobile) {
  const minSize = isMobile ? CONFIG.grid.tileSizeMobileMin : CONFIG.grid.tileSizeMin;

  let tileSize = columnWidth / gridWidth;

  if (gridHeight * tileSize > maxBoardHeight) {
    tileSize = maxBoardHeight / gridHeight;
  }

  tileSize = Math.max(minSize, tileSize);

  const canvasWidth = gridWidth * tileSize;
  const canvasHeight = gridHeight * tileSize;

  return { tileSize, canvasWidth, canvasHeight };
}
