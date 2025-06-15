// main.js

import { MapManager } from './src/map.js';
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
    
    const mapManager = new MapManager();
    const monsterManager = new MonsterManager(7, mapManager);
    const visualEffectManager = new VisualEffectManager();

    const gameState = {
        player: {
            x: mapManager.tileSize * 1.25, y: mapManager.tileSize * 1.25,
            width: mapManager.tileSize / 2, height: mapManager.tileSize / 2,
            color: 'blue', speed: 5,
            hp: 10, maxHp: 10,
            attackPower: 1, attackCooldown: 0
        },
        camera: { x: 0, y: 0 },
        isGameOver: false
    };

    function render() {
        if (gameState.isGameOver) return;
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
        monsterManager.render(ctx);
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
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
        
        const monsterToAttack = monsterManager.getMonsterAt(targetX + player.width / 2, targetY + player.height / 2);

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
            gameState.player.hp = 0;
            gameState.isGameOver = true;
            alert("게임 오버!");
        }
    }

    function checkWallCollision(x, y, width, height) {
        return mapManager.isWallAt(x, y, width, height);
    }
    
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
};
