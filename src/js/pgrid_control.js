/*** PowerGridGame - Control module - (c) mjh.at - v0.0.1 ***/

var GameControl;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    module.ClickButtons = {
        Left : 1,
        Right : 2
    };

    module.ClickHandler = function () {

        var constructor, isInClickArea,
            clickAreas = [],
            keyHandlers = [];

        constructor = function () {

        };

        isInClickArea = function (clickArea, x, y) {
            return (x >= clickArea.x1 && x < clickArea.x2 &&
                    y >= clickArea.y1 && y < clickArea.y2);
        };

        this.click = function (button, x, y) {
            var i, area;

            for (i = 0; i < clickAreas.length; i += 1) {
                area = clickAreas[i];

                if (isInClickArea(area, x, y)) {
                    area.func(button);
                }
            }
        };

        this.keyPress = function (key) {
            var i, area;

            for (i = 0; i < keyHandlers.length; i += 1) {
                if (keyHandlers[i].key === key) {
                    keyHandlers[i].func();
                }
            }
        };

        this.addClickHandler = function (x1, y1, x2, y2, func) {
            clickAreas.push({
                x1 : x1,
                y1 : y1,
                x2 : x2,
                y2 : y2,
                func : func
            });
        };

        this.addKeyPressHandler = function (key, func) {
            keyHandlers.push({
                key : key,
                func : func
            });
        };

        constructor();
    };

    module.addEventListeners = function (gameState) {
        var canvas = document.getElementById("canvas");

        canvas.addEventListener(
            'click',
            function (event) {
                gameState.click(
                    GameControl.ClickButtons.Left,
                    event.pageX - this.offsetLeft,
                    event.pageY - this.offsetTop
                );
            },
            false
        );
        canvas.addEventListener(
            'contextmenu',
            function (event) {
                gameState.click(
                    GameControl.ClickButtons.Right,
                    event.pageX - this.offsetLeft,
                    event.pageY - this.offsetTop
                );
                event.preventDefault();
            },
            false
        );

    };

}(GameControl = GameControl || {}));
