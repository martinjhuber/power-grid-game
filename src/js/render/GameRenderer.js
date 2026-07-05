import { BoardRenderer } from './BoardRenderer.js';
import { RenderContext } from './RenderContext.js';

export class GameRenderer {
  #renderContext;
  #boardRenderer;
  #dirty = true;
  #cssWidth;
  #cssHeight;

  constructor(canvas) {
    this.#boardRenderer = new BoardRenderer();
    this.#cssWidth = 640;
    this.#cssHeight = 480;
    this.#renderContext = new RenderContext(canvas, this.#cssWidth, this.#cssHeight);
  }

  resize(cssWidth, cssHeight) {
    this.#cssWidth = cssWidth;
    this.#cssHeight = cssHeight;
    this.#renderContext.resize(cssWidth, cssHeight);
    this.#boardRenderer.resetGridCache();
    this.markDirty();
  }

  markDirty() {
    this.#dirty = true;
  }

  computeLayout(level, tileSize, canvasWidth, canvasHeight) {
    return this.#boardRenderer.computeLayout(
      level.gridWidth,
      level.gridHeight,
      tileSize,
      canvasWidth ?? this.#cssWidth,
      canvasHeight ?? this.#cssHeight,
    );
  }

  render(level, layout) {
    const animating = level.isAnimating();
    if (!this.#dirty && !animating && !level.pause) {
      return;
    }

    const ctx = this.#renderContext.ctx;
    this.#renderContext.clear();
    this.#boardRenderer.render(ctx, level, layout, this.#cssWidth, this.#cssHeight);

    if (!animating && !level.pause) {
      this.#dirty = false;
    }
  }
}
