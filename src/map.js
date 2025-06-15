// 맵의 크기를 정의합니다. (홀수로 설정해야 미로가 예쁘게 나옵니다)
const MAP_WIDTH = 21; // 가로 타일 21개
const MAP_HEIGHT = 17; // 세로 타일 17개
const TILE_SIZE = 40; // 각 타일의 크기 (40x40 픽셀)

// 맵 타일의 종류를 상수로 정의합니다. (0: 복도, 1: 벽)
const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1
};

// 맵을 생성하는 함수입니다. (DFS 미로 생성 알고리즘 적용)
export function generateMap() {
    const map = [];

    // 1. 모든 타일을 벽으로 초기화합니다.
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map.push(Array(MAP_WIDTH).fill(TILE_TYPES.WALL));
    }

    // 2. DFS 탐색을 위한 스택과 방문 기록 배열을 준비합니다.
    const stack = [];
    const visited = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(false));

    // 3. 시작 지점을 설정하고 길을 뚫습니다. (좌표는 항상 홀수여야 합니다)
    let startX = 1;
    let startY = 1;
    map[startY][startX] = TILE_TYPES.FLOOR;
    visited[startY][startX] = true;
    stack.push({ x: startX, y: startY });

    // 4. 스택에 탐색할 곳이 남아있는 동안 반복합니다.
    while (stack.length > 0) {
        const current = stack.pop();
        const neighbors = [];

        // 5. 현재 위치에서 상하좌우 네 방향의 이웃을 확인합니다.
        const directions = [
            { x: 0, y: -2 }, // 위
            { x: 0, y: 2 },  // 아래
            { x: -2, y: 0 }, // 왼쪽
            { x: 2, y: 0 }   // 오른쪽
        ];

        // 방향을 무작위로 섞습니다.
        directions.sort(() => Math.random() - 0.5);

        for (const dir of directions) {
            const nx = current.x + dir.x;
            const ny = current.y + dir.y;

            // 맵 범위 안에 있고 아직 방문하지 않은 곳이라면
            if (nx > 0 && nx < MAP_WIDTH -1 && ny > 0 && ny < MAP_HEIGHT -1 && !visited[ny][nx]) {
                neighbors.push({ x: nx, y: ny, wallX: current.x + dir.x / 2, wallY: current.y + dir.y / 2 });
            }
        }

        // 6. 방문 가능한 이웃이 있다면
        if (neighbors.length > 0) {
            stack.push(current); // 현재 위치를 다시 스택에 넣어 나중에 돌아올 수 있게 함

            const next = neighbors[0]; // 무작위로 섞었으므로 첫 번째 이웃을 선택

            // 현재 위치와 다음 위치 사이의 벽을 뚫습니다.
            map[next.wallY][next.wallX] = TILE_TYPES.FLOOR;
            // 다음 위치도 길로 만듭니다.
            map[next.y][next.x] = TILE_TYPES.FLOOR;

            visited[next.y][next.x] = true;
            stack.push(next); // 다음 위치를 스택에 추가하여 계속 탐색
        }
    }

    return map;
}

// 다른 파일에서 사용할 수 있도록 맵 정보를 export 합니다.
export { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_TYPES };
