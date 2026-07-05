export const CONFIG = {
  debug: false,
  grid: {
    allowedSizes: [5, 7, 9, 11, 13],
    minSize: 5,
    maxSize: 13,
    defaultWidth: 7,
    defaultHeight: 7,
    tileSizeMax: 40,
    tileSizeMin: 24,
    tileSizeMobileMin: 32,
    rotatePerSec: 360,
    longPressMs: 500,
  },
  colors: {
    grid: '#666',
    tile: '#FFF',
    connected: '#0CB',
    locked: 'rgba(64,64,64,0.5)',
    tileLineWidth: 4,
    background: '#000',
    pauseOverlay: 'rgba(0,0,0,0.45)',
  },
  canvas: {
    minWidth: 640,
    minHeight: 480,
    hudHeight: 48,
  },
  score: {
    scale: 90,
    sizeExponent: 2,
    secondsPerTile: 2.5,
  },
};
