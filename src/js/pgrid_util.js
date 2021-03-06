/*** PowerGridGame - GameUtil module - (c) mjh.at - v0.0.1 ***/

var GameUtil;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var DEBUG = true;

    module.log = function () {
        if (DEBUG) {
            console.log(arguments);
        }
    };

    module.createMatrix = function (countI, countJ, valueFunc) {
        var i, j, result = [];

        for (i = 0; i < countI; i += 1) {
            result[i] = [];
            for (j = 0; j < countJ; j += 1) {
                result[i][j] = valueFunc === null ? null : valueFunc(i, j);
            }
        }

        return result;
    };

    module.shuffleArray = function (array) {
        var i, j, temp;
        for (i = array.length - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    };

    module.Observers = function () {
        var observers = [];

        this.registerObserver = function (observer) {
            observers.push(observer);
        };

        this.notify = function (notification, params) {
            var i;
            for (i = 0; i < observers.length; i += 1) {
                observers[i].notify(notification, params);
            }
        };
    };

    module.Notifications = {
        LevelStarted : 1,
        LevelPause: 2,
        Update : 10,
        TileRotate : 11,
        TileLock : 12
    };

}(GameUtil = GameUtil || {}));
