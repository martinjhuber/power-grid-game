/*** PowerGridGame - LevelRenderer module - (c) mjh.at - v0.0.1 ***/

var GameLevelRenderer,
    GameConfig,
    GameLevel;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var _LevelRenderer, ctx,
        renderLevelState, renderTiles, renderEnemyPaths, renderGrid;

    module.LevelRenderer = function (canvasContext) {
        ctx = canvasContext;
    };
    _LevelRenderer = module.LevelRenderer.prototype;

    _LevelRenderer.render = function (level) {
        renderGrid(level.getTileGrid());
        renderLevelState(level);
    };

    renderLevelState = function (level) {
        renderTiles(level.getTileGrid());
    };

    renderTiles = function (tileGrid) {
        var x, y, tile, connectors,
            tileSize = GameConfig.grid.tileSize,
            halfTileSize = tileSize / 2,
            qrtTileSize = tileSize / 4,
            halfPi = Math.PI / 180;

        ctx.fillStyle = GameConfig.style.tileLine;
        ctx.lineWidth = GameConfig.style.tileLineWidth;

        ctx.beginPath();

        for (x = 0; x < tileGrid.length; x += 1) {
            for (y = 0; y < tileGrid[x].length; y += 1) {

                tile = tileGrid[x][y];

                ctx.save();

                if (tile.tileState === GameLevel.TileStates.Connected) {
                    ctx.strokeStyle = GameConfig.style.tileLineConnected;
                    ctx.fillStyle = GameConfig.style.tileLineConnected;

                } else {
                    ctx.strokeStyle = GameConfig.style.tileLine;
                    ctx.fillStyle = GameConfig.style.tileLine;
                }

                ctx.beginPath();
                ctx.translate(x * tileSize + halfTileSize, y * tileSize + halfTileSize);
                ctx.rotate(tile.getNormalizedRotation() * halfPi);

                if (tile.type === GameLevel.TileType.Consumer) {
                    ctx.moveTo(0, -halfTileSize);
                    ctx.lineTo(0, 0);
                } else if (tile.type === GameLevel.TileType.I) {
                    ctx.moveTo(0, -halfTileSize);
                    ctx.lineTo(0, halfTileSize);
                } else if (tile.type === GameLevel.TileType.L) {
                    ctx.moveTo(0, -halfTileSize);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(halfTileSize, 0);
                } else if (tile.type === GameLevel.TileType.Y) {
                    ctx.moveTo(0, -halfTileSize);
                    ctx.lineTo(0, 0);
                    ctx.moveTo(-halfTileSize, 0);
                    ctx.lineTo(halfTileSize, 0);
                } else if (tile.type === GameLevel.TileType.X) {
                    ctx.moveTo(0, -halfTileSize);
                    ctx.lineTo(0, halfTileSize);
                    ctx.moveTo(-halfTileSize, 0);
                    ctx.lineTo(halfTileSize, 0);
                }

                ctx.stroke();

                if (tile.isPowerPlant) {
                    ctx.fillRect(-qrtTileSize, -qrtTileSize, halfTileSize, halfTileSize);
                } else if (tile.type === GameLevel.TileType.Consumer) {
                    ctx.beginPath();
                    ctx.arc(0, 0, qrtTileSize, 0, 2 * Math.PI, false);
                    ctx.fill();
                }

                ctx.restore();

                if (tile.locked) {
                    ctx.fillStyle = GameConfig.style.tileLockedOverlay;
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }

            }
        }

    };


    renderGrid = function (tileGrid) {
        var i, j;

        ctx.strokeStyle = GameConfig.style.grid;
        ctx.lineWidth = 1;

        ctx.beginPath();

        for (i = 0; i < tileGrid.length; i += 1) {
            ctx.moveTo(i * GameConfig.grid.tileSize, 0);
            ctx.lineTo(i * GameConfig.grid.tileSize, tileGrid[0].length * GameConfig.grid.tileSize);
        }

        for (i = 0; i < tileGrid[0].length; i += 1) {
            ctx.moveTo(0, i * GameConfig.grid.tileSize);
            ctx.lineTo(tileGrid.length * GameConfig.grid.tileSize, i * GameConfig.grid.tileSize);
        }

        ctx.stroke();
    };


}(GameLevelRenderer = GameLevelRenderer || {}));
