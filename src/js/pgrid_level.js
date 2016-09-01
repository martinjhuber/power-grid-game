/*** PowerGridGame - LevelState module - (c) mjh.at - v0.0.1 ***/

var GameLevel,
    GameUtil,
    Game,
    GameConfig;

/*jslint devel: true, browser: true, nomen: true*/
(function (module) {
    "use strict";

    var _Tile, _Consumer, _TileI, _TileL, _TileY, _TileX,
        countConnectors, tileGenerator;

    module.Level = function (gridWidth, gridHeight, wrap) {

        var constructor, updateTiles, updateConnectionStatus,
            // variables:
            tileGrid = null, powerPlant = null, pause = false, numTilesRandomized = 0,
            observers = new GameUtil.Observers();

        constructor = function () {
            var levelGenerator, tileGridResult, x, y;
            levelGenerator = new module.LevelGenerator(gridWidth, gridHeight, wrap);
            tileGridResult = levelGenerator.generateTileGrid();

            tileGrid = tileGridResult.grid;
            powerPlant = tileGridResult.powerPlant;
            numTilesRandomized = tileGridResult.numTilesRotated;
        };

        this.start = function () {
            observers.notify(GameUtil.Notifications.LevelStarted, {
                gridWidth : gridWidth,
                gridHeight : gridHeight,
                numTilesRandomized : numTilesRandomized
            });
        };

        this.getTileGrid = function () {
            return tileGrid;
        };

        this.isWrap = function () {
            return wrap;
        };

        updateTiles = function (timePassed) {
            var x, y;
            for (x = 0; x < gridWidth; x += 1) {
                for (y = 0; y < gridHeight; y += 1) {
                    tileGrid[x][y].update(timePassed);
                    tileGrid[x][y].tileState = module.TileStates.NotConnected;
                }
            }
        };

        updateConnectionStatus = function () {
            var stack = [powerPlant], currentTile,
                neighborTiles, connections, neighborTile, n,
                connectedTiles = 0;

            while (stack.length > 0) {
                currentTile = stack.pop();
                currentTile.tileState = module.TileStates.Connected;
                connectedTiles += 1;
                connections = currentTile.connectsWith();
                neighborTiles = currentTile.neighbors;

                for (n = 0; n < neighborTiles.length; n += 1) {
                    neighborTile = neighborTiles[n];

                    if (neighborTile !== null &&
                            neighborTile.tileState !== module.TileStates.Connected &&
                            connections[n] === true &&
                            neighborTile.connectsWith()[(n + 2) % 4] === true) {

                        stack.push(neighborTile);
                    }
                }
            }

            return connectedTiles;
        };

        this.rotateTileLeft = function (x, y) {
            tileGrid[x][y].rotateLeft();
            observers.notify(GameUtil.Notifications.TileRotate, {
                x : x,
                y : y,
                direction : -1
            });
        };

        this.rotateTileRight = function (x, y) {
            tileGrid[x][y].rotateRight();
            observers.notify(GameUtil.Notifications.TileRotate, {
                x : x,
                y : y,
                direction : 1
            });
        };

        this.lock = function (x, y) {
            var tile = tileGrid[x][y];
            tile.locked = !tile.locked;
            observers.notify(GameUtil.Notifications.TileLock, {
                x : x,
                y : y,
                locked : tile.locked
            });
        };

        this.pause = function () {
            pause = !pause;
            observers.notify(GameUtil.Notifications.LevelPause, { pause : pause });
        };

        this.update = function (timePassed) {
            var connectedTiles;
            updateTiles(timePassed);
            connectedTiles = updateConnectionStatus();
            observers.notify(GameUtil.Notifications.Update, {
                timePassed : timePassed,
                connectedTiles : connectedTiles
            });
        };

        this.registerObserver = function (observer) {
            observers.registerObserver(observer);
        };

        constructor();

    };

    module.Direction = {
        N : { i : 0, xdiff : 0, ydiff : -1 },
        E : { i : 1, xdiff : 1, ydiff : 0 },
        S : { i : 2, xdiff : 0, ydiff : 1 },
        W : { i : 3, xdiff : -1, ydiff : 0 }
    };
    module.Direction.N.opposite = module.Direction.S;
    module.Direction.E.opposite = module.Direction.W;
    module.Direction.S.opposite = module.Direction.N;
    module.Direction.W.opposite = module.Direction.E;

    // ----

    module.LevelGenerator = function (gridWidth, gridHeight, wrap) {

        var constructor, generateGridPlanReverseBackTracking, generateGridPlanKruskal,
            getRandomUnvisitedNeighbor, generateTileGridFromPlan,
            calcNeighborCell, getNeighborCells, rotateTilesRandomly;

        constructor = function () {

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
                gridWidth,
                gridHeight,
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
            for (i = 0; i < gridWidth; i += 1) {
                for (j = 0; j < gridHeight; j += 1) {
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
                neighbor = calcNeighborCell(edge.x, edge.y, edge.direction);
                neighborCell = plan[neighbor.x][neighbor.y];

                if (!cell.tree.isConnected(neighborCell.tree)) {
                    cell.tree.connect(neighborCell.tree);

                    cell.connectors[edge.direction.i] = true;
                    neighborCell.connectors[neighbor.direction.opposite.i] = true;
                }
            }

            return plan;

        };

        generateGridPlanReverseBackTracking = function () {
            var plan, stack = [],
                midX = (gridWidth - 1) / 2, midY = (gridHeight - 1) / 2,
                currentCell, unvisitedCells = gridWidth * gridHeight,
                neighbor, neighborCell;

            plan = GameUtil.createMatrix(
                gridWidth,
                gridHeight,
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
                    neighborCell.connectors[neighbor.direction.opposite.i] = true;
                    currentCell.connectors[neighbor.direction.i] = true;

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

            neighbors = getNeighborCells(i, j);

            for (a = 0; a < neighbors.length; a += 1) {
                elem = neighbors[a];
                if (elem !== null && !plan[elem.x][elem.y].visited) {
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
            var tileGrid, x, y, n,
                midX = (gridWidth - 1) / 2, midY = (gridHeight - 1) / 2,
                neighborCells, neighborCell;

            tileGrid = GameUtil.createMatrix(gridWidth, gridHeight, null);

            // Create tile grid
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

            // Set neighbors of each tile
            for (x = 0; x < plan.length; x += 1) {
                for (y = 0; y < plan[x].length; y += 1) {
                    neighborCells = getNeighborCells(x, y);
                    for (n = 0; n < neighborCells.length; n += 1) {
                        neighborCell = neighborCells[n];
                        if (neighborCell !== null) {
                            tileGrid[x][y].neighbors[n] =
                                tileGrid[neighborCell.x][neighborCell.y];
                        }
                    }
                }
            }

            return { grid : tileGrid, powerPlant : tileGrid[midX][midY], numTilesRotated : 0 };
        };

        rotateTilesRandomly = function (tileGrid) {
            var x, y, tile, numTilesRotated = 0;

            for (x = 0; x < tileGrid.length; x += 1) {
                for (y = 0; y < tileGrid[x].length; y += 1) {
                    tile = tileGrid[x][y];
                    tile.rotation = Math.floor(Math.random() * 4) * 90;
                    tile.rotationGoal = tile.rotation;
                    if (!tile.hasCorrectOrientation()) {
                        numTilesRotated += 1;
                    }
                }
            }

            return numTilesRotated;
        };

        this.generateTileGrid = function () {
            var plan, tileGridResult;

            //plan = generateGridPlanReverseBackTracking();
            plan = generateGridPlanKruskal();
            tileGridResult = generateTileGridFromPlan(plan);
            tileGridResult.numTilesRotated = rotateTilesRandomly(tileGridResult.grid);

            return tileGridResult;
        };

        calcNeighborCell = function (x, y, direction) {
            x += direction.xdiff;
            y += direction.ydiff;

            if (x < 0) {
                x = gridWidth - 1;
            } else if (x >= gridWidth) {
                x = 0;
            }
            if (y < 0) {
                y = gridHeight - 1;
            } else if (y >= gridHeight) {
                y = 0;
            }

            return { x : x, y : y, direction : direction };
        };

        getNeighborCells = function (x, y) {
            var neighbors = [null, null, null, null];
            if (y !== 0 || wrap) {
                neighbors[0] = calcNeighborCell(x, y, module.Direction.N);
            }
            if (x !== gridWidth - 1 || wrap) {
                neighbors[1] = calcNeighborCell(x, y, module.Direction.E);
            }
            if (y !== gridHeight - 1 || wrap) {
                neighbors[2] = calcNeighborCell(x, y, module.Direction.S);
            }
            if (x !== 0 || wrap) {
                neighbors[3] = calcNeighborCell(x, y, module.Direction.W);
            }
            return neighbors;
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
        this.startRotation = 0;
        this.type = null;
        this.isPowerPlant = isPowerPlant;
        this.tileState = module.TileStates.NotConnected;
        this.neighbors = [null, null, null, null];

        this.locked = false;
        this.rotationGoal = 0;
    };
    _Tile = module.Tile.prototype;

    _Tile.update = function (timePassed) {
        var degrees, diff;

        if (this.rotation !== this.rotationGoal) {
            diff = Math.abs(this.rotationGoal - this.rotation);
            degrees = Math.min(GameConfig.grid.rotatePerSec * timePassed, diff);

            if (this.rotation > this.rotationGoal) {
                this.rotation -= degrees;
            } else {
                this.rotation += degrees;
            }
        }
    };

    _Tile.rotateLeft = function () {
        if (!this.locked) {
            this.rotationGoal -= 90;
        }
    };

    _Tile.rotateRight = function () {
        if (!this.locked) {
            this.rotationGoal += 90;
        }
    };

    _Tile.connectsWith = function () {
        return [false, false, false, false];
    };

    _Tile.getNormalizedRotation = function () {
        var rot = this.rotation % 360;
        if (rot < 0) {
            rot += 360;
        }
        return rot;
    };

    _Tile.setRotation = function (rotation) {
        this.rotation = rotation;
        this.rotationGoal = rotation;
        this.startRotation = rotation;
    };

    _Tile.hasCorrectOrientation = function () {
        return this.getNormalizedRotation() === this.startRotation;
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
        this.setRotation(i * 90);

        this.tileState = module.TileStates.NotConnected;
    };
    module.Consumer.prototype = Object.create(_Tile);
    _Consumer = module.Consumer.prototype;

    _Consumer.connectsWith = function () {
        var connectors = [false, false, false, false],
            rot = this.getNormalizedRotation();

        if (rot === 0) {
            connectors[0] = true;
        } else if (rot === 90) {
            connectors[1] = true;
        } else if (rot === 180) {
            connectors[2] = true;
        } else if (rot === 270) {
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
            this.setRotation(90);
        }
    };
    module.TileI.prototype = Object.create(_Tile);
    _TileI = module.TileI.prototype;

    _TileI.connectsWith = function () {
        var connectors = [false, false, false, false],
            rot180 = this.getNormalizedRotation() % 180;

        if (rot180 === 0) {
            connectors[0] = connectors[2] = true;
        } else if (rot180 === 90) {
            connectors[1] = connectors[3] = true;
        }
        return connectors;
    };

    _TileI.hasCorrectOrientation = function () {
        return (this.getNormalizedRotation() % 180) === this.startRotation;
    };

    // TileL
    // Two connectors in an L shape
    // Rotation = 0 if the connector is N+E
    module.TileL = function (x, y, connectors, isPowerPlant) {
        module.Tile.call(this, x, y, isPowerPlant);
        this.type = module.TileType.L;

        if (connectors[1] && connectors[2]) {
            this.setRotation(90);
        } else if (connectors[2] && connectors[3]) {
            this.setRotation(180);
        } else if (connectors[3] && connectors[0]) {
            this.setRotation(270);
        }
    };
    module.TileL.prototype = Object.create(_Tile);
    _TileL = module.TileL.prototype;

    _TileL.connectsWith = function () {
        var connectors = [false, false, false, false],
            rot = this.getNormalizedRotation();
        connectors[0] = (rot === 0 || rot === 270);
        connectors[1] = (rot === 0 || rot === 90);
        connectors[2] = (rot === 90 || rot === 180);
        connectors[3] = (rot === 180 || rot === 270);
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
        this.setRotation(((i + 2) % 4) * 90);
    };
    module.TileY.prototype = Object.create(_Tile);
    _TileY = module.TileY.prototype;

    _TileY.connectsWith = function () {
        var rot = this.getNormalizedRotation();
        if (rot === 0) {
            return [true, true, false, true];
        } else if (rot === 90) {
            return [true, true, true, false];
        } else if (rot === 180) {
            return [false, true, true, true];
        } else if (rot === 270) {
            return [true, false, true, true];
        }
        return [false, false, false, false];
    };

    // TileX
    // Four connectors
    // Rotation = 0, always at the beginning
    module.TileX = function (x, y, connectors, isPowerPlant) {
        module.Tile.call(this, x, y, isPowerPlant);
        this.type = module.TileType.X;
    };
    module.TileX.prototype = Object.create(_Tile);
    _TileX = module.TileX.prototype;

    _TileX.connectsWith = function () {
        var rot = this.getNormalizedRotation();
        if (rot % 90 === 0) {
            return [true, true, true, true];
        }
        return [false, false, false, false];
    };

    _TileX.hasCorrectOrientation = function () {
        return true;
    };

}(GameLevel = GameLevel || {}));
