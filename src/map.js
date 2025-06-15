const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1,
};

export class MapManager {
    constructor() {
        this.width = 21;
        this.height = 17;
        this.tileSize = 48;
        this.tileTypes = TILE_TYPES;
        this.map = this._generateMaze();
    }

    _generateMaze() {
        const map = [];
        for (let y = 0; y < this.height; y++) {
            map.push(Array(this.width).fill(this.tileTypes.WALL));
        }
        const stack = [];
        const visited = Array.from({ length: this.height }, () => Array(this.width).fill(false));
        let startX = 1, startY = 1;
        map[startY][startX] = this.tileTypes.FLOOR;
        visited[startY][startX] = true;
        stack.push({ x: startX, y: startY });
        while (stack.length > 0) {
            const current = stack.pop();
            const directions = [{ x: 0, y: -2 }, { x: 0, y: 2 }, { x: -2, y: 0 }, { x: 2, y: 0 }];
            directions.sort(() => Math.random() - 0.5);
            const neighbors = [];
            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1 && !visited[ny][nx]) {
                    neighbors.push({ x: nx, y: ny, wallX: current.x + dir.x / 2, wallY: current.y + dir.y / 2 });
                }
            }
            if (neighbors.length > 0) {
                stack.push(current);
                const next = neighbors[0];
                map[next.wallY][next.wallX] = this.tileTypes.FLOOR;
                map[next.y][next.x] = this.tileTypes.FLOOR;
                visited[next.y][next.x] = true;
                stack.push(next);
            }
        }
        return map;
    }

    getRandomFloorPosition() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.width);
            y = Math.floor(Math.random() * this.height);
        } while (this.map[y][x] !== this.tileTypes.FLOOR || (x <= 1 && y <= 1));

        return {
            x: x * this.tileSize + (this.tileSize / 4),
            y: y * this.tileSize + (this.tileSize / 4)
        };
    }

    /**
     * Check whether the given position collides with a wall.
     *
     * When `width` and `height` are provided the check will be performed for
     * all four corners of the bounding box defined by `(worldX, worldY)` and
     * `(width, height)`. This allows callers to test sprite bounds in a single
     * call.
     */
    isWallAt(worldX, worldY, width = 0, height = 0) {
        const points = [
            { x: worldX, y: worldY },
            { x: worldX + width, y: worldY },
            { x: worldX, y: worldY + height },
            { x: worldX + width, y: worldY + height }
        ];

        for (const p of points) {
            const mapX = Math.floor(p.x / this.tileSize);
            const mapY = Math.floor(p.y / this.tileSize);
            if (
                mapX < 0 ||
                mapX >= this.width ||
                mapY < 0 ||
                mapY >= this.height ||
                this.map[mapY][mapX] === this.tileTypes.WALL
            ) {
                return true;
            }
        }
        return false;
    }

    render(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                ctx.fillStyle = (this.map[y][x] === this.tileTypes.WALL) ? '#555' : '#222';
                ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
}
