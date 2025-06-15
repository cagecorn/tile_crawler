// main.js

// MapManager 클래스를 import 합니다.
import { MapManager } from './src/map.js';

window.onload = function() {
    // 1. 캔버스 설정
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // 2. MapManager 인스턴스 생성
    const mapManager = new MapManager();

    // 3. 게임 상태(Game State) 정의
    const gameState = {
        player: {
            x: mapManager.tileSize * 1.5,
            y: mapManager.tileSize * 1.5,
            width: mapManager.tileSize / 2,
            height: mapManager.tileSize / 2,
            color: 'blue',
            speed: 5
        },
        camera: {
            x: 0,
            y: 0
        }
    };

    // 4. 렌더링 함수 정의
    function render() {
        const camera = gameState.camera;
        const player = gameState.player;
        
        // 카메라 위치 계산
        let targetCameraX = player.x - canvas.width / 2;
        let targetCameraY = player.y - canvas.height / 2;
        const mapPixelWidth = mapManager.width * mapManager.tileSize;
        const mapPixelHeight = mapManager.height * mapManager.tileSize;
        camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width));
        camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height));
        
        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        // MapManager에게 맵을 그리도록 요청
        mapManager.render(ctx);

        // 플레이어 그리기
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        ctx.restore();
    }

    // 5. 키보드 입력 처리
    const keysPressed = {};
    document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
    document.addEventListener('keyup', (event) => { delete keysPressed[event.key]; });

    // 6. 게임 상태 업데이트 함수 정의
    function update() {
        const player = gameState.player;
        
        let newX = player.x;
        let newY = player.y;

        if ('ArrowUp' in keysPressed) newY -= player.speed;
        if ('ArrowDown' in keysPressed) newY += player.speed;
        if ('ArrowLeft' in keysPressed) newX -= player.speed;
        if ('ArrowRight' in keysPressed) newX += player.speed;

        // 충돌 감지를 MapManager에게 위임
        if (!mapManager.isWallAt(newX, newY) &&
            !mapManager.isWallAt(newX + player.width, newY) &&
            !mapManager.isWallAt(newX, newY + player.height) &&
            !mapManager.isWallAt(newX + player.width, newY + player.height)) {
            
            player.x = newX;
            player.y = newY;
        }
    }

    // 7. 게임 루프
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    // 8. 게임 시작
    gameLoop();
};
