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

        var constructor, generateGridPlanReverseBackTracking, generateGridPlanKruskal,
            calcNeighbor,
            getRandomUnvisitedNeighbor, generateTileGridFromPlan;

        constructor = function () {

        };

        module.Direction = {
            N : 0,
            E : 1,
            S : 2,
            W : 3
        };

        generateGridPlanKruskal = function () {
            var plan, Tree, edges, edge, i, j, cell, neighbor, neighborCell;

            Tree = function () {
                this.parent = null;

                this.getRoot = function () {
                    return this.parent === null ? this : this.parent.getRoot();
                };
                this.isConnected = function (otherTree) {
                    return this.getRoot() === otherTree.getRoot();
                };
                this.connect = function (otherTree) {
                    otherTree.getRoot().parent = this;
                };
            };

            plan = GameUtil.createMatrix(
                width,
                height,
                function (i, j) {
                    return {
                        x : i,
                        y : j,
                        tree : new Tree(),
                        connectors : [false, false, false, false]
                    };
                }
            );

            edges = [];
            for (i = 0; i < width; i += 1) {
                for (j = 0; j < height; j += 1) {
                    if (wrap || j > 0) {
                        edges.push({ x : i, y : j, direction : module.Direction.N });
                    }
                    if (wrap || i > 0) {
                        edges.push({ x : i, y : j, direction : module.Direction.W });
                    }
                }
            }

            GameUtil.shuffleArray(edges);

            while (edges.length > 0) {
                edge = edges.pop();
                cell = plan[edge.x][edge.y];
                neighbor = calcNeighbor(edge.x, edge.y, edge.direction);
                neighborCell = plan[neighbor.x][neighbor.y];

                if (!cell.tree.isConnected(neighborCell.tree)) {
                    cell.tree.connect(neighborCell.tree);

                    cell.connectors[edge.direction] = true;
                    neighborCell.connectors[neighbor.direction] = true;
                }
            }

            return plan;

        };

        generateGridPlanReverseBackTracking = function () {
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
                    neighborCell.connectors[neighbor.direction] = true;
                    currentCell.connectors[(neighbor.direction + 2) % 4] = true;

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

        calcNeighbor = function (x, y, direction) {
            if (direction === module.Direction.N) {
                y -= 1;
            } else if (direction === module.Direction.W) {
                x -= 1;
            } else if (direction === module.Direction.E) {
                x += 1;
            } else if (direction === module.Direction.S) {
                y += 1;
            }

            if (x < 0) {
                x = width - 1;
            } else if (x >= width) {
                x = 0;
            }
            if (y < 0) {
                y = height - 1;
            } else if (y >= height) {
                y = 0;
            }

            return { x : x, y : y, direction : (direction + 2) % 4 };
        };

        getRandomUnvisitedNeighbor = function (i, j, plan) {
            var neighbors = [], unvisitedNeighbors = [], a, elem;

            if (j !== 0 || wrap) {
                neighbors.push(calcNeighbor(i, j, module.Direction.N));
            }
            if (i !== width - 1 || wrap) {
                neighbors.push(calcNeighbor(i, j, module.Direction.E));
            }
            if (j !== height - 1 || wrap) {
                neighbors.push(calcNeighbor(i, j, module.Direction.S));
            }
            if (i !== 0 || wrap) {
                neighbors.push(calcNeighbor(i, j, module.Direction.W));
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

            //plan = generateGridPlanReverseBackTracking();
            plan = generateGridPlanKruskal();
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
                type = module.TileType.PowerGenerator;
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
