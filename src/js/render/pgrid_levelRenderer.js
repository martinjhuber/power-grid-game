/*** TD LevelRenderer module - (c) mjh.at - v0.0.1 2016-08-10 ***/

var GameLevelRenderer,
    GameConfig,
    GameLevelState;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var _LevelRenderer, ctx,
        renderLevelState, renderTiles, renderEnemyPaths, renderGrid;

    module.LevelRenderer = function (canvasContext) {
        ctx = canvasContext;
    };
    _LevelRenderer = module.LevelRenderer.prototype;

    _LevelRenderer.render = function (levelState) {
        renderGrid(levelState.getGrid());
        renderLevelState(levelState);
    };

    renderLevelState = function (levelState) {
        renderTiles(levelState.getGrid());
    };

    renderTiles = function (tileGrid) {
        var x, y, tile, connectors,
            tileSize = GameConfig.grid.tileSize,
            halfTileSize = tileSize / 2;

        ctx.strokeStyle = GameConfig.style.tileLine;
        ctx.fillStyle = GameConfig.style.tileLine;
        ctx.lineWidth = GameConfig.style.tileLineWidth;

        ctx.beginPath();

        for (x = 0; x < tileGrid.length; x += 1) {
            for (y = 0; y < tileGrid[x].length; y += 1) {

                tile = tileGrid[x][y];
                connectors = tile.getConnectors();

                ctx.beginPath();

                if (connectors[0]) {
                    ctx.moveTo(x * tileSize + halfTileSize, y * tileSize);
                    ctx.lineTo(x * tileSize + halfTileSize, y * tileSize + halfTileSize);
                }
                if (connectors[1]) {
                    ctx.moveTo(x * tileSize + tileSize, y * tileSize + halfTileSize);
                    ctx.lineTo(x * tileSize + halfTileSize, y * tileSize + halfTileSize);
                }
                if (connectors[2]) {
                    ctx.moveTo(x * tileSize + halfTileSize, y * tileSize + tileSize);
                    ctx.lineTo(x * tileSize + halfTileSize, y * tileSize + halfTileSize);
                }
                if (connectors[3]) {
                    ctx.moveTo(x * tileSize, y * tileSize + halfTileSize);
                    ctx.lineTo(x * tileSize + halfTileSize, y * tileSize + halfTileSize);
                }

                ctx.stroke();

                if (tile.getType() === GameLevelState.TileType.Consumer) {
                    ctx.beginPath();
                    ctx.arc(x * tileSize + halfTileSize, y * tileSize + halfTileSize, halfTileSize / 2, 0, 2 * Math.PI, false);
                    ctx.fill();
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
