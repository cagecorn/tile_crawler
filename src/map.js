// src/map.js

const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1,
};

export class MapManager {
    constructor() {
        this.width = 41; // 미로 크기를 더 키워서 넓은 통로를 확보
        this.height = 31;
        this.tileSize = 192;
        this.tileTypes = TILE_TYPES;
        this.rooms = [];
        this.map = this._generateMaze();
    }

    _generateMaze() {
        const corridorWidth = 2; // <<< 통로 너비를 여기서 쉽게 조절할 수 있습니다 (2 = 2타일 너비)

        // 1. 모든 타일을 벽으로 초기화
        const map = [];
        for (let y = 0; y < this.height; y++) {
            map.push(Array(this.width).fill(this.tileTypes.WALL));
        }

        // 2. 방 먼저 생성하기
        const roomCount = 8;
        const minRoomSize = 3;
        const maxRoomSize = 5;

        for (let i = 0; i < roomCount; i++) {
            let roomW = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            let roomH = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            let roomX = Math.floor(Math.random() * (this.width - roomW - 2)) + 1;
            let roomY = Math.floor(Math.random() * (this.height - roomH - 2)) + 1;

            // 방끼리 겹치지 않게 하기 (간단한 방식)
            let overlaps = false;
            for (const room of this.rooms) {
                if (roomX < room.x + room.width && roomX + roomW > room.x &&
                    roomY < room.y + room.height && roomY + roomH > room.y) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) continue;

            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    map[y][x] = this.tileTypes.FLOOR;
                }
            }
            this.rooms.push({ x: roomX, y: roomY, width: roomW, height: roomH });
        }
        
        // 3. 방과 방 사이를 넓은 통로로 잇기
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const start = this.rooms[i];
            const end = this.rooms[i + 1];

            const startX = Math.floor(start.x + start.width / 2);
            const startY = Math.floor(start.y + start.height / 2);
            const endX = Math.floor(end.x + end.width / 2);
            const endY = Math.floor(end.y + end.height / 2);

            this._carvePassage(map, startX, startY, endX, startY, corridorWidth);
            this._carvePassage(map, endX, startY, endX, endY, corridorWidth);
        }

        return map;
    }

    // 두 지점 사이에 넓은 통로를 만드는 헬퍼 함수
    _carvePassage(map, x1, y1, x2, y2, width) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        // 가로 통로
        if (minY === maxY) {
            for (let x = minX; x <= maxX; x++) {
                for (let w = 0; w < width; w++) {
                    if (map[minY + w]) map[minY + w][x] = this.tileTypes.FLOOR;
                }
            }
        }
        // 세로 통로
        else if (minX === maxX) {
            for (let y = minY; y <= maxY; y++) {
                for (let w = 0; w < width; w++) {
                    if (map[y][minX + w]) map[y][minX + w] = this.tileTypes.FLOOR;
                }
            }
        }
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

