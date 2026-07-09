import { Events, Observers } from '../util.js';
import { LevelGenerator, snapshotPuzzle } from '@power-grid/shared/level/LevelGenerator.js';
import { PowerFlow } from '@power-grid/shared/level/PowerFlow.js';
import { calculateScore } from '@power-grid/shared/score/ScoreCalculator.js';
import { GameSession } from '../verification/GameSession.js';

export class LevelStatistics {
  #minimumRotationsRequired = 0;
  #rotations = 0;
  #timePassed = 0;
  #numConnectedTiles = 0;
  #numTiles = 0;
  #wrap = false;
  #gridWidth = 0;
  #gridHeight = 0;
  #lastRotation = { x: null, y: null };

  onNotify(event, params) {
    switch (event) {
      case Events.LevelStarted:
        this.#minimumRotationsRequired = params.numTilesRandomized;
        this.#numTiles = params.gridWidth * params.gridHeight;
        this.#gridWidth = params.gridWidth;
        this.#gridHeight = params.gridHeight;
        this.#wrap = params.wrap;
        break;
      case Events.LevelPause:
        break;
      case Events.Update:
        this.#timePassed += params.timePassed;
        this.#numConnectedTiles = params.connectedTiles;
        break;
      case Events.TileRotate:
        if (params.x !== this.#lastRotation.x || params.y !== this.#lastRotation.y) {
          this.#rotations += 1;
          this.#lastRotation = { x: params.x, y: params.y };
        }
        break;
      default:
        break;
    }
  }

  get timePassed() {
    return this.#timePassed;
  }

  get minimumRotationsRequired() {
    return this.#minimumRotationsRequired;
  }

  get rotations() {
    return this.#rotations;
  }

  get numConnectedTiles() {
    return this.#numConnectedTiles;
  }

  get numTiles() {
    return this.#numTiles;
  }

  get wrap() {
    return this.#wrap;
  }

  toSnapshot() {
    return {
      width: this.#gridWidth,
      height: this.#gridHeight,
      wrap: this.#wrap,
      timePassed: this.#timePassed,
      rotations: this.#rotations,
      minimumRotationsRequired: this.#minimumRotationsRequired,
      numTiles: this.#numTiles,
    };
  }
}

export class Level {
  #gridWidth;
  #gridHeight;
  #wrap;
  #tileGrid;
  #powerPlant;
  #pause = false;
  #won = false;
  #observers = new Observers();
  #statistics = new LevelStatistics();
  #session;
  #numTilesRandomized = 0;

  constructor(gridWidth, gridHeight, wrap) {
    this.#gridWidth = gridWidth;
    this.#gridHeight = gridHeight;
    this.#wrap = wrap;

    const generator = new LevelGenerator(gridWidth, gridHeight, wrap);
    const result = generator.generateTileGrid();
    this.#tileGrid = result.grid;
    this.#powerPlant = result.powerPlant;
    this.#numTilesRandomized = result.numTilesRotated;

    const puzzle = snapshotPuzzle(
      this.#tileGrid,
      gridWidth,
      gridHeight,
      wrap,
      this.#powerPlant,
    );
    this.#session = new GameSession(puzzle);
    this.#session.recordStart();

    this.#observers.register(this.#statistics);
  }

  get gridWidth() {
    return this.#gridWidth;
  }

  get gridHeight() {
    return this.#gridHeight;
  }

  get wrap() {
    return this.#wrap;
  }

  get tileGrid() {
    return this.#tileGrid;
  }

  get powerPlant() {
    return this.#powerPlant;
  }

  get pause() {
    return this.#pause;
  }

  get won() {
    return this.#won;
  }

  get statistics() {
    return this.#statistics;
  }

  get session() {
    return this.#session;
  }

  start() {
    this.#observers.notify(Events.LevelStarted, {
      gridWidth: this.#gridWidth,
      gridHeight: this.#gridHeight,
      numTilesRandomized: this.#numTilesRandomized,
      wrap: this.#wrap,
    });
  }

  registerObserver(observer) {
    this.#observers.register(observer);
  }

  rotateTileLeft(x, y) {
    const tile = this.#tileGrid[x][y];
    if (tile.locked) {
      return false;
    }
    tile.rotateLeft();
    this.#session.recordRotate(x, y, -1);
    this.#observers.notify(Events.TileRotate, { x, y, direction: -1 });
    return true;
  }

  rotateTileRight(x, y) {
    const tile = this.#tileGrid[x][y];
    if (tile.locked) {
      return false;
    }
    tile.rotateRight();
    this.#session.recordRotate(x, y, 1);
    this.#observers.notify(Events.TileRotate, { x, y, direction: 1 });
    return true;
  }

  toggleLock(x, y) {
    const tile = this.#tileGrid[x][y];
    tile.locked = !tile.locked;
    this.#session.recordLock(x, y, tile.locked);
    this.#observers.notify(Events.TileLock, { x, y, locked: tile.locked });
    return tile.locked;
  }

  togglePause() {
    this.#pause = !this.#pause;
    if (this.#pause) {
      this.#session.recordPause();
    } else {
      this.#session.recordResume();
    }
    this.#observers.notify(Events.LevelPause, { pause: this.#pause });
    return this.#pause;
  }

  isAnimating() {
    for (let x = 0; x < this.#gridWidth; x += 1) {
      for (let y = 0; y < this.#gridHeight; y += 1) {
        if (this.#tileGrid[x][y].isAnimating()) {
          return true;
        }
      }
    }
    return false;
  }

  update(timePassed) {
    if (this.#pause || this.#won) {
      return { connectedTiles: this.#statistics.numConnectedTiles, animating: false };
    }

    let animating = false;
    for (let x = 0; x < this.#gridWidth; x += 1) {
      for (let y = 0; y < this.#gridHeight; y += 1) {
        if (this.#tileGrid[x][y].update(timePassed)) {
          animating = true;
        }
      }
    }

    PowerFlow.resetGrid(this.#tileGrid);
    const connectedTiles = PowerFlow.compute(this.#powerPlant);

    this.#observers.notify(Events.Update, { timePassed, connectedTiles });

    if (connectedTiles === this.#gridWidth * this.#gridHeight && !this.#won) {
      this.#won = true;
      const payload = this.#session.finalize(
        this.#tileGrid,
        true,
        connectedTiles,
      );
      payload.outcome.score = calculateScore(this.#statistics);
      this.#observers.notify(Events.LevelWon, {
        statistics: this.#statistics,
        session: payload,
        pauseUsed: this.#session.wasPauseUsed(),
      });
    }

    return { connectedTiles, animating: animating || this.isAnimating() };
  }
}
