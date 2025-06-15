// main.js

import { MapManager } from './src/map.js';
import { MonsterManager, UIManager } from './src/managers.js';
import { Player } from './src/entities.js'; // Player 클래스를 불러옵니다.

window.onload = function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // 매니저 인스턴스 생성
    const mapManager = new MapManager();
    const monsterManager = new MonsterManager(7, mapManager);
    const uiManager = new UIManager(); // UIManager 생성

    // '기본 전사' 라는 직업 객체를 정의 (전직 시스템의 기초)
    const warriorJob = {
        maxHp: 20,
        attackPower: 2,
    };

    // gameState에서 player 객체를 Player 클래스의 인스턴스로 생성
    const gameState = {
        player: new Player(
            mapManager.tileSize * 1.25, 
            mapManager.tileSize * 1.25, 
            mapManager.tileSize,
            warriorJob // 직업 객체를 전달
        ),
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
        player.render(ctx); // player의 render 메서드 호출
        uiManager.renderHpBars(ctx, gameState.player, monsterManager.monsters); // HP 바 그리기
        
        ctx.restore();

        // 캔버스와 별개로 HTML UI를 업데이트
        uiManager.updatePlayerStats(gameState.player);
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
        } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
            player.x = targetX;
            player.y = targetY;
        }
        
        monsterManager.update(gameState.player, handlePlayerAttacked);
    }
    
    function handlePlayerAttacked(damage) {
        gameState.player.takeDamage(damage); // player의 takeDamage 메서드 호출
        if (gameState.player.hp <= 0) {
            gameState.isGameOver = true;
            alert("게임 오버!");
        }
    }
    
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
};

