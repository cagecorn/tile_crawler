// main.js

import { generateMap, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_TYPES } from './src/map.js';

window.onload = function() {
    // 1. 캔버스 설정
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // 브라우저 창 크기가 변경될 때마다 캔버스 크기를 다시 맞추는 함수
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 2. 게임 상태(Game State) 정의
    const gameState = {
        player: {
            x: TILE_SIZE * 1.5, // 플레이어 시작 위치 (타일 중앙)
            y: TILE_SIZE * 1.5,
            width: TILE_SIZE / 2,
            height: TILE_SIZE / 2,
            color: 'blue',
            speed: 5
        },
        map: generateMap(),
        camera: { // 카메라 객체 추가
            x: 0,
            y: 0
        }
    };

    // 3. 렌더링 함수 정의 (카메라 로직 적용)
    function render() {
        // --- 카메라 위치 계산 ---
        const camera = gameState.camera;
        const player = gameState.player;
        
        // 카메라가 플레이어를 화면 중앙에 위치시키도록 목표 위치를 계산합니다.
        let targetCameraX = player.x - canvas.width / 2;
        let targetCameraY = player.y - canvas.height / 2;

        // 카메라가 맵 경계를 벗어나지 않도록 위치를 고정(clamp)합니다.
        const mapPixelWidth = MAP_WIDTH * TILE_SIZE;
        const mapPixelHeight = MAP_HEIGHT * TILE_SIZE;
        camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width));
        camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height));

        // --- 렌더링 시작 ---
        ctx.save(); // 현재 캔버스 상태 저장

        // 캔버스의 원점을 카메라 위치만큼 이동시킵니다.
        ctx.translate(-camera.x, -camera.y);

        // 맵 그리기 (이제 카메라의 시야에 들어오는 부분만 그려도 되지만, 일단 전체를 그립니다)
        const map = gameState.map;
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                ctx.fillStyle = (map[y][x] === TILE_TYPES.WALL) ? '#555' : '#222'; // 색상 약간 변경
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // 플레이어 그리기
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        ctx.restore(); // 저장했던 캔버스 상태 복원 (translate 효과 제거)
    }

    // 4. 키보드 입력 처리 (변경 없음)
    const keysPressed = {};
    document.addEventListener('keydown', function(event) { keysPressed[event.key] = true; });
    document.addEventListener('keyup', function(event) { delete keysPressed[event.key]; });

    // 5. 게임 상태 업데이트 함수 정의 (충돌 처리 로직 좌표 수정)
    function update() {
        const player = gameState.player;
        const map = gameState.map;
        
        let newX = player.x;
        let newY = player.y;

        if ('ArrowUp' in keysPressed) newY -= player.speed;
        if ('ArrowDown' in keysPressed) newY += player.speed;
        if ('ArrowLeft' in keysPressed) newX -= player.speed;
        if ('ArrowRight' in keysPressed) newX += player.speed;

        // 충돌 감지: 플레이어의 월드 좌표를 기준으로 충돌을 확인합니다.
        const nextGridX1 = Math.floor(newX / TILE_SIZE);
        const nextGridY1 = Math.floor(newY / TILE_SIZE);
        const nextGridX2 = Math.floor((newX + player.width) / TILE_SIZE);
        const nextGridY2 = Math.floor((newY + player.height) / TILE_SIZE);

        if (map[nextGridY1] && map[nextGridY1][nextGridX1] === TILE_TYPES.FLOOR &&
            map[nextGridY1] && map[nextGridY1][nextGridX2] === TILE_TYPES.FLOOR &&
            map[nextGridY2] && map[nextGridY2][nextGridX1] === TILE_TYPES.FLOOR &&
            map[nextGridY2] && map[nextGridY2][nextGridX2] === TILE_TYPES.FLOOR) {
            
            player.x = newX;
            player.y = newY;
        }
    }

    // 6. 게임 루프(Game Loop) 정의
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    // 7. 게임 시작
    gameLoop();
};
