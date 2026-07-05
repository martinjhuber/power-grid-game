import { CONFIG } from '../config.js';
import { DeviceProfile } from './DeviceProfile.js';

export class InputHandler {
  #canvas;
  #level;
  #layout;
  #onChange;
  #longPressTimer = null;
  #longPressTriggered = false;
  #activePointerId = null;
  #lastPointer = null;
  #boundKeyDown = null;

  constructor(canvas, level, layout, onChange) {
    this.#canvas = canvas;
    this.#level = level;
    this.#layout = layout;
    this.#onChange = onChange;
    this.#bindEvents();
  }

  updateLayout(layout) {
    this.#layout = layout;
  }

  #bindEvents() {
    this.#canvas.addEventListener('pointerdown', (e) => this.#onPointerDown(e));
    this.#canvas.addEventListener('pointerup', (e) => this.#onPointerUp(e));
    this.#canvas.addEventListener('pointermove', (e) => this.#trackPointer(e));
    this.#canvas.addEventListener('pointercancel', (e) => this.#clearLongPress(e));
    this.#canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.#boundKeyDown = (e) => this.#onKeyDown(e);
    document.addEventListener('keydown', this.#boundKeyDown);
  }

  #onKeyDown(event) {
    if (event.code === 'KeyP') {
      this.#level.togglePause();
      this.#onChange?.();
      return;
    }

    if (event.code !== 'KeyL' && event.code !== 'Space') {
      return;
    }

    if (this.#level.won || this.#level.pause || !this.#lastPointer) {
      return;
    }

    const cell = this.#tileAt(this.#lastPointer.x, this.#lastPointer.y);
    if (!cell) {
      return;
    }

    event.preventDefault();
    this.#level.toggleLock(cell.x, cell.y);
    this.#onChange?.();
  }

  #trackPointer(event) {
    const coords = this.#canvasCoords(event);
    this.#lastPointer = coords;
  }

  #canvasCoords(event) {
    const rect = this.#canvas.getBoundingClientRect();
    const { canvasWidth, canvasHeight } = this.#layout;
    return {
      x: (event.clientX - rect.left) * (canvasWidth / rect.width),
      y: (event.clientY - rect.top) * (canvasHeight / rect.height),
    };
  }

  #tileAt(x, y) {
    const { offsetX, offsetY, tileSize } = this.#layout;
    const tx = Math.floor((x - offsetX) / tileSize);
    const ty = Math.floor((y - offsetY) / tileSize);
    if (
      tx < 0 ||
      ty < 0 ||
      tx >= this.#level.gridWidth ||
      ty >= this.#level.gridHeight
    ) {
      return null;
    }
    return { x: tx, y: ty, localX: x - offsetX - tx * tileSize };
  }

  #onPointerDown(event) {
    if (this.#level.won || this.#level.pause) {
      return;
    }
    this.#canvas.setPointerCapture(event.pointerId);
    this.#activePointerId = event.pointerId;
    this.#longPressTriggered = false;

    const coords = this.#canvasCoords(event);
    this.#lastPointer = coords;
    const cell = this.#tileAt(coords.x, coords.y);
    if (!cell) {
      return;
    }

    if (DeviceProfile.isCoarsePointer()) {
      this.#longPressTimer = window.setTimeout(() => {
        this.#longPressTriggered = true;
        this.#level.toggleLock(cell.x, cell.y);
        this.#onChange?.();
      }, CONFIG.grid.longPressMs);
    }
  }

  #onPointerUp(event) {
    if (this.#canvas.hasPointerCapture(event.pointerId)) {
      this.#canvas.releasePointerCapture(event.pointerId);
    }
    this.#clearLongPress();

    if (this.#longPressTriggered || this.#level.won || this.#level.pause) {
      return;
    }

    const coords = this.#canvasCoords(event);
    const cell = this.#tileAt(coords.x, coords.y);
    if (!cell) {
      return;
    }

    if (event.button === 2 && !DeviceProfile.isCoarsePointer()) {
      this.#level.toggleLock(cell.x, cell.y);
      this.#onChange?.();
      return;
    }

    if (event.button !== 0) {
      return;
    }

    if (DeviceProfile.isCoarsePointer()) {
      this.#level.rotateTileRight(cell.x, cell.y);
    } else {
      const mid = this.#layout.tileSize / 2;
      if (cell.localX < mid) {
        this.#level.rotateTileLeft(cell.x, cell.y);
      } else {
        this.#level.rotateTileRight(cell.x, cell.y);
      }
    }
    this.#onChange?.();
  }

  #clearLongPress() {
    if (this.#longPressTimer !== null) {
      window.clearTimeout(this.#longPressTimer);
      this.#longPressTimer = null;
    }
    if (this.#activePointerId !== null) {
      this.#activePointerId = null;
    }
  }

  destroy() {
    this.#clearLongPress();
    document.removeEventListener('keydown', this.#boundKeyDown);
  }
}
