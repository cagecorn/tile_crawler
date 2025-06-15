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
        // --- 1. DFS로 기본 미로 생성 (이전과 동일) ---
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

        // --- 2. 여러 개의 방 추가로 생성 ---
        const roomCount = 4; // 4개의 방을 생성
        for (let i = 0; i < roomCount; i++) {
            // 방의 크기는 3x3 ~ 5x5 사이로 무작위 결정
            const roomWidth = Math.floor(Math.random() * 3) + 3;
            const roomHeight = Math.floor(Math.random() * 3) + 3;
            
            // 방의 위치를 무작위로 결정 (홀수 좌표에 위치해야 복도와 연결됨)
            const roomX = Math.floor(Math.random() * (this.width - roomWidth - 1) / 2) * 2 + 1;
            const roomY = Math.floor(Math.random() * (this.height - roomHeight - 1) / 2) * 2 + 1;
            
            // 방 내부를 복도로 만듦
            for (let y = roomY; y < roomY + roomHeight; y++) {
                for (let x = roomX; x < roomX + roomWidth; x++) {
                    map[y][x] = this.tileTypes.FLOOR;
                }
            }
            // 생성된 방의 정보를 저장
            this.rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });
        }
        
        return map;
    }
    
    // ... (getRandomFloorPosition, isWallAt, render 메서드는 변경 없음) ...
}
