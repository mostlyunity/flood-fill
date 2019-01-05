class PixelMatrix {
    constructor(transparentColor, defaultColor, calculatedMatrix) {
        this._matrix = [];
        this._transparency = transparentColor;
        this._originalColor = defaultColor;

        if (!!calculatedMatrix) {
            this._matrix = calculatedMatrix;
        }
    }

    value() { return this._matrix; }

    findColorAt(targetX, targetY) {
        if (targetY <= 0 || targetY >= this._matrix.length) {
            return null;
        }
        if (targetX <= 0 || targetX >= this._matrix[0].length) {
            return null;
        }

        return this._matrix[targetY][targetX];
    }

    findRegionWithColor(color) {
        const region = [];

        for (let y = 0; y < this._matrix.length; y++) {
            for (let x = 0; x < this._matrix[y].length; x++) {
                if (this._matrix[y][x] === color) {
                    region.push({ x: x, y: y });
                }
            }
        }

        return region;
    }

    restoreRegions(data) {
        let currentColor = this._originalColor;

        this._recalculate(data);

        for (let y = 0; y < this._matrix.length; y++) {
            for (let x = 0; x < this._matrix[y].length; x++) {
                if (this._matrix[y][x] !== this._originalColor) {
                    continue;
                }

                this._colorRegion(x, y, currentColor);

                currentColor++;
            }
        }
    }

    hasRegions() {
        let previousColor = this._transparency;

        for (let y = 0; y < this._matrix.length; y++) {
            for (let x = 0; x < this._matrix[y].length; x++) {
                if (this._matrix[y][x] === this._transparency) {
                    continue;
                } else if (previousColor === this._transparency) {
                    previousColor = this._matrix[y][x];
                } else if (previousColor > this._transparency && this._matrix[y][x] !== previousColor) {
                    return true;
                }
            }
        }

        return false;
    }

    _colorRegion(x, y, targetColor) {
        const queue = [[x, y]];
        const uniqueChecker = {};

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbours = this._getNeighbours(current[0], current[1], targetColor);

            this._matrix[current[1]][current[0]] = targetColor;

            for (let i = 0; i < neighbours.length; i++) {
                if (uniqueChecker[neighbours[i][0] + ':' + neighbours[i][1]] === true) {
                    continue;
                }

                uniqueChecker[neighbours[i][0] + ':' + neighbours[i][1]] = true;

                queue.push(neighbours[i]);
            }
        }
    }

    _recalculate(data) {
        this._matrix = [];

        for (let i = 0; i < data.data.length; i += data.width * 4) {
            const slice = data.data.slice(i, i + (data.width * 4));
            const row = [];

            for (let j = 0; j < slice.length; j += 4) {
                row.push(slice[j + 3] < 128 ? this._transparency : this._originalColor);
            }

            this._matrix.push(row);
        }
    }

    _neighboringCoordsFor(px, py) {
        const candidates = [];
        const h = this._matrix.length;
        const w = this._matrix[0].length;

        if (py - 1 >= 0) {
            candidates.push([px, py - 1]);
        }
        if (py - 1 >= 0 && px + 1 < w) {
            candidates.push([px + 1, py - 1]);
        }
        if (px + 1 < w) {
            candidates.push([px + 1, py]);
        }
        if (px + 1 < w && py + 1 < h) {
            candidates.push([px + 1, py + 1]);
        }
        if (py + 1 < h) {
            candidates.push([px, py + 1]);
        }
        if (px - 1 >= 0 && py + 1 < h) {
            candidates.push([px - 1, py + 1]);
        }
        if (px - 1 >= 0) {
            candidates.push([px - 1, py]);
        }
        if (px - 1 >= 0 && py - 1 >= 0) {
            candidates.push([px - 1, py - 1]);
        }

        const coords = candidates.filter(coord => {
            const x = coord[0];
            const y = coord[1];

            return this._matrix[y][x] !== this._transparency;
        });

        return coords;
    }

    _getNeighbours(x, y, targetColor) {
        const currentNeighbors = this._neighboringCoordsFor(x, y);
        const coloredNeighbors = currentNeighbors.filter(coords => 
            this._matrix[coords[1]][coords[0]] !== targetColor);

        return coloredNeighbors;
    }
}