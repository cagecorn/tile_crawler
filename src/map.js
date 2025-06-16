// src/map.js

const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1,
};

export class MapManager {
    constructor() {
        this.width = 41;
        this.height = 31;
        this.tileSize = 192;
        this.tileTypes = TILE_TYPES;
        this.rooms = [];
        this.map = this._generateMaze();
    }

    _generateMaze() {
        const map = Array.from({ length: this.height }, () => Array(this.width).fill(this.tileTypes.WALL));

        // 1. 방 생성
        const roomCount = 10;
        const minRoomSize = 3;
        const maxRoomSize = 7;
        for (let i = 0; i < roomCount; i++) {
            let roomW = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            let roomH = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            let roomX = Math.floor(Math.random() * (this.width - roomW - 2)) + 1;
            let roomY = Math.floor(Math.random() * (this.height - roomH - 2)) + 1;

            let overlaps = this.rooms.some(room =>
                roomX < room.x + room.width && roomX + roomW > room.x &&
                roomY < room.y + room.height && roomY + roomH > room.y
            );
            if (overlaps) continue;

            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    map[y][x] = this.tileTypes.FLOOR;
                }
            }
            this.rooms.push({ x: roomX, y: roomY, width: roomW, height: roomH, connected: false });
        }

        // 2. 미로 생성 (방이 없는 공간만)
        for (let y = 1; y < this.height; y += 2) {
            for (let x = 1; x < this.width; x += 2) {
                if (map[y][x] === this.tileTypes.WALL) {
                    this._carveMazeFrom(x, y, map);
                }
            }
        }
        
        // 3. 방과 미로 연결
        this._connectRoomsAndMazes(map);
        
        // 4. 막다른 길 일부 제거 (선택적)
        this._removeDeadEnds(map, 0.4); // 40%의 막다른 길을 제거

        return map;
    }

    _carveMazeFrom(startX, startY, map) {
        const stack = [{ x: startX, y: startY }];
        map[startY][startX] = this.tileTypes.FLOOR;
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const directions = [{ x: 0, y: -2 }, { x: 0, y: 2 }, { x: -2, y: 0 }, { x: 2, y: 0 }];
            directions.sort(() => Math.random() - 0.5);
            
            let moved = false;
            for (const dir of directions) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                if (nx > 0 && nx < this.width && ny > 0 && ny < this.height && map[ny][nx] === this.tileTypes.WALL) {
                    map[ny - dir.y / 2][nx - dir.x / 2] = this.tileTypes.FLOOR;
                    map[ny][nx] = this.tileTypes.FLOOR;
                    stack.push({ x: nx, y: ny });
                    moved = true;
                    break;
                }
            }
            if (!moved) {
                stack.pop();
            }
        }
    }
    
    _connectRoomsAndMazes(map) {
        for (const room of this.rooms) {
            const potentialConnectors = [];
            for (let x = room.x - 1; x < room.x + room.width + 1; x++) {
                if (map[room.y - 2] && map[room.y - 2][x] === this.tileTypes.FLOOR) potentialConnectors.push({x, y: room.y - 1});
                if (map[room.y + room.height + 1] && map[room.y + room.height + 1][x] === this.tileTypes.FLOOR) potentialConnectors.push({x, y: room.y + room.height});
            }
            for (let y = room.y - 1; y < room.y + room.height + 1; y++) {
                if (map[y][room.x - 2] === this.tileTypes.FLOOR) potentialConnectors.push({x: room.x - 1, y});
                if (map[y][room.x + room.width + 1] === this.tileTypes.FLOOR) potentialConnectors.push({x: room.x + room.width, y});
            }
            if (potentialConnectors.length > 0) {
                const connector = potentialConnectors[Math.floor(Math.random() * potentialConnectors.length)];
                map[connector.y][connector.x] = this.tileTypes.FLOOR;
            }
        }
    }
    
    _removeDeadEnds(map, chance) {
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (map[y][x] === this.tileTypes.FLOOR) {
                    let wallCount = 0;
                    if (map[y - 1][x] === this.tileTypes.WALL) wallCount++;
                    if (map[y + 1][x] === this.tileTypes.WALL) wallCount++;
                    if (map[y][x - 1] === this.tileTypes.WALL) wallCount++;
                    if (map[y][x + 1] === this.tileTypes.WALL) wallCount++;
                    
                    if (wallCount >= 3 && Math.random() < chance) {
                        const directions = [{x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}];
                        directions.sort(() => Math.random() - 0.5);
                        for(const dir of directions) {
                            if(map[y + dir.y][x + dir.x] === this.tileTypes.WALL) {
                                map[y + dir.y][x + dir.x] = this.tileTypes.FLOOR;
                                break;
                            }
                        }
                    }
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
