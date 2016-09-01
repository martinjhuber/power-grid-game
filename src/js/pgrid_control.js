/*** PowerGridGame - Control module - (c) mjh.at - v0.0.1 ***/

var GameControl;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    module.MouseButtons = {
        Left : 1,
        Right : 2
    };

    module.KeyCodes = {
        Space : 32,
        L : 76,
        P : 80
    };

    module.InputHandler = function () {

        var constructor, isInArea,
            clickAreas = [],
            keyHandlers = [];

        constructor = function () {

        };

        isInArea = function (area, x, y) {
            return (x >= area.x1 && x < area.x2 &&
                    y >= area.y1 && y < area.y2);
        };

        this.click = function (button, x, y) {
            var i, area;

            for (i = 0; i < clickAreas.length; i += 1) {
                area = clickAreas[i];
                if (isInArea(area, x, y)) {
                    area.func(button);
                }
            }
        };

        this.keyPress = function (keyCode, x, y) {
            var i, area;

            for (i = 0; i < keyHandlers.length; i += 1) {
                area = keyHandlers[i];
                if (isInArea(area, x, y)) {
                    area.func(keyCode);
                }
            }
        };

        this.mouseOver = function (x, y) {
        };

        this.addClickHandler = function (x1, y1, x2, y2, func) {
            clickAreas.push({ x1 : x1, y1 : y1, x2 : x2, y2 : y2, func : func });
        };

        this.addKeyPressHandler = function (x1, y1, x2, y2, func) {
            keyHandlers.push({ x1 : x1, y1 : y1, x2 : x2, y2 : y2, func : func });
        };

        constructor();
    };

    module.addEventListeners = function (gameState) {
        var canvas = document.getElementById("canvas");

        canvas.addEventListener(
            'click',
            function (event) {
                gameState.click(
                    GameControl.MouseButtons.Left,
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
                    GameControl.MouseButtons.Right,
                    event.pageX - this.offsetLeft,
                    event.pageY - this.offsetTop
                );
                event.preventDefault();
            },
            false
        );
        canvas.addEventListener(
            'mousemove',
            function (event) {
                gameState.mouseOver(
                    event.pageX - this.offsetLeft,
                    event.pageY - this.offsetTop
                );
            },
            false
        );

        document.getElementsByTagName("body")[0].addEventListener(
            'keydown',
            function (event) {
                var keyCode = (event.keyCode || event.which);
                gameState.keyPress(keyCode);
                //event.preventDefault();
            },
            false
        );

    };

}(GameControl = GameControl || {}));
