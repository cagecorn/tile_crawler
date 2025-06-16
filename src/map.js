// src/map.js

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
        this.rooms = []; // 생성된 방의 정보를 저장할 배열
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

        const roomCount = 4;
        for (let i = 0; i < roomCount; i++) {
            const roomWidth = Math.floor(Math.random() * 3) + 3;
            const roomHeight = Math.floor(Math.random() * 3) + 3;
            const roomX = Math.floor(Math.random() * (this.width - roomWidth - 1) / 2) * 2 + 1;
            const roomY = Math.floor(Math.random() * (this.height - roomHeight - 1) / 2) * 2 + 1;
            for (let y = roomY; y < roomY + roomHeight; y++) {
                for (let x = roomX; x < roomX + roomWidth; x++) {
                    map[y][x] = this.tileTypes.FLOOR;
                }
            }
            this.rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });
        }
        
        return map;
    }
    
    getRandomFloorPosition(sizeInTiles = {w: 1, h: 1}) {
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
                    x: x * this.tileSize,
                    y: y * this.tileSize
                };
            }
            attempts++;
        }
        return null;
    }

    isWallAt(worldX, worldY, entityWidth = 0, entityHeight = 0) {
        const checkPoints = [
            {x: worldX, y: worldY}, {x: worldX + entityWidth, y: worldY},
            {x: worldX, y: worldY + entityHeight}, {x: worldX + entityWidth, y: worldY + entityHeight},
        ];
        for (const point of checkPoints) {
            const mapX = Math.floor(point.x / this.tileSize);
            const mapY = Math.floor(point.y / this.tileSize);
            if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) return true;
            if (this.map[mapY][mapX] === this.tileTypes.WALL) return true;
        }
        return false;
    }

    render(ctx, assets) {
        const wallImage = assets.wall;
        const floorImage = assets.floor;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const imageToDraw = (this.map[y][x] === this.tileTypes.WALL) ? wallImage : floorImage;
                if (imageToDraw) {
                    ctx.drawImage(imageToDraw, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }
}
