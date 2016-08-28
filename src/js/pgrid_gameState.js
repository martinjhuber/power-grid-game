/*** PowerGridGame - GameState module - (c) mjh.at - v0.0.1 ***/

var GameState,
    GameUtil,
    Game,
    GameConfig;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var _GameState, State;

    module.State = {
        MENU : 1,
        GAMEPLAY : 2,
        GAMEEND : 3,
        PAUSE : 4
    };
    State = module.State;

    module.GameState = function () {
        this.state = State.MENU;
        this.levelState = null;
    };
    _GameState = module.GameState.prototype;

    /* Get the current game state */
    _GameState.getState = function () {
        return this.state;
    };

    /* Get the current state of the loaded level - may be null */
    _GameState.getLevelState = function () {
        return this.levelState;
    };

    _GameState.startLevel = function (level) {
        if (this.state === State.MENU) {

            // TODO: Load level

            this.state = State.GAMEPLAY;
        } else {
            console.error("State change to GAMEPLAY not allowed.");
        }
    };

    _GameState.pauseGame = function () {
        if (this.state === State.GAMEPLAY) {
            this.state = State.PAUSE;
        } else {
            console.error("State change to PAUSE not allowed.");
        }
    };

    _GameState.returnToMenu = function () {
        if (this.state === State.PAUSE) {
            this.state = State.MENU;
        } else {
            console.error("State change to MENU not allowed.");
        }
    };

}(GameState = GameState || {}));
