// main.js

import { MapManager } from './src/map.js';
import { MonsterManager } from './src/managers.js'; // MonsterManager를 불러옵니다.

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
    const monsterManager = new MonsterManager(5, mapManager); // 몬스터 5마리 생성

    const gameState = {
        player: {
            x: mapManager.tileSize * 1.25,
            y: mapManager.tileSize * 1.25,
            width: mapManager.tileSize / 2,
            height: mapManager.tileSize / 2,
            color: 'blue',
            speed: 5,
            hp: 10, // 플레이어 체력
            attackPower: 1, // 플레이어 공격력
            attackCooldown: 0 // 공격 쿨다운
        },
        camera: { x: 0, y: 0 }
    };

    function render() {
        // ... (카메라 및 맵, 플레이어 렌더링 코드는 변경 없음) ...
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
        monsterManager.render(ctx); // MonsterManager에게 몬스터를 그리도록 요청
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.restore();
    }

    const keysPressed = {};
    document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
    document.addEventListener('keyup', (event) => { delete keysPressed[event.key]; });

    function update() {
        const player = gameState.player;
        
        // 공격 쿨다운 감소
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
    
    // 이동 및 공격 처리를 위한 새 함수
    function handleMovement(newX, newY) {
        const player = gameState.player;
        let attacked = false;
        
        // 몬스터와 충돌하는지 확인
        for (const monster of monsterManager.monsters) {
            if (newX < monster.x + monster.width &&
                newX + player.width > monster.x &&
                newY < monster.y + monster.height &&
                newY + player.height > monster.y) {
                
                // 공격 쿨다운이 0이면 공격
                if (player.attackCooldown === 0) {
                    console.log(`플레이어가 몬스터(ID: ${monster.id})를 공격!`);
                    monsterManager.handleAttackOnMonster(monster.id, player.attackPower);
                    player.attackCooldown = 30; // 30프레임(약 0.5초)의 쿨다운 설정
                }
                attacked = true;
                break;
            }
        }

        // 몬스터를 공격하지 않았다면, 해당 방향으로 이동
        if (!attacked) {
            player.x = newX;
            player.y = newY;
        }
    }

    // 벽 충돌만 확인하는 함수
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
