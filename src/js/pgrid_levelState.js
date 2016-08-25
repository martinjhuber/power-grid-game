/*** TD LevelState module - (c) mjh.at - v0.0.1 2016-08-10 ***/

var GameLevelState,
    GameUtil,
    Game,
    GameConfig;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var  _Tile;

    module.LevelState = function (width, height, wrap) {

        var constructor,
            // variables:
            grid = null;

        constructor = function () {
            var levelGenerator;

            levelGenerator = new module.LevelGenerator(width, height, wrap);

            grid = levelGenerator.generateTileGrid();

        };

        this.getGrid = function () {
            return grid;
        };

        constructor();

    };

    // ----

    module.LevelGenerator = function (width, height, wrap) {

        var constructor, generateGridPlan, getRandomUnvisitedNeighbor,
            generateTileGridFromPlan;

        constructor = function () {

        };

        generateGridPlan = function () {
            var plan, stack = [],
                midX = (width - 1) / 2, midY = (height - 1) / 2,
                currentCell, unvisitedCells = width * height,
                neighbor, neighborCell;

            plan = GameUtil.createMatrix(
                width,
                height,
                function (i, j) {
                    return {
                        x : i,
                        y : j,
                        visited : false,
                        connectors : [false, false, false, false]
                    };
                }
            );

            // https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_backtracker
            // 1.
            currentCell = plan[midX][midY];
            currentCell.visited = true;
            unvisitedCells -= 1;

            // 2.
            while (unvisitedCells > 0) {
                // 2.1. / 2.1.1
                neighbor = getRandomUnvisitedNeighbor(currentCell.x, currentCell.y, plan);
                if (neighbor !== null) {
                    neighborCell = plan[neighbor.x][neighbor.y];

                    // 2.1.2
                    stack.push(currentCell);

                    // 2.1.3
                    currentCell.connectors[neighbor.dir] = true;
                    neighborCell.connectors[(neighbor.dir + 2) % 4] = true;

                    // 2.1.4
                    currentCell = neighborCell;
                    neighborCell.visited = true;
                    unvisitedCells -= 1;

                // 2.2.
                } else if (stack.length > 0) {
                    // 2.2.1 / 2.2.2
                    currentCell = stack.pop();
                }
            }

            return plan;

        };


        getRandomUnvisitedNeighbor = function (i, j, plan) {
            var neighbors = [], unvisitedNeighbors = [], a, elem;

            // up
            if (j !== 0) {
                neighbors.push({ x : i, y : j - 1, dir : 0 });
            } else if (wrap) {
                neighbors.push({ x : i, y : height - 1, dir : 0 });
            }
            // right
            if (i !== width - 1) {
                neighbors.push({ x : i + 1, y : j, dir : 1 });
            } else if (wrap) {
                neighbors.push({ x : 0, y : j, dir : 1 });
            }
            // down
            if (j !== height - 1) {
                neighbors.push({ x : i, y : j + 1, dir : 2 });
            } else if (wrap) {
                neighbors.push({ x : i, y : 0, dir : 2 });
            }
            // left
            if (i !== 0) {
                neighbors.push({ x : i - 1, y : j, dir : 3 });
            } else if (wrap) {
                neighbors.push({ x : width - 1, y : j, dir : 3 });
            }

            for (a = 0; a < neighbors.length; a += 1) {
                elem = neighbors[a];
                if (!plan[elem.x][elem.y].visited) {
                    unvisitedNeighbors.push(elem);
                }
            }

            switch (unvisitedNeighbors.length) {
            case 0:
                return null;
            case 1:
                return unvisitedNeighbors[0];
            default:
                return unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
            }
        };

        generateTileGridFromPlan = function (plan) {
            var tileGrid, x, y,
                midX = (width - 1) / 2, midY = (height - 1) / 2;

            tileGrid = GameUtil.createMatrix(width, height, null);

            for (x = 0; x < plan.length; x += 1) {
                for (y = 0; y < plan[x].length; y += 1) {

                    tileGrid[x][y] = new module.Tile(
                        x,
                        y,
                        plan[x][y].connectors,
                        (x === midX && y === midY)
                    );

                }
            }

            return tileGrid;
        };

        this.generateTileGrid = function () {
            var plan, tileGrid;

            plan = generateGridPlan();
            tileGrid = generateTileGridFromPlan(plan);

            return tileGrid;
        };

        constructor();
    };

    // ----

    module.TileType = {
        PowerGenerator : "G",
        Consumer : "C",
        Line : "L"
    };

    module.Tile = function (x, y, connectors, isPowerGenerator) {

        var constructor, determineType,
            // variables:
            type;


        constructor = function () {
            determineType();
        };

        determineType = function () {
            var connectorCount = module.countConnectors(connectors);

            if (isPowerGenerator) {
                if (connectorCount === 1) {
                    type = module.TileType.PowerGenerator;
                } else {
                    console.error("PowerGenerator has multiple connectors:", x, y, connectors);
                }
            } else if (connectorCount === 1) {
                type = module.TileType.Consumer;
            } else if (connectorCount === 0) {
                console.error("Tile has no connectors:", x, y);
            } else {
                type = module.TileType.Line;
            }
        };

        this.getType = function () {
            return type;
        };

        this.getConnectors = function () {
            return connectors;
        };

        constructor();
    };


    module.countConnectors = function (connectors) {
        var i, count = 0;
        for (i = 0; i < connectors.length; i += 1) {
            if (connectors[i]) {
                count += 1;
            }
        }
        return count;
    };


}(GameLevelState = GameLevelState || {}));
