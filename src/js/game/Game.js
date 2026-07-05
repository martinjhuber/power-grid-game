import { Events } from '../util.js';
import { Level } from '../level/Level.js';
import { GameRenderer } from '../render/GameRenderer.js';
import { InputHandler } from '../input/InputHandler.js';
import { DeviceProfile } from '../input/DeviceProfile.js';
import {
  computeGameDimensions,
  measureColumnWidth,
  measureMaxBoardHeight,
} from '../layout/GameLayout.js';
import { calculateScore, formatScore } from '../score/ScoreCalculator.js';

export class Game {
  #canvas;
  #gameColumn;
  #hud;
  #winOverlay;
  #level = null;
  #renderer;
  #input = null;
  #layout = null;
  #tileSize = 0;
  #settings = null;
  #running = false;
  #lastTime = 0;
  #onReturnToSetup;
  #boundLoop;
  #boundResize;

  constructor(canvas, gameColumn, hud, winOverlay, onReturnToSetup) {
    this.#canvas = canvas;
    this.#gameColumn = gameColumn;
    this.#hud = hud;
    this.#winOverlay = winOverlay;
    this.#onReturnToSetup = onReturnToSetup;
    this.#renderer = new GameRenderer(canvas);
    this.#boundLoop = this.#loop.bind(this);
    this.#boundResize = () => this.#handleResize();
    this.#bindHud();
    this.#bindWinOverlay();
  }

  #bindHud() {
    this.#hud.pauseBtn.addEventListener('click', () => {
      if (this.#level) {
        this.#level.togglePause();
        this.#updateHudPause();
        this.#renderer.markDirty();
      }
    });

    this.#hud.cancelBtn.addEventListener('click', () => {
      this.stop();
      this.#onReturnToSetup();
    });
  }

  #bindWinOverlay() {
    this.#winOverlay.replayBtn.addEventListener('click', () => {
      this.#winOverlay.el.hidden = true;
      if (this.#settings) {
        this.start(this.#settings);
      }
    });
    this.#winOverlay.newGameBtn.addEventListener('click', () => {
      this.stop();
      this.#onReturnToSetup();
    });
  }

  #applyLayout(settings) {
    const { width, height } = settings;
    const columnWidth = measureColumnWidth(this.#gameColumn);
    const maxBoardHeight = measureMaxBoardHeight(this.#hud.el);
    const dimensions = computeGameDimensions(
      width,
      height,
      columnWidth,
      maxBoardHeight,
      DeviceProfile.isCoarsePointer(),
    );

    this.#tileSize = dimensions.tileSize;
    this.#renderer.resize(dimensions.canvasWidth, dimensions.canvasHeight);
    this.#layout = this.#renderer.computeLayout(this.#level, this.#tileSize);
    this.#input?.updateLayout(this.#layout);
    this.#renderer.markDirty();
  }

  start(settings) {
    this.stop();
    this.#settings = settings;
    const { width, height, wrap } = settings;

    this.#level = new Level(width, height, wrap);
    this.#level.start();

    window.addEventListener('resize', this.#boundResize);

    const finishStart = () => {
      this.#applyLayout(settings);

      this.#input = new InputHandler(
        this.#canvas,
        this.#level,
        this.#layout,
        () => this.#renderer.markDirty(),
      );

      this.#level.registerObserver({
        onNotify: (event, params) => {
          if (event === Events.Update) {
            this.#updateHud();
          }
          if (event === Events.LevelWon) {
            this.#showWin(params.statistics);
          }
          if (event === Events.LevelPause) {
            this.#updateHudPause();
          }
        },
      });

      this.#updateHud();
      this.#winOverlay.el.hidden = true;
      this.#running = true;
      this.#lastTime = performance.now();
      this.#renderer.markDirty();
      requestAnimationFrame(this.#boundLoop);
    };

    requestAnimationFrame(() => {
      this.#applyLayout(settings);
      finishStart();
    });
  }

  #handleResize() {
    if (!this.#running || !this.#settings) {
      return;
    }
    this.#applyLayout(this.#settings);
  }

  stop() {
    this.#running = false;
    window.removeEventListener('resize', this.#boundResize);
    this.#input?.destroy();
    this.#input = null;
    this.#level = null;
  }

  #loop(now) {
    if (!this.#running) {
      return;
    }

    const dt = Math.min(1, (now - this.#lastTime) / 1000);
    this.#lastTime = now;

    const result = this.#level.update(dt);
    this.#updateHud();

    if (result.animating) {
      this.#renderer.markDirty();
    }

    this.#renderer.render(this.#level, this.#layout);
    requestAnimationFrame(this.#boundLoop);
  }

  #updateHud() {
    const stats = this.#level.statistics;
    this.#hud.rotations.textContent = String(stats.rotations);
    this.#hud.minRotations.textContent = String(stats.minimumRotationsRequired);
    this.#hud.time.textContent = String(Math.floor(stats.timePassed));
    this.#hud.connected.textContent = `${stats.numConnectedTiles}/${stats.numTiles}`;
    this.#updateHudPause();
  }

  #updateHudPause() {
    const paused = this.#level?.pause ?? false;
    this.#hud.pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  }

  #showWin(statistics) {
    this.#winOverlay.score.textContent = formatScore(calculateScore(statistics));
    this.#winOverlay.time.textContent = String(Math.floor(statistics.timePassed));
    this.#winOverlay.rotations.textContent = String(statistics.rotations);
    this.#winOverlay.minRotations.textContent = String(statistics.minimumRotationsRequired);
    this.#winOverlay.el.hidden = false;
  }
}
