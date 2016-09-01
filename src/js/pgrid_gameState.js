/*** PowerGridGame - GameState module - (c) mjh.at - v0.0.1 ***/

var GameState,
    GameLevel,
    GameControl,
    GameConfig,
    GameUtil;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var State, MenuState, LevelState, PopupState, LevelStatistics,
        _State, _MenuState, _LevelState, _PopupState;

    module.StateType = {
        Menu : 1,
        Level : 2,
        Pause : 3,
        Popup : 4
    };

    module.GameState = function () {

        var constructor, thiz = this, stateStack = [],
            mouseLastPosition = [0, 0];

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
            this.getCurrentState().inputHandler.click(button, x, y);
        };

        this.keyPress = function (key) {
            this.getCurrentState().inputHandler.keyPress(
                key,
                mouseLastPosition[0],
                mouseLastPosition[1]
            );
        };

        this.mouseOver = function (x, y) {
            mouseLastPosition = [x, y];
            this.getCurrentState().inputHandler.mouseOver(x, y);
        };

        constructor();
    };

    // ---

    State = function (gameState) {
        this.stateType = null;
        this.gameState = gameState;
        this.inputHandler = new GameControl.InputHandler();

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
            thiz = this, rotateFunc, tileKeyPressFunc,
            x1, xm, x2, y1, y2;

        State.call(this, gameState);

        this.stateType = module.StateType.Level;
        this.level = new GameLevel.Level(gridWidth, gridHeight, wrap);
        this.levelStatistics = new LevelStatistics();
        this.level.registerObserver(this.levelStatistics);
        this.level.start();

        rotateFunc = function (x, y, levelRotateFunc) {
            return function (button) {
                if (button === GameControl.MouseButtons.Left) {
                    levelRotateFunc(x, y);
                } else {
                    thiz.level.lock(x, y);
                }
            };
        };
        tileKeyPressFunc = function (x, y) {
            return function (keyCode) {
                if (keyCode === GameControl.KeyCodes.Space || keyCode === GameControl.KeyCodes.L) {
                    thiz.level.lock(x, y);
                }
            };
        };

        for (x = 0; x < gridWidth; x += 1) {
            x1 = x * tileSize + GameConfig.grid.left;
            x2 = x1 + tileSize;
            xm = x1 + tileSize / 2;
            for (y = 0; y < gridHeight; y += 1) {
                y1 = y * tileSize + GameConfig.grid.top;
                y2 = y1 + tileSize;
                this.inputHandler.addClickHandler(x1, y1, xm, y2, rotateFunc(x, y, thiz.level.rotateTileLeft));
                this.inputHandler.addClickHandler(xm, y1, x2, y2, rotateFunc(x, y, thiz.level.rotateTileRight));
                this.inputHandler.addKeyPressHandler(x1, y1, x2, y2, tileKeyPressFunc(x, y));
            }
        }

        this.inputHandler.addKeyPressHandler(0, 0, 99999, 99999, function (keyCode) {
            if (keyCode === GameControl.KeyCodes.P) {
                this.level.pause();
            }
        });

    };
    LevelState.prototype = Object.create(_State);
    _LevelState = LevelState.prototype;

    _LevelState.getLevel = function () {
        return this.level;
    };

    _LevelState.getLevelStatistics = function () {
        return this.levelStatistics;
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


    LevelStatistics = function () {
        var lastRotation = { x : null, y : null}, rotations = 0,
            timePassed = 0, minimumRotationsRequired = 0,
            tilesLocked = 0, numConnectedTiles = 0, numTiles = 0;

        this.notify = function (notification, params) {
            switch (notification) {
            case GameUtil.Notifications.LevelStarted:
                minimumRotationsRequired = params.numTilesRandomized;
                numTiles = params.gridWidth * params.gridHeight;
                break;
            case GameUtil.Notifications.LevelPause:
                break;
            case GameUtil.Notifications.Update:
                timePassed += params.timePassed;
                numConnectedTiles = params.connectedTiles;
                break;
            case GameUtil.Notifications.TileRotate:
                if (params.x !== lastRotation.x || params.y !== lastRotation.y) {
                    rotations += 1;
                    lastRotation = params;
                }
                break;
            case GameUtil.Notifications.TileLock:
                tilesLocked += params.locked ? 1 : -1;
                break;
            }
        };

        this.getTimePassed = function () {
            return timePassed;
        };

        this.getMinimumRotationsRequired = function () {
            return minimumRotationsRequired;
        };

        this.getRotations = function () {
            return rotations;
        };

        this.getNumConnectedTiles = function () {
            return numConnectedTiles;
        };

        this.getNumTiles = function () {
            return numTiles;
        };
    };


}(GameState = GameState || {}));
