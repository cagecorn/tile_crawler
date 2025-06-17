// src/pathfindingManager.js

export class PathfindingManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
    }

    // 간단한 BFS 기반 길찾기 구현
    findPath(startX, startY, endX, endY) {
        console.log(`Pathfinding from (${startX},${startY}) to (${endX},${endY})`);

        const { map, width, height, tileTypes } = this.mapManager;

        if (startX === endX && startY === endY) return [];

        const queue = [{ x: startX, y: startY }];
        const visited = new Set([`${startX},${startY}`]);
        const cameFrom = new Map();

        const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === endX && current.y === endY) {
                const path = [];
                let key = `${endX},${endY}`;
                while (key !== `${startX},${startY}`) {
                    const [cx, cy] = key.split(',').map(Number);
                    path.unshift({ x: cx, y: cy });
                    key = cameFrom.get(key);
                }
                return path;
            }

            for (const dir of dirs) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                const nKey = `${nx},${ny}`;

                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                if (map[ny][nx] === tileTypes.WALL) continue;
                if (visited.has(nKey)) continue;

                visited.add(nKey);
                cameFrom.set(nKey, `${current.x},${current.y}`);
                queue.push({ x: nx, y: ny });
            }
        }

        return []; // 경로를 찾지 못한 경우 빈 배열 반환
    }
}
