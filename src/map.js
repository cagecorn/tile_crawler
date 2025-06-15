// 맵의 크기를 정의합니다.
const MAP_WIDTH = 20; // 가로 타일 20개
const MAP_HEIGHT = 15; // 세로 타일 15개
const TILE_SIZE = 40; // 각 타일의 크기 (40x40 픽셀)

// 맵 타일의 종류를 상수로 정의합니다. (0: 복도, 1: 벽)
const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1
};

// 맵을 생성하는 함수입니다.
export function generateMap() {
    // 비어있는 맵 배열을 생성합니다.
    const map = [];

    // 맵의 모든 타일을 일단 벽(1)으로 채웁니다.
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            row.push(TILE_TYPES.WALL);
        }
        map.push(row);
    }

    // 맵의 안쪽 영역을 복도(0)로 만듭니다. (간단한 방 모양)
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            map[y][x] = TILE_TYPES.FLOOR;
        }
    }

    // 완성된 맵 데이터를 반환합니다.
    return map;
}

// 다른 파일에서 사용할 수 있도록 맵 정보를 export 합니다.
export { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_TYPES };
