/*** PowerGridGame - GameState module - (c) mjh.at - v0.0.1 ***/

var GameState,
    GameLevel,
    GameControl,
    GameConfig;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var State, MenuState, LevelState, PopupState,
        _State, _MenuState, _LevelState, _PopupState;

    module.StateType = {
        Menu : 1,
        Level : 2,
        Pause : 3,
        Popup : 4
    };

    module.GameState = function () {

        var constructor, thiz = this, stateStack = [];

        constructor = function () {
            stateStack = [new MenuState(thiz)];
        };

        this.getCurrentState = function () {
            return stateStack[stateStack.length - 1];
        };

        this.closeCurrentState = function () {
            return stateStack.pop();
        };

        this.startLevel = function (gridWidth, gridHeight, wrap) {
            stateStack.push(new LevelState(thiz, gridWidth, gridHeight, wrap));
        };

        this.showPopup = function (parameters) {
            stateStack.push(new PopupState(thiz, parameters));
        };

        this.update = function (timePassed) {
            this.getCurrentState().update(timePassed);
        };

        this.click = function (button, x, y) {
            this.getCurrentState().clickHandler.click(button, x, y);
        };

        this.keyPress = function (key) {
            this.getCurrentState().clickHandler.keyPress(key);
        };

        constructor();
    };

    // ---

    State = function (gameState) {
        this.stateType = null;
        this.gameState = gameState;
        this.clickHandler = new GameControl.ClickHandler();

        this.renderBelow = false;
        this.stateBelow = gameState.getCurrentState();

    };
    _State = State.prototype;

    _State.update = function (timePassed) {

    };

    // ---

    MenuState = function (gameState) {
        State.call(this, gameState);

        this.stateType = module.StateType.Menu;

    };
    MenuState.prototype = Object.create(_State);
    _MenuState = MenuState.prototype;

    // ---

    LevelState = function (gameState, gridWidth, gridHeight, wrap) {
        var x, y, tileSize = GameConfig.grid.tileSize,
            thiz = this, rotateLeftFunc, rotateRightFunc;

        State.call(this, gameState);

        this.stateType = module.StateType.Level;
        this.level = new GameLevel.Level(gridWidth, gridHeight, wrap);

        rotateLeftFunc = function (x, y) {
            return function (button) {
                if (button === GameControl.ClickButtons.Left) {
                    thiz.level.rotateTileLeft(x, y);
                } else {
                    thiz.level.lock(x, y);
                }
            };
        };
        rotateRightFunc = function (x, y) {
            return function (button) {
                if (button === GameControl.ClickButtons.Left) {
                    thiz.level.rotateTileRight(x, y);
                } else {
                    thiz.level.lock(x, y);
                }
            };
        };

        for (x = 0; x < gridWidth; x += 1) {
            for (y = 0; y < gridHeight; y += 1) {
                this.clickHandler.addClickHandler(
                    x * tileSize,
                    y * tileSize,
                    x * tileSize + tileSize / 2,
                    y * tileSize + tileSize,
                    rotateLeftFunc(x, y)
                );
                this.clickHandler.addClickHandler(
                    x * tileSize + tileSize / 2,
                    y * tileSize,
                    x * tileSize + tileSize,
                    y * tileSize + tileSize,
                    rotateRightFunc(x, y)
                );
            }
        }

    };
    LevelState.prototype = Object.create(_State);
    _LevelState = LevelState.prototype;

    _LevelState.getLevel = function () {
        return this.level;
    };

    _State.update = function (timePassed) {
        this.level.update(timePassed);
    };

    // ---

    PopupState = function (gameState, parameters) {
        State.call(this, gameState);

        this.stateType = module.StateType.Popup;
        this.renderBelow = true;

    };
    PopupState.prototype = Object.create(_State);
    _PopupState = PopupState.prototype;


}(GameState = GameState || {}));
