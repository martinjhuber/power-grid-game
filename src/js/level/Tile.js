import { CONFIG } from '../config.js';
import { normalizeRotation } from '../util.js';

export const TileType = {
  Consumer: 'C',
  I: 'I',
  L: 'L',
  Y: 'Y',
  X: 'X',
};

export const TileState = {
  Connected: 'C',
  NotConnected: 'N',
};

function countConnectors(connectors) {
  return connectors.filter(Boolean).length;
}

export class Tile {
  x;
  y;
  type = null;
  isPowerPlant;
  tileState = TileState.NotConnected;
  neighbors = [null, null, null, null];
  locked = false;
  #connectors;
  #rotation = 0;
  #rotationGoal = 0;
  #startRotation = 0;

  constructor(x, y, connectors, isPowerPlant) {
    this.x = x;
    this.y = y;
    this.#connectors = connectors.slice();
    this.isPowerPlant = isPowerPlant;
  }

  get rotation() {
    return this.#rotation;
  }

  get rotationGoal() {
    return this.#rotationGoal;
  }

  get startRotation() {
    return this.#startRotation;
  }

  get connectors() {
    return this.#connectors.slice();
  }

  getNormalizedRotation() {
    return normalizeRotation(this.#rotation);
  }

  setRotation(rotation) {
    this.#rotation = rotation;
    this.#rotationGoal = rotation;
    this.#startRotation = normalizeRotation(rotation);
  }

  setRotationImmediate(rotation) {
    this.#rotation = rotation;
    this.#rotationGoal = rotation;
  }

  hasCorrectOrientation() {
    return this.getNormalizedRotation() === this.#startRotation;
  }

  update(timePassed) {
    if (this.#rotation === this.#rotationGoal) {
      return false;
    }
    const diff = Math.abs(this.#rotationGoal - this.#rotation);
    const degrees = Math.min(CONFIG.grid.rotatePerSec * timePassed, diff);
    if (this.#rotation > this.#rotationGoal) {
      this.#rotation -= degrees;
    } else {
      this.#rotation += degrees;
    }
    return true;
  }

  isAnimating() {
    return this.#rotation !== this.#rotationGoal;
  }

  rotateLeft() {
    if (!this.locked) {
      this.#rotationGoal -= 90;
    }
  }

  rotateRight() {
    if (!this.locked) {
      this.#rotationGoal += 90;
    }
  }

  applyRotationDelta(dir) {
    if (dir < 0) {
      this.rotateLeft();
    } else {
      this.rotateRight();
    }
  }

  connectsWith() {
    return [false, false, false, false];
  }
}

export class Consumer extends Tile {
  constructor(x, y, connectors, isPowerPlant) {
    super(x, y, connectors, isPowerPlant);
    this.type = TileType.Consumer;
    let i = 0;
    for (; i < connectors.length; i += 1) {
      if (connectors[i]) {
        break;
      }
    }
    this.setRotation(i * 90);
  }

  connectsWith() {
    const connectors = [false, false, false, false];
    const rot = this.getNormalizedRotation();
    if (rot === 0) connectors[0] = true;
    else if (rot === 90) connectors[1] = true;
    else if (rot === 180) connectors[2] = true;
    else if (rot === 270) connectors[3] = true;
    return connectors;
  }
}

export class TileI extends Tile {
  constructor(x, y, connectors, isPowerPlant) {
    super(x, y, connectors, isPowerPlant);
    this.type = TileType.I;
    if (connectors[1]) {
      this.setRotation(90);
    }
  }

  connectsWith() {
    const connectors = [false, false, false, false];
    const rot180 = this.getNormalizedRotation() % 180;
    if (rot180 === 0) {
      connectors[0] = connectors[2] = true;
    } else if (rot180 === 90) {
      connectors[1] = connectors[3] = true;
    }
    return connectors;
  }

  hasCorrectOrientation() {
    return (this.getNormalizedRotation() % 180) === this.startRotation;
  }
}

export class TileL extends Tile {
  constructor(x, y, connectors, isPowerPlant) {
    super(x, y, connectors, isPowerPlant);
    this.type = TileType.L;
    if (connectors[1] && connectors[2]) {
      this.setRotation(90);
    } else if (connectors[2] && connectors[3]) {
      this.setRotation(180);
    } else if (connectors[3] && connectors[0]) {
      this.setRotation(270);
    }
  }

  connectsWith() {
    const connectors = [false, false, false, false];
    const rot = this.getNormalizedRotation();
    connectors[0] = rot === 0 || rot === 270;
    connectors[1] = rot === 0 || rot === 90;
    connectors[2] = rot === 90 || rot === 180;
    connectors[3] = rot === 180 || rot === 270;
    return connectors;
  }
}

export class TileY extends Tile {
  constructor(x, y, connectors, isPowerPlant) {
    super(x, y, connectors, isPowerPlant);
    this.type = TileType.Y;
    let i = 0;
    for (; i < connectors.length; i += 1) {
      if (!connectors[i]) {
        break;
      }
    }
    this.setRotation(((i + 2) % 4) * 90);
  }

  connectsWith() {
    const rot = this.getNormalizedRotation();
    if (rot === 0) return [true, true, false, true];
    if (rot === 90) return [true, true, true, false];
    if (rot === 180) return [false, true, true, true];
    if (rot === 270) return [true, false, true, true];
    return [false, false, false, false];
  }
}

export class TileX extends Tile {
  constructor(x, y, connectors, isPowerPlant) {
    super(x, y, connectors, isPowerPlant);
    this.type = TileType.X;
  }

  connectsWith() {
    if (this.getNormalizedRotation() % 90 === 0) {
      return [true, true, true, true];
    }
    return [false, false, false, false];
  }

  hasCorrectOrientation() {
    return true;
  }
}

export class TileFactory {
  static create(x, y, connectors, isPowerPlant) {
    const count = countConnectors(connectors);
    switch (count) {
      case 1:
        return new Consumer(x, y, connectors, isPowerPlant);
      case 2:
        if ((connectors[0] && connectors[2]) || (connectors[1] && connectors[3])) {
          return new TileI(x, y, connectors, isPowerPlant);
        }
        return new TileL(x, y, connectors, isPowerPlant);
      case 3:
        return new TileY(x, y, connectors, isPowerPlant);
      case 4:
        return new TileX(x, y, connectors, isPowerPlant);
      default:
        console.error('Tile has no connectors:', x, y);
        return null;
    }
  }
}
