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

    isWallAt(worldX, worldY) {
        const mapX = Math.floor(worldX / this.tileSize);
        const mapY = Math.floor(worldY / this.tileSize);
        if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) {
            return true;
        }
        return this.map[mapY][mapX] === this.tileTypes.WALL;
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
