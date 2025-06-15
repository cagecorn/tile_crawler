// main.js

import { MapManager } from './src/map.js';

window.onload = function() {
    // 1. 캔버스 설정 (변경 없음)
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // 2. MapManager 인스턴스 생성 (변경 없음)
    const mapManager = new MapManager();

    // 3. 게임 상태 정의 (변경 없음)
    const gameState = {
        player: {
            x: mapManager.tileSize * 1.5,
            y: mapManager.tileSize * 1.5,
            width: mapManager.tileSize / 2,
            height: mapManager.tileSize / 2,
            color: 'blue',
            speed: 5
        },
        camera: { x: 0, y: 0 }
    };

    // 4. 렌더링 함수 정의 (변경 없음)
    function render() {
        const camera = gameState.camera;
        const player = gameState.player;
        let targetCameraX = player.x - canvas.width / 2;
        let targetCameraY = player.y - canvas.height / 2;
        const mapPixelWidth = mapManager.width * mapManager.tileSize;
        const mapPixelHeight = mapManager.height * mapManager.tileSize;
        camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width));
        camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height));
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        mapManager.render(ctx);
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.restore();
    }

    // 5. 키보드 입력 처리 (변경 없음)
    const keysPressed = {};
    document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
    document.addEventListener('keyup', (event) => { delete keysPressed[event.key]; });

    // 6. 게임 상태 업데이트 함수 정의 (새로운 방식으로 수정됨)
    function update() {
        const player = gameState.player;
        
        // --- 이동 벡터 계산 ---
        let moveX = 0;
        let moveY = 0;
        if ('ArrowUp' in keysPressed) moveY -= player.speed;
        if ('ArrowDown' in keysPressed) moveY += player.speed;
        if ('ArrowLeft' in keysPressed) moveX -= player.speed;
        if ('ArrowRight' in keysPressed) moveX += player.speed;

        // --- X축 이동 및 충돌 검사 ---
        if (moveX !== 0) {
            const newX = player.x + moveX;
            if (!isColliding(newX, player.y, player.width, player.height)) {
                player.x = newX;
            }
        }

        // --- Y축 이동 및 충돌 검사 ---
        if (moveY !== 0) {
            // X축 이동이 반영된 현재 player.x를 사용합니다.
            const newY = player.y + moveY;
            if (!isColliding(player.x, newY, player.width, player.height)) {
                player.y = newY;
            }
        }
    }
    
    // 7. 충돌 검사 헬퍼 함수
    // 지정된 위치에 벽이나 몬스터가 있는지 확인합니다.
    function isColliding(x, y, width, height) {
        // 벽 충돌 검사
        if (mapManager.isWallAt(x, y) ||
            mapManager.isWallAt(x + width, y) ||
            mapManager.isWallAt(x, y + height) ||
            mapManager.isWallAt(x + width, y + height)) {
            return true;
        }

        // 몬스터 충돌 검사
        for (const monster of mapManager.monsters) {
            if (x < monster.x + monster.width &&
                x + width > monster.x &&
                y < monster.y + monster.height &&
                y + height > monster.y) {
                return true;
            }
        }

        return false;
    }

    // 8. 게임 루프 (이전과 동일)
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    // 9. 게임 시작 (이전과 동일)
    gameLoop();
};
