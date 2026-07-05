import { TileState } from './Tile.js';

export class PowerFlow {
  static compute(powerPlant) {
    const stack = [powerPlant];
    let connectedTiles = 0;

    while (stack.length > 0) {
      const currentTile = stack.pop();
      currentTile.tileState = TileState.Connected;
      connectedTiles += 1;
      const connections = currentTile.connectsWith();
      const neighborTiles = currentTile.neighbors;

      for (let n = 0; n < neighborTiles.length; n += 1) {
        const neighborTile = neighborTiles[n];
        if (
          neighborTile !== null &&
          neighborTile.tileState !== TileState.Connected &&
          connections[n] === true &&
          neighborTile.connectsWith()[(n + 2) % 4] === true
        ) {
          stack.push(neighborTile);
        }
      }
    }

    return connectedTiles;
  }

  static resetGrid(tileGrid) {
    for (let x = 0; x < tileGrid.length; x += 1) {
      for (let y = 0; y < tileGrid[x].length; y += 1) {
        tileGrid[x][y].tileState = TileState.NotConnected;
      }
    }
  }
}
