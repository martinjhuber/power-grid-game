import { CONFIG } from '../config.js';

export class RenderContext {
  #canvas;
  #ctx;
  #dpr;
  #cssWidth;
  #cssHeight;

  constructor(canvas, cssWidth, cssHeight) {
    this.#canvas = canvas;
    this.#dpr = window.devicePixelRatio || 1;
    this.#cssWidth = cssWidth;
    this.#cssHeight = cssHeight;
    this.#resize();
    this.#ctx = canvas.getContext('2d');
    this.#ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
  }

  #resize() {
    this.#canvas.width = Math.floor(this.#cssWidth * this.#dpr);
    this.#canvas.height = Math.floor(this.#cssHeight * this.#dpr);
    this.#canvas.style.width = `${this.#cssWidth}px`;
    this.#canvas.style.height = `${this.#cssHeight}px`;
  }

  resize(cssWidth, cssHeight) {
    this.#cssWidth = cssWidth;
    this.#cssHeight = cssHeight;
    this.#resize();
    this.#ctx = this.#canvas.getContext('2d');
    this.#ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
  }

  get ctx() {
    return this.#ctx;
  }

  get dpr() {
    return this.#dpr;
  }

  get width() {
    return this.#canvas.width;
  }

  get height() {
    return this.#canvas.height;
  }

  clear() {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    ctx.restore();
    ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
  }
}
