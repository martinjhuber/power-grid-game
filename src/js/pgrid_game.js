/*** PowerGridGame - Game module - (c) mjh.at - v0.0.1 ***/

var Game,
    GameConfig,
    GameRenderer,
    GamePath,
    GameState,
    GameLevelState,
    GameUtil,
    stop;   // TODO: remove me

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var _renderer, _gameState,
        lastFps = 0,
        timestamp, gameLoop, updateFps;


    module.frameCounter = 0;
    module.time = 0;

    timestamp = function () {
        return (window.performance && window.performance.now ?
                window.performance.now() : Date().now) / 1000;
    };

    /* Main game loop */

    gameLoop = function () {
        var now = timestamp(), x, y,
            timePassed = Math.min(1, now - module.time),
            grid, // remove me
            tile; // remove me

        window.requestAnimationFrame(gameLoop);

        // TODO: game logic

        if (!stop) {
            // TODO: remove me
            grid = _gameState.levelState.getTileGrid();
            // Rotation logic test
            if (Math.floor(Math.random() * 40) === 0) {
                tile = grid[Math.floor(Math.random() * grid.length)][Math.floor(Math.random() * grid[0].length)];
                if (Math.random() < 0.5) {
                    tile.rotateRight();
                } else {
                    tile.rotateLeft();
                }
                //console.log("rotate", tile.x, tile.y);
            }

            _gameState.levelState.update();
        }

        // Render game
        _renderer.render(timePassed, _gameState);

        module.frameCounter += 1;
        module.time = now;
    };

    /* Entry point into the game */

    module.init = function () {

        var path;

        _renderer = new GameRenderer.Renderer();
        _gameState = new GameState.GameState();

        // TODO: Remove
        _gameState.startLevel();
        _gameState.levelState = new GameLevelState.LevelState(15, 13, true);

        // Reset FPS counter every second
        setInterval(updateFps, 1000);

        // Start game loop
        module.time = timestamp();
        window.requestAnimationFrame(gameLoop);

    };

    /* FPS counters */

    updateFps = function () {
        lastFps = module.frameCounter;
        module.frameCounter = 0;
    };

    module.getFps = function () {
        return lastFps;
    };

}(Game = Game || {}));
