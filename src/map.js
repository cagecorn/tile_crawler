// src/map.js

// 맵 타일의 종류를 상수로 정의합니다.
const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1
};

// MapManager 클래스 정의
export class MapManager {
    constructor() {
        this.width = 21; // 가로 타일 21개
        this.height = 17; // 세로 타일 17개
        this.tileSize = 48; // 각 타일의 크기
        this.tileTypes = TILE_TYPES;
        this.map = this._generateMaze(); // 생성자에서 미로 생성 메서드 호출
    }

    // DFS 알고리즘으로 미로를 생성하는 '내부' 메서드
    _generateMaze() {
        const map = [];
        for (let y = 0; y < this.height; y++) {
            map.push(Array(this.width).fill(this.tileTypes.WALL));
        }

        const stack = [];
        const visited = Array.from({ length: this.height }, () => Array(this.width).fill(false));

        let startX = 1;
        let startY = 1;
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

    // 특정 좌표가 벽인지 확인하는 메서드
    isWallAt(worldX, worldY) {
        const mapX = Math.floor(worldX / this.tileSize);
        const mapY = Math.floor(worldY / this.tileSize);

        // 맵 범위를 벗어나는지 확인
        if (mapX < 0 || mapX >= this.width || mapY < 0 || mapY >= this.height) {
            return true; // 맵 밖은 벽으로 간주
        }

        return this.map[mapY][mapX] === this.tileTypes.WALL;
    }

    // 맵을 그리는 메서드
    render(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                ctx.fillStyle = (this.map[y][x] === this.tileTypes.WALL) ? '#555' : '#222';
                ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
}
