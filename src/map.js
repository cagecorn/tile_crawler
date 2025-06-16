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
        const corridorWidth = 5; // 통로 너비 설정
        const map = Array.from({ length: this.height }, () => Array(this.width).fill(this.tileTypes.WALL));

        // 1. 방 생성
        const roomCount = 8;
        const minRoomSize = 3;
        const maxRoomSize = 7;
        for (let i = 0; i < roomCount; i++) {
            const roomW = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            const roomH = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
            const roomX = Math.floor(Math.random() * (this.width - roomW - 2)) + 1;
            const roomY = Math.floor(Math.random() * (this.height - roomH - 2)) + 1;

            const overlaps = this.rooms.some(room =>
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

        // 2. 미로 생성
        for (let y = 1; y < this.height; y += 2) {
            for (let x = 1; x < this.width; x += 2) {
                if (map[y][x] === this.tileTypes.WALL) {
                    this._carveMazeFrom(x, y, map);
                }
            }
        }

        // 3. 방과 미로 연결
        this._connectRoomsAndMazes(map);

        // 4. 막다른 길 일부 제거
        this._removeDeadEnds(map, 0.4);

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

    // 이 함수를 수정하여, 방과 방을 잇는 통로도 넓게 만듭니다.
    _connectRoomsAndMazes(map) {
        const corridorWidth = 2; // 통로 너비를 여기서 다시 사용

        for (let i = 0; i < this.rooms.length; i++) {
            const startRoom = this.rooms[i];
            // 아직 연결되지 않은 다른 방을 찾음
            const endRoom = this.rooms.find((r, index) => i !== index && !this._areRoomsConnected(startRoom, r, map));

            if (endRoom) {
                const startX = Math.floor(startRoom.x + startRoom.width / 2);
                const startY = Math.floor(startRoom.y + startRoom.height / 2);
                const endX = Math.floor(endRoom.x + endRoom.width / 2);
                const endY = Math.floor(endRoom.y + endRoom.height / 2);

                // L자 형태로 넓은 통로를 뚫음
                this._carvePassage(map, startX, startY, endX, startY, corridorWidth);
                this._carvePassage(map, endX, startY, endX, endY, corridorWidth);
            }
        }
    }

    // 두 방이 연결되어 있는지 확인하는 간단한 함수
    _areRoomsConnected(roomA, roomB, map) {
        // 이 함수는 지금은 간단하게 false를 반환하여 모든 방을 연결 시도하도록 합니다.
        // 더 복잡한 로직을 원할 경우 나중에 수정할 수 있습니다.
        return false;
    }

    // 통로를 만드는 헬퍼 함수 수정
    _carvePassage(map, x1, y1, x2, y2, width) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        const halfWidth = Math.floor(width / 2);

        // 가로 통로
        if (minY === maxY) {
            for (let x = minX; x <= maxX; x++) {
                for (let w = -halfWidth; w < width - halfWidth; w++) {
                    if (map[minY + w] && map[minY + w][x] !== undefined) {
                        map[minY + w][x] = this.tileTypes.FLOOR;
                    }
                }
            }
        }
        // 세로 통로
        else if (minX === maxX) {
            for (let y = minY; y <= maxY; y++) {
                for (let w = -halfWidth; w < width - halfWidth; w++) {
                    if (map[y] && map[y][minX + w] !== undefined) {
                        map[y][minX + w] = this.tileTypes.FLOOR;
                    }
                }
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
