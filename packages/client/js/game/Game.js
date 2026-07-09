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
import { calculateScore, formatScore } from '@power-grid/shared/score/ScoreCalculator.js';
import { ScoreApiClient } from '../verification/ScoreApiClient.js';
import { APP_VERSION } from '../version.js';
import { getPlayerName, setPlayerName, validatePlayerName } from '../ui/PlayerNameCookie.js';

export class Game {
  #canvas;
  #gameColumn;
  #hud;
  #winOverlay;
  #nameDialog;
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
  #pendingScoreSubmission = null;

  constructor(canvas, gameColumn, hud, winOverlay, nameDialog, onReturnToSetup) {
    this.#canvas = canvas;
    this.#gameColumn = gameColumn;
    this.#hud = hud;
    this.#winOverlay = winOverlay;
    this.#nameDialog = nameDialog;
    this.#onReturnToSetup = onReturnToSetup;
    this.#renderer = new GameRenderer(canvas);
    this.#boundLoop = this.#loop.bind(this);
    this.#boundResize = () => this.#handleResize();
    this.#bindHud();
    this.#bindWinOverlay();
    this.#bindNameDialog();
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
      this.#hideNameDialog();
      this.#winOverlay.el.hidden = true;
      if (this.#settings) {
        this.start(this.#settings);
      }
    });
    this.#winOverlay.newGameBtn.addEventListener('click', () => {
      this.#hideNameDialog();
      this.stop();
      this.#onReturnToSetup();
    });
    this.#winOverlay.leaderboardBtn?.addEventListener('click', () => {
      this.#winOverlay.onOpenLeaderboard?.();
    });
  }

  #bindNameDialog() {
    this.#nameDialog.submitBtn.addEventListener('click', () => {
      void this.#submitPlayerName();
    });
    this.#nameDialog.skipBtn.addEventListener('click', () => {
      this.#hideNameDialog();
    });
    this.#nameDialog.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void this.#submitPlayerName();
      }
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
    this.#pendingScoreSubmission = null;
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
            void this.#handleWin(params);
          }
          if (event === Events.LevelPause) {
            this.#updateHudPause();
          }
        },
      });

      this.#updateHud();
      this.#winOverlay.el.hidden = true;
      this.#hideNameDialog();
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
    this.#pendingScoreSubmission = null;
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

  async #handleWin(params) {
    const { statistics, session, pauseUsed } = params;
    this.#showWin(statistics, pauseUsed);

    try {
      const result = await ScoreApiClient.submitScore({
        session,
        statistics: statistics.toSnapshot(),
        clientScore: calculateScore(statistics),
        appVersion: APP_VERSION,
      });

      this.#pendingScoreSubmission = {
        id: result.id,
        editToken: result.editToken,
      };

      if (result.qualifiesForLeaderboard) {
        this.#setWinLeaderboardResult(result.score, result.rank);
      }

      if (result.offerNamePrompt) {
        this.#showNameDialog(result.score, result.rank);
      }
    } catch (error) {
      console.warn('Score submission failed:', error);
    }
  }

  #showWin(statistics, pauseUsed) {
    this.#winOverlay.rankPrefix.hidden = true;
    this.#winOverlay.score.textContent = formatScore(calculateScore(statistics));
    this.#winOverlay.time.textContent = String(Math.floor(statistics.timePassed));
    this.#winOverlay.rotations.textContent = String(statistics.rotations);
    this.#winOverlay.minRotations.textContent = String(statistics.minimumRotationsRequired);
    this.#winOverlay.leaderboardNotice.hidden = !pauseUsed;
    this.#winOverlay.successNotice.hidden = true;
    this.#winOverlay.el.hidden = false;
  }

  #setWinLeaderboardResult(score, rank) {
    this.#winOverlay.rank.textContent = rank != null ? String(rank) : '—';
    this.#winOverlay.score.textContent = formatScore(score ?? 0);
    this.#winOverlay.rankPrefix.hidden = false;
  }

  #showNameDialog(score, rank) {
    this.#nameDialog.rank.textContent = rank != null ? String(rank) : '—';
    this.#nameDialog.score.textContent = formatScore(score ?? 0);
    this.#nameDialog.input.value = getPlayerName();
    this.#nameDialog.error.hidden = true;
    this.#nameDialog.el.hidden = false;
    this.#nameDialog.input.focus();
  }

  #hideNameDialog() {
    this.#nameDialog.el.hidden = true;
    this.#nameDialog.error.hidden = true;
  }

  async #submitPlayerName() {
    const name = this.#nameDialog.input.value.trim();
    if (!validatePlayerName(name)) {
      this.#nameDialog.error.textContent = 'Use 1–16 letters or numbers only.';
      this.#nameDialog.error.hidden = false;
      return;
    }

    const pending = this.#pendingScoreSubmission;
    if (!pending?.id || !pending?.editToken) {
      this.#nameDialog.error.textContent = 'Could not save name. Try again later.';
      this.#nameDialog.error.hidden = false;
      return;
    }

    try {
      await ScoreApiClient.setPlayerName(pending.id, name, pending.editToken);
      setPlayerName(name);
      this.#pendingScoreSubmission = null;
      this.#hideNameDialog();
      this.#winOverlay.successNotice.textContent = 'You made the leaderboard!';
      this.#winOverlay.successNotice.hidden = false;
    } catch {
      this.#nameDialog.error.textContent = 'Could not save name. Try again later.';
      this.#nameDialog.error.hidden = false;
    }
  }
}
