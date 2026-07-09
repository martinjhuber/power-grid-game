import { createMatrix, shuffleArray } from '../util.js';
import { TileFactory } from './Tile.js';

export const Direction = {
  N: { i: 0, xdiff: 0, ydiff: -1, opposite: null },
  E: { i: 1, xdiff: 1, ydiff: 0, opposite: null },
  S: { i: 2, xdiff: 0, ydiff: 1, opposite: null },
  W: { i: 3, xdiff: -1, ydiff: 0, opposite: null },
};

Direction.N.opposite = Direction.S;
Direction.E.opposite = Direction.W;
Direction.S.opposite = Direction.N;
Direction.W.opposite = Direction.E;

class UnionFind {
  #parent = null;

  getRoot() {
    return this.#parent === null ? this : this.#parent.getRoot();
  }

  isConnected(other) {
    return this.getRoot() === other.getRoot();
  }

  connect(other) {
    other.getRoot().#parent = this;
  }
}

export function linkTileNeighbors(tileGrid, gridWidth, gridHeight, wrap) {
  for (let x = 0; x < gridWidth; x += 1) {
    for (let y = 0; y < gridHeight; y += 1) {
      const neighborCells = getNeighborCells(x, y, gridWidth, gridHeight, wrap);
      for (let n = 0; n < neighborCells.length; n += 1) {
        const neighborCell = neighborCells[n];
        if (neighborCell !== null) {
          tileGrid[x][y].neighbors[n] = tileGrid[neighborCell.x][neighborCell.y];
        }
      }
    }
  }
}

function calcNeighborCell(x, y, direction, gridWidth, gridHeight) {
  let nx = x + direction.xdiff;
  let ny = y + direction.ydiff;

  if (nx < 0) {
    nx = gridWidth - 1;
  } else if (nx >= gridWidth) {
    nx = 0;
  }
  if (ny < 0) {
    ny = gridHeight - 1;
  } else if (ny >= gridHeight) {
    ny = 0;
  }

  return { x: nx, y: ny, direction };
}

function getNeighborCells(x, y, gridWidth, gridHeight, wrap) {
  const neighbors = [null, null, null, null];
  if (y !== 0 || wrap) {
    neighbors[0] = calcNeighborCell(x, y, Direction.N, gridWidth, gridHeight);
  }
  if (x !== gridWidth - 1 || wrap) {
    neighbors[1] = calcNeighborCell(x, y, Direction.E, gridWidth, gridHeight);
  }
  if (y !== gridHeight - 1 || wrap) {
    neighbors[2] = calcNeighborCell(x, y, Direction.S, gridWidth, gridHeight);
  }
  if (x !== 0 || wrap) {
    neighbors[3] = calcNeighborCell(x, y, Direction.W, gridWidth, gridHeight);
  }
  return neighbors;
}

export class LevelGenerator {
  #gridWidth;
  #gridHeight;
  #wrap;

  constructor(gridWidth, gridHeight, wrap) {
    this.#gridWidth = gridWidth;
    this.#gridHeight = gridHeight;
    this.#wrap = wrap;
  }

  generateTileGrid() {
    const plan = this.#generateGridPlanKruskal();
    const result = this.#generateTileGridFromPlan(plan);
    result.numTilesRotated = this.#rotateTilesRandomly(result.grid);
    return result;
  }

  #calcNeighborCell(x, y, direction) {
    return calcNeighborCell(x, y, direction, this.#gridWidth, this.#gridHeight);
  }

  #getNeighborCells(x, y) {
    return getNeighborCells(x, y, this.#gridWidth, this.#gridHeight, this.#wrap);
  }

  #generateGridPlanKruskal() {
    const plan = createMatrix(this.#gridWidth, this.#gridHeight, (i, j) => ({
      x: i,
      y: j,
      tree: new UnionFind(),
      connectors: [false, false, false, false],
    }));

    const edges = [];
    for (let i = 0; i < this.#gridWidth; i += 1) {
      for (let j = 0; j < this.#gridHeight; j += 1) {
        if (this.#wrap || j > 0) {
          edges.push({ x: i, y: j, direction: Direction.N });
        }
        if (this.#wrap || i > 0) {
          edges.push({ x: i, y: j, direction: Direction.W });
        }
      }
    }

    shuffleArray(edges);

    while (edges.length > 0) {
      const edge = edges.pop();
      const cell = plan[edge.x][edge.y];
      const neighbor = this.#calcNeighborCell(edge.x, edge.y, edge.direction);
      const neighborCell = plan[neighbor.x][neighbor.y];

      if (!cell.tree.isConnected(neighborCell.tree)) {
        cell.tree.connect(neighborCell.tree);
        cell.connectors[edge.direction.i] = true;
        neighborCell.connectors[neighbor.direction.opposite.i] = true;
      }
    }

    return plan;
  }

  #generateTileGridFromPlan(plan) {
    const midX = (this.#gridWidth - 1) / 2;
    const midY = (this.#gridHeight - 1) / 2;
    const tileGrid = createMatrix(this.#gridWidth, this.#gridHeight, null);

    for (let x = 0; x < plan.length; x += 1) {
      for (let y = 0; y < plan[x].length; y += 1) {
        tileGrid[x][y] = TileFactory.create(
          x,
          y,
          plan[x][y].connectors,
          x === midX && y === midY,
        );
      }
    }

    linkTileNeighbors(tileGrid, this.#gridWidth, this.#gridHeight, this.#wrap);

    return {
      grid: tileGrid,
      powerPlant: tileGrid[midX][midY],
      numTilesRotated: 0,
    };
  }

  #rotateTilesRandomly(tileGrid) {
    let numTilesRotated = 0;
    for (let x = 0; x < tileGrid.length; x += 1) {
      for (let y = 0; y < tileGrid[x].length; y += 1) {
        const tile = tileGrid[x][y];
        const rotation = Math.floor(Math.random() * 4) * 90;
        tile.setRotationImmediate(rotation);
        if (!tile.hasCorrectOrientation()) {
          numTilesRotated += 1;
        }
      }
    }
    return numTilesRotated;
  }
}

export function snapshotPuzzle(tileGrid, gridWidth, gridHeight, wrap, powerPlant) {
  const tiles = [];
  for (let x = 0; x < gridWidth; x += 1) {
    for (let y = 0; y < gridHeight; y += 1) {
      const tile = tileGrid[x][y];
      tiles.push({
        x,
        y,
        type: tile.type,
        connectors: tile.connectors,
        initialRotation: tile.rotation,
        isPowerPlant: tile.isPowerPlant,
      });
    }
  }
  return {
    width: gridWidth,
    height: gridHeight,
    wrap,
    powerPlant: { x: powerPlant.x, y: powerPlant.y },
    tiles,
  };
}
