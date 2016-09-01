/*** PowerGridGame - Renderer module - (c) mjh.at - v0.0.1 ***/

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
        var constructor, drawFps, renderState,
            ctx, levelRenderer;

        constructor = function () {
            var canvas = document.getElementById("canvas");

            ctx = canvas.getContext("2d");
            levelRenderer = new GameLevelRenderer.LevelRenderer(ctx);
        };

        drawFps = function () {
            var fps = Game.getFps();

            ctx.save();
            ctx.font = "normal 9px 'Lucida Console'";
            ctx.textAlign = "right";
            ctx.fillStyle = "#0F0";
            ctx.fillText(" " + fps, GameConfig.renderer.width - 2, 10);
            ctx.restore();

        };

        renderState = function (timePassed, state) {

            if (state.renderBelow) {
                renderState(timePassed, state.stateBelow);
            }

            if (state.stateType === GameState.StateType.Menu) {
                console.log("No renderer for menu yet");
            } else if (state.stateType === GameState.StateType.Level) {
                levelRenderer.render(state);
            }


        };

        this.render = function (timePassed, gameState) {
            var currentState = gameState.getCurrentState();

            ctx.clearRect(0, 0, GameConfig.renderer.width, GameConfig.renderer.height);
            renderState(timePassed, currentState);
            drawFps();
        };

        constructor();
    };



}(GameRenderer = GameRenderer || {}));
