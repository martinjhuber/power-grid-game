export class GameSession {
  #puzzle;
  #events = [];
  #startedAt = 0;
  #pausedAt = null;
  #pausedTotalMs = 0;
  #sessionId;
  #outcome = null;
  #rotationCount = 0;
  #lastRotationCell = null;

  constructor(puzzle) {
    this.#puzzle = puzzle;
    this.#sessionId = crypto.randomUUID();
  }

  get sessionId() {
    return this.#sessionId;
  }

  #nowMs() {
    if (this.#startedAt === 0) {
      return 0;
    }
    let elapsed = performance.now() - this.#startedAt - this.#pausedTotalMs;
    if (this.#pausedAt !== null) {
      elapsed -= performance.now() - this.#pausedAt;
    }
    return Math.max(0, Math.round(elapsed));
  }

  recordStart() {
    this.#startedAt = performance.now();
    this.#events.push({ t: 0, kind: 'start' });
  }

  recordRotate(x, y, dir) {
    this.#events.push({ t: this.#nowMs(), kind: 'rotate', x, y, dir });
    const key = `${x},${y}`;
    if (this.#lastRotationCell !== key) {
      this.#rotationCount += 1;
      this.#lastRotationCell = key;
    }
  }

  recordLock(x, y, locked) {
    this.#events.push({ t: this.#nowMs(), kind: 'lock', x, y, locked });
  }

  recordPause() {
    if (this.#pausedAt === null) {
      this.#pausedAt = performance.now();
      this.#events.push({ t: this.#nowMs(), kind: 'pause' });
    }
  }

  recordResume() {
    if (this.#pausedAt !== null) {
      this.#pausedTotalMs += performance.now() - this.#pausedAt;
      this.#pausedAt = null;
      this.#events.push({ t: this.#nowMs(), kind: 'resume' });
    }
  }

  getActiveDurationMs() {
    return this.#nowMs();
  }

  getRotationCount() {
    return this.#rotationCount;
  }

  wasPauseUsed() {
    return this.#events.some((event) => event.kind === 'pause');
  }

  finalize(tileGrid, won, connectedTiles) {
    const finalRotations = [];
    for (let x = 0; x < tileGrid.length; x += 1) {
      for (let y = 0; y < tileGrid[x].length; y += 1) {
        finalRotations.push({
          x,
          y,
          rotation: tileGrid[x][y].getNormalizedRotation(),
        });
      }
    }

    this.#outcome = {
      won,
      activeDurationMs: this.getActiveDurationMs(),
      rotationCount: this.#rotationCount,
      connectedTiles,
      finalRotations,
    };

    return this.toPayload();
  }

  toPayload() {
    return {
      schemaVersion: 1,
      sessionId: this.#sessionId,
      puzzle: this.#puzzle,
      events: this.#events.slice(),
      outcome: this.#outcome,
      finishedAt: this.#outcome ? new Date().toISOString() : null,
    };
  }
}
