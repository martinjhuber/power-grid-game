import { createMatrix } from '@power-grid/shared/util.js';
import { linkTileNeighbors } from '@power-grid/shared/level/LevelGenerator.js';
import { TileFactory } from '@power-grid/shared/level/Tile.js';
import { PowerFlow } from '@power-grid/shared/level/PowerFlow.js';

function buildGridFromPuzzle(puzzle) {
  const { width, height, wrap, tiles, powerPlant: pp } = puzzle;
  const tileGrid = createMatrix(width, height, null);

  for (const tileData of tiles) {
    const tile = TileFactory.create(
      tileData.x,
      tileData.y,
      tileData.connectors,
      tileData.isPowerPlant,
    );
    tile.setRotationImmediate(tileData.initialRotation);
    tileGrid[tileData.x][tileData.y] = tile;
  }

  linkTileNeighbors(tileGrid, width, height, wrap);

  const powerPlant = tileGrid[pp.x][pp.y];
  return { tileGrid, powerPlant, width, height };
}

function replayEvents(tileGrid, events) {
  const locked = createMatrix(tileGrid.length, tileGrid[0].length, () => false);
  let rotationCount = 0;
  let lastCell = null;

  for (const event of events) {
    switch (event.kind) {
      case 'rotate': {
        if (locked[event.x][event.y]) {
          break;
        }
        const tile = tileGrid[event.x][event.y];
        const current = tile.getNormalizedRotation();
        tile.setRotationImmediate(current + event.dir * 90);
        const key = `${event.x},${event.y}`;
        if (lastCell !== key) {
          rotationCount += 1;
          lastCell = key;
        }
        break;
      }
      case 'lock':
        locked[event.x][event.y] = event.locked;
        break;
      default:
        break;
    }
  }

  return rotationCount;
}

export class ReplayVerifier {
  static verify(payload) {
    if (!payload?.puzzle || !payload?.events || !payload?.outcome) {
      return { valid: false, reason: 'Incomplete payload' };
    }

    const { tileGrid, powerPlant, width, height } = buildGridFromPuzzle(payload.puzzle);
    const replayRotations = replayEvents(tileGrid, payload.events);

    PowerFlow.resetGrid(tileGrid);
    const connectedTiles = PowerFlow.compute(powerPlant);
    const totalTiles = width * height;

    const { outcome } = payload;
    const finalMatch = outcome.finalRotations.every(({ x, y, rotation }) => {
      return tileGrid[x][y].getNormalizedRotation() === rotation;
    });

    if (!finalMatch) {
      return { valid: false, reason: 'Final rotation snapshot mismatch' };
    }
    if (outcome.rotationCount !== replayRotations) {
      return {
        valid: false,
        reason: `Rotation count mismatch: ${outcome.rotationCount} vs ${replayRotations}`,
      };
    }
    if (outcome.won && connectedTiles !== totalTiles) {
      return { valid: false, reason: 'Claimed win but not all tiles connected' };
    }
    if (outcome.connectedTiles !== connectedTiles) {
      return {
        valid: false,
        reason: `Connected tiles mismatch: ${outcome.connectedTiles} vs ${connectedTiles}`,
      };
    }

    return { valid: true, connectedTiles, rotationCount: replayRotations };
  }
}
