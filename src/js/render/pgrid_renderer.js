/*** TD Renderer module - (c) mjh.at - v0.0.1 2016-08-10 ***/

var GameRenderer,
    GameLevelRenderer,
    GameState,
    GameConfig,
    Game;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var _Renderer, ctx,
        drawFps;

    module.Renderer = function () {
        var canvas = document.getElementById("canvas");

        ctx = canvas.getContext("2d");

        this.levelRenderer = new GameLevelRenderer.LevelRenderer(ctx);

    };
    _Renderer = module.Renderer.prototype;

    _Renderer.render = function (timePassed, gameState) {
        var currentState = gameState.getState();

        ctx.clearRect(0, 0, GameConfig.renderer.width, GameConfig.renderer.height);

        if (currentState === GameState.State.GAMEPLAY) {
            this.levelRenderer.render(gameState.getLevelState());
        }

        drawFps();

    };

    drawFps = function () {
        var fps = Game.getFps();

        ctx.font = "normal 9px 'Lucida Console'";
        ctx.textAlign = "right";
        ctx.fillStyle = "#0F0";
        ctx.fillText(" " + fps, GameConfig.renderer.width - 2, 10);
    };

}(GameRenderer = GameRenderer || {}));
