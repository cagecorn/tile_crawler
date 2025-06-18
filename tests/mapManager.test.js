import { MapManager } from '../src/map.js';

console.log("--- Running MapManager Tests ---");

try {
    const mapManager = new MapManager();
    const map = mapManager.map;
    const { width, height } = mapManager;
    const TILE_TYPES = mapManager.tileTypes;

    // 테스트 1: 모든 복도와 방이 하나로 연결되어 있는가? (Flood Fill 알고리즘 사용)
    let startNode = null;
    let floorCount = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (map[y][x] === TILE_TYPES.FLOOR) {
                if (!startNode) startNode = { x, y };
                floorCount++;
            }
        }
    }

    if (startNode) {
        const visited = new Set();
        const queue = [startNode];
        visited.add(`${startNode.x},${startNode.y}`);
        let connectedCount = 0;

        while (queue.length > 0) {
            const current = queue.shift();
            connectedCount++;
            const { x, y } = current;
            const neighbors = [
                { x: x + 1, y: y },
                { x: x - 1, y: y },
                { x: x, y: y + 1 },
                { x: x, y: y - 1 }
            ];

            for (const n of neighbors) {
                const key = `${n.x},${n.y}`;
                if (map[n.y] && map[n.y][n.x] === TILE_TYPES.FLOOR && !visited.has(key)) {
                    visited.add(key);
                    queue.push(n);
                }
            }
        }

        if (connectedCount !== floorCount) {
            throw new Error(`맵이 고립된 공간을 포함합니다. 전체 바닥: ${floorCount}, 연결된 바닥: ${connectedCount}`);
        }
        console.log("✅ PASSED: 맵 연결성 테스트");
    } else {
        throw new Error("맵에 시작 지점을 찾을 수 없습니다.");
    }

} catch (e) {
    console.error(`❌ FAILED: 맵 유효성 검사 - ${e.message}`);
}
