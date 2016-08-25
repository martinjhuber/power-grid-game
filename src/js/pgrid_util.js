/*** TD Util module - (c) mjh.at - v0.0.1 2016-08-10 ***/

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

}(GameUtil = GameUtil || {}));
