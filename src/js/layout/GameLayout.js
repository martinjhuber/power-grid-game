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
  const borderFactor = 2 / 5;

  let tileSize = columnWidth / (gridWidth + borderFactor);

  if ((gridHeight + borderFactor) * tileSize > maxBoardHeight) {
    tileSize = maxBoardHeight / (gridHeight + borderFactor);
  }

  tileSize = Math.max(minSize, tileSize);
  tileSize = Math.round(tileSize);

  const borderWidth = Math.max(1, Math.round(tileSize / 5));
  const boardWidth = gridWidth * tileSize;
  const boardHeight = gridHeight * tileSize;
  const canvasWidth = boardWidth + 2 * borderWidth;
  const canvasHeight = boardHeight + 2 * borderWidth;

  return { tileSize, canvasWidth, canvasHeight };
}
