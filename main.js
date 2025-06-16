// main.js

import { MapManager } from './src/map.js';
import { MonsterManager, UIManager, ItemManager } from './src/managers.js';
import { Player, Item } from './src/entities.js';
import { AssetLoader } from './src/assetLoader.js';

window.onload = function () {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // --- 1. 에셋 로딩 시작 ---
    const loader = new AssetLoader();
    loader.loadImage('player', 'assets/player.png');
    loader.loadImage('monster', 'assets/monster.png');
    loader.loadImage('epic_monster', 'assets/epic_monster.png');
    loader.loadImage('floor', 'assets/floor.png');
    loader.loadImage('wall', 'assets/wall.png');
    loader.loadImage('gold', 'assets/gold.png');

    // 모든 에셋 로딩이 끝나면 게임을 초기화하고 시작합니다.
    loader.onReady((assets) => {
        // --- 2. 게임 초기화 (로딩 완료 후) ---
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const mapManager = new MapManager();
        const monsterManager = new MonsterManager(7, mapManager, assets);
        const itemManager = new ItemManager(5, mapManager, assets);
        const uiManager = new UIManager();

        const warriorJob = { maxHp: 20, attackPower: 2 };

        const gameState = {
            player: new Player(
                mapManager.tileSize * 1.25,
                mapManager.tileSize * 1.25,
                mapManager.tileSize,
                warriorJob,
                assets.player
            ),
            inventory: [],
            gold: 0,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: 0.5, // 줌 배율 추가 (0.25 = 4배 줌 아웃)
        };

        // --- 3. 게임 루프와 로직 ---
        function render() {
            if (gameState.isGameOver) return;
            const camera = gameState.camera;
            const player = gameState.player;
            const zoom = gameState.zoomLevel;

            // 줌 레벨에 맞춰 카메라 위치를 다시 계산
            let targetCameraX = player.x - (canvas.width / 2) / zoom;
            let targetCameraY = player.y - (canvas.height / 2) / zoom;

            const mapPixelWidth = mapManager.width * mapManager.tileSize;
            const mapPixelHeight = mapManager.height * mapManager.tileSize;

            camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width / zoom));
            camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height / zoom));

            ctx.save();

            // --- 줌 기능 적용 ---
            ctx.scale(zoom, zoom);
            ctx.translate(-camera.x, -camera.y);
            mapManager.render(ctx, assets);
            monsterManager.render(ctx);
            itemManager.render(ctx);
            player.render(ctx);
            uiManager.renderHpBars(ctx, gameState.player, monsterManager.monsters);
            ctx.restore();

            uiManager.updatePlayerStats(gameState);
        }

        const keysPressed = {};
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });

        function update() {
            if (gameState.isGameOver) return;
            const player = gameState.player;
            if (player.attackCooldown > 0) player.attackCooldown--;

            let moveX = 0,
                moveY = 0;
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
            } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                player.x = targetX;
                player.y = targetY;
            }

            handleItemCollision();
            monsterManager.update(gameState.player, handlePlayerAttacked);
        }

        function handlePlayerAttacked(damage) {
            gameState.player.takeDamage(damage);
            if (gameState.player.hp <= 0) {
                gameState.isGameOver = true;
                alert('게임 오버!');
            }
        }

        // 아이템 충돌을 처리하는 함수
        function handleItemCollision() {
            const player = gameState.player;
            for (const item of [...itemManager.items]) {
                if (
                    player.x < item.x + item.width &&
                    player.x + player.width > item.x &&
                    player.y < item.y + item.height &&
                    player.y + player.height > item.y
                ) {
                    if (item.name === 'gold') {
                        gameState.gold += 10;
                        console.log(`골드 10 획득! 현재 골드: ${gameState.gold}`);
                        itemManager.removeItem(item);
                    } else {
                        gameState.inventory.push(item);
                        itemManager.removeItem(item);
                    }
                }
            }
        }

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        // --- 4. 게임 시작 ---
        gameLoop();
    });
};
