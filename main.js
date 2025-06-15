// main.js

import { MapManager } from './src/map.js';
// MonsterManager와 함께 VisualEffectManager도 불러옵니다.
import { MonsterManager, VisualEffectManager } from './src/managers.js'; 

window.onload = function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // 매니저 인스턴스 생성
    const mapManager = new MapManager();
    const monsterManager = new MonsterManager(5, mapManager);
    const visualEffectManager = new VisualEffectManager(); // 시각효과 매니저 생성

    const gameState = {
        player: {
            x: mapManager.tileSize * 1.25,
            y: mapManager.tileSize * 1.25,
            width: mapManager.tileSize / 2,
            height: mapManager.tileSize / 2,
            color: 'blue',
            speed: 5,
            hp: 10,
            maxHp: 10, // 플레이어 최대 체력 추가
            attackPower: 1,
            attackCooldown: 0
        },
        camera: { x: 0, y: 0 }
    };

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

        // 월드 요소 그리기
        mapManager.render(ctx);
        monsterManager.render(ctx);
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // UI 요소 그리기 (플레이어, 몬스터를 그린 후에 호출)
        visualEffectManager.render(ctx, gameState.player, monsterManager.monsters);

        ctx.restore();
    }

    // ... (update, handleMovement, checkWallCollision, gameLoop 등 나머지 코드는 변경 없음) ...
    const keysPressed = {};
    document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
    document.addEventListener('keyup', (event) => { delete keysPressed[event.key]; });

    function update() {
        const player = gameState.player;
        if (player.attackCooldown > 0) {
            player.attackCooldown--;
        }
        let moveX = 0;
        let moveY = 0;
        if ('ArrowUp' in keysPressed) moveY -= player.speed;
        if ('ArrowDown' in keysPressed) moveY += player.speed;
        if ('ArrowLeft' in keysPressed) moveX -= player.speed;
        if ('ArrowRight' in keysPressed) moveX += player.speed;
        if (moveX !== 0) {
            const newX = player.x + moveX;
            if (!checkWallCollision(newX, player.y, player.width, player.height)) {
                handleMovement(newX, player.y);
            }
        }
        if (moveY !== 0) {
            const newY = player.y + moveY;
            if (!checkWallCollision(player.x, newY, player.width, player.height)) {
                handleMovement(player.x, newY);
            }
        }
    }
    
    function handleMovement(newX, newY) {
        const player = gameState.player;
        let attacked = false;
        for (const monster of monsterManager.monsters) {
            if (newX < monster.x + monster.width &&
                newX + player.width > monster.x &&
                newY < monster.y + monster.height &&
                newY + player.height > monster.y) {
                if (player.attackCooldown === 0) {
                    monsterManager.handleAttackOnMonster(monster.id, player.attackPower);
                    player.attackCooldown = 30;
                }
                attacked = true;
                break;
            }
        }
        if (!attacked) {
            player.x = newX;
            player.y = newY;
        }
    }

    function checkWallCollision(x, y, width, height) {
        return mapManager.isWallAt(x, y) ||
               mapManager.isWallAt(x + width, y) ||
               mapManager.isWallAt(x, y + height) ||
               mapManager.isWallAt(x + width, y + height);
    }

    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
};
