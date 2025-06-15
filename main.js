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
    const monsterManager = new MonsterManager(7, mapManager); // 몬스터 7마리로 늘림
    const visualEffectManager = new VisualEffectManager();

    const gameState = {
        player: {
            x: mapManager.tileSize * 1.25,
            y: mapManager.tileSize * 1.25,
            width: mapManager.tileSize / 2,
            height: mapManager.tileSize / 2,
            color: 'blue',
            speed: 5,
            hp: 10,
            maxHp: 10,
            attackPower: 1,
            attackCooldown: 0
        },
        camera: { x: 0, y: 0 },
        isGameOver: false
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

    const keysPressed = {};
    document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
    document.addEventListener('keyup', (event) => { delete keysPressed[event.key]; });

    function update() {
        if (gameState.isGameOver) return;
        const player = gameState.player;
        if (player.attackCooldown > 0) { player.attackCooldown--; }

        let moveX = 0, moveY = 0;
        if ('ArrowUp' in keysPressed) moveY -= player.speed;
        if ('ArrowDown' in keysPressed) moveY += player.speed;
        if ('ArrowLeft' in keysPressed) moveX -= player.speed;
        if ('ArrowRight' in keysPressed) moveX += player.speed;

        let targetX = player.x + moveX;
        let targetY = player.y + moveY;

        const monsterToAttack = monsterManager.getMonsterAt(
            targetX + player.width / 2,
            targetY + player.height / 2
        );
        if (monsterToAttack && player.attackCooldown === 0) {
            monsterManager.handleAttackOnMonster(monsterToAttack.id, player.attackPower);
            player.attackCooldown = 30;
        } else if (!checkWallCollision(targetX, targetY, player.width, player.height)) {
            player.x = targetX;
            player.y = targetY;
        }

        monsterManager.update(gameState.player, handlePlayerAttacked);
    }

    function handlePlayerAttacked(damage) {
        gameState.player.hp -= damage;
        if (gameState.player.hp <= 0) {
            gameState.isGameOver = true;
        }
    }
    

    function checkWallCollision(x, y, width, height) {
        return mapManager.isWallAt(x, y, width, height);
    }

    resizeCanvas();
    function gameLoop_inner() {
        update();
        render();
        requestAnimationFrame(gameLoop_inner);
    }
    function gameLoop() { gameLoop_inner(); }
    gameLoop();
};
