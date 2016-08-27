/*** TD LevelState module - (c) mjh.at - v0.0.1 2016-08-10 ***/

var GameLevelState,
    GameUtil,
    Game,
    GameConfig;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var _Tile, _Consumer, _TileI, _TileL, _TileY, _TileX,
        countConnectors, tileGenerator;

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

        this.isWrap = function () {
            return wrap;
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

                    tileGrid[x][y] = tileGenerator(
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

    countConnectors = function (connectors) {
        var i, count = 0;
        for (i = 0; i < connectors.length; i += 1) {
            if (connectors[i]) {
                count += 1;
            }
        }
        return count;
    };

    tileGenerator = function (x, y, connectors, isPowerPlant) {
        var connectorCount = countConnectors(connectors),
            Func;

        switch (connectorCount) {
        case 2:
            if ((connectors[0] && connectors[2]) || (connectors[1] && connectors[3])) {
                Func = module.TileI;
            } else {
                Func = module.TileL;
            }
            break;
        case 1:
            Func = module.Consumer;
            break;
        case 3:
            Func = module.TileY;
            break;
        case 4:
            Func = module.TileX;
            break;
        default:
            console.error("Tile has no connectors:", x, y);
            return null;
        }

        return new Func(x, y, connectors, isPowerPlant);
    };

    // ----

    module.TileType = {
        Consumer : "C",
        I : "I",
        L : "L",
        Y : "Y",
        X : "X"
    };

    module.TileStates = {
        Connected : "C",
        NotConnected : "N"
    };

    // ----

    // Generic TILE
    module.Tile = function (x, y, isPowerPlant) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.type = null;
        this.isPowerPlant = isPowerPlant;

        this.rotationGoal = 0;
    };
    _Tile = module.Tile.prototype;

    _Tile.update = function (timePassed) {
        if (this.rotation !== this.rotationGoal) {

            // TODO: make rotation dependent on timePassed
            if (this.rotation > this.rotationGoal) {
                this.rotation -= 0.5;
            } else {
                this.rotation += 0.5;
            }

        }
    };

    _Tile.rotateLeft = function () {
        this.rotationGoal -= 90;
    };

    _Tile.rotateRight = function () {
        this.rotationGoal += 90;
    };

    _Tile.connectsWith = function () {
        return [false, false, false, false];
    };

    // CONSUMER
    // Just one connector
    // Rotation = 0 if the connector is N
    module.Consumer = function (x, y, connectors, isPowerPlant) {
        var i;

        module.Tile.call(this, x, y, isPowerPlant);
        this.type = module.TileType.Consumer;

        for (i = 0; i < connectors.length; i += 1) {
            if (connectors[i]) {
                break;
            }
        }
        this.rotation = i * 90;
        this.rotationGoal = this.rotation;

        this.state = module.TileStates.NotConnected;
    };
    module.Consumer.prototype = Object.create(_Tile);
    _Consumer = module.Consumer.prototype;

    _Consumer.connectsWith = function () {
        var connectors = [false, false, false, false];
        if (this.rotation === 0) {
            connectors[0] = true;
        } else if (this.rotation === 90) {
            connectors[1] = true;
        } else if (this.rotation === 180) {
            connectors[2] = true;
        } else if (this.rotation === 270) {
            connectors[3] = true;
        }
        return connectors;
    };

    // TileI
    // Two connectors on opposite sides
    // Rotation = 0 or 180 if the connector is N+S
    module.TileI = function (x, y, connectors, isPowerPlant) {
        module.Tile.call(this, x, y, isPowerPlant);
        this.type = module.TileType.I;

        if (connectors[1]) {
            this.rotation = 90;
        }
        this.rotationGoal = this.rotation;
    };
    module.TileI.prototype = Object.create(_Tile);
    _TileI = module.TileI.prototype;

    _TileI.connectsWith = function () {
        var connectors = [false, false, false, false];
        if (this.rotation === 0 || this.rotation === 180) {
            connectors[0] = connectors[2] = true;
        } else if (this.rotation === 90) {
            connectors[1] = connectors[3] = true;
        }
        return connectors;
    };

    // TileL
    // Two connectors in an L shape
    // Rotation = 0 if the connector is N+E
    module.TileL = function (x, y, connectors, isPowerPlant) {
        module.Tile.call(this, x, y, isPowerPlant);
        this.type = module.TileType.L;

        if (connectors[1] && connectors[2]) {
            this.rotation = 90;
        } else if (connectors[2] && connectors[3]) {
            this.rotation = 180;
        } else if (connectors[3] && connectors[0]) {
            this.rotation = 270;
        }
        this.rotationGoal = this.rotation;
    };
    module.TileL.prototype = Object.create(_Tile);
    _TileL = module.TileL.prototype;

    _TileL.connectsWith = function () {
        var connectors = [false, false, false, false];
        connectors[0] = (this.rotation === 0 || this.rotation === 270);
        connectors[1] = (this.rotation === 0 || this.rotation === 90);
        connectors[2] = (this.rotation === 90 || this.rotation === 180);
        connectors[3] = (this.rotation === 180 || this.rotation === 270);
        return connectors;
    };

    // TileY
    // Three connectors
    // Rotation = 0 if the connector is N+E+W
    module.TileY = function (x, y, connectors, isPowerPlant) {
        var i;

        module.Tile.call(this, x, y, isPowerPlant);
        this.type = module.TileType.Y;

        for (i = 0; i < connectors.length; i += 1) {
            if (!connectors[i]) {
                break;
            }
        }
        this.rotation = ((i + 2) % 4) * 90;
        this.rotationGoal = this.rotation;
    };
    module.TileY.prototype = Object.create(_Tile);
    _TileY = module.TileY.prototype;

    _TileY.connectsWith = function () {
        if (this.rotation === 0) {
            return [true, true, false, true];
        } else if (this.rotation === 90) {
            return [true, true, true, false];
        } else if (this.rotation === 180) {
            return [false, true, true, true];
        } else if (this.rotation === 270) {
            return [true, false, true, true];
        }
        return [false, false, false, false];
    };

    // TileX
    // Three connectors
    // Rotation = 0, always at the beginning
    module.TileX = function (x, y, connectors, isPowerPlant) {
        module.Tile.call(this, x, y, isPowerPlant);
        this.type = module.TileType.X;

        this.rotation = 0;
        this.rotationGoal = this.rotation;
    };
    module.TileX.prototype = Object.create(_Tile);
    _TileX = module.TileY.prototype;

    _TileX.connectsWith = function () {
        if (this.rotation % 90 === 0) {
            return [true, true, true, true];
        }
        return false;
    };

}(GameLevelState = GameLevelState || {}));
