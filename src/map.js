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

    // 크기가 서로 다른 유닛을 배치하기 위해 sizeInTiles 인자를 받음
    // sizeInTiles: {w: <가로 타일 수>, h: <세로 타일 수>}
    getRandomFloorPosition(sizeInTiles = { w: 1, h: 1 }) {
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * (this.width - sizeInTiles.w));
            const y = Math.floor(Math.random() * (this.height - sizeInTiles.h));

            let canPlace = true;
            for (let i = 0; i < sizeInTiles.w; i++) {
                for (let j = 0; j < sizeInTiles.h; j++) {
                    if (this.map[y + j][x + i] !== this.tileTypes.FLOOR) {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break;
            }

            if (canPlace) {
                return {
                    x: x * this.tileSize + (this.tileSize / 4),
                    y: y * this.tileSize + (this.tileSize / 4)
                };
            }
            attempts++;
        }
        // 적절한 위치를 찾지 못하면 null 반환
        return null;
    }

    // 유닛의 크기에 맞춰 네 모서리를 확인하도록 수정
    isWallAt(worldX, worldY, entityWidth = 0, entityHeight = 0) {
        const checkPoints = [
            { x: worldX, y: worldY },
            { x: worldX + entityWidth, y: worldY },
            { x: worldX, y: worldY + entityHeight },
            { x: worldX + entityWidth, y: worldY + entityHeight },
        ];

        for (const point of checkPoints) {
            const mapX = Math.floor(point.x / this.tileSize);
            const mapY = Math.floor(point.y / this.tileSize);

            if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) return true;
            if (this.map[mapY][mapX] === this.tileTypes.WALL) return true;
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
