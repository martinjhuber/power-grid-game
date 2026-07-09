export class Observers {
  #observers = [];

  register(observer) {
    this.#observers.push(observer);
  }

  notify(event, params) {
    for (const observer of this.#observers) {
      observer.onNotify?.(event, params);
    }
  }
}

export const Events = {
  LevelStarted: 'levelStarted',
  LevelPause: 'levelPause',
  Update: 'update',
  TileRotate: 'tileRotate',
  TileLock: 'tileLock',
  LevelWon: 'levelWon',
};
