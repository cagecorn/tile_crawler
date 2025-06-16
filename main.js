// main.js

import { MapManager } from './src/map.js';
import { MonsterManager, UIManager, ItemManager } from './src/managers.js';
import { Player, Item } from './src/entities.js';
import { AssetLoader } from './src/assetLoader.js';

window.onload = function () {
    // --- 1. 에셋 로딩 시작 ---
    const loader = new AssetLoader();
    loader.loadImage('player', 'assets/player.png');
    loader.loadImage('monster', 'assets/monster.png');
    loader.loadImage('epic_monster', 'assets/epic_monster.png');
    loader.loadImage('floor', 'assets/floor.png');
    loader.loadImage('wall', 'assets/wall.png');
    loader.loadImage('gold', 'assets/gold.png');
    loader.loadImage('potion', 'assets/potion.png');

    // 모든 에셋 로딩이 끝나면 게임을 초기화하고 시작합니다.
    loader.onReady((assets) => {
        // --- 2. 게임 초기화 (로딩 완료 후) ---
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const mapManager = new MapManager();
        const monsterManager = new MonsterManager(7, mapManager, assets);
        const itemManager = new ItemManager(10, mapManager, assets);
        const uiManager = new UIManager();

        const warriorJob = { maxHp: 20, attackPower: 2 };

        const startPos = mapManager.getRandomFloorPosition() || { x: mapManager.tileSize, y: mapManager.tileSize };
        const gameState = {
            player: new Player(
                startPos.x,
                startPos.y,
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

            uiManager.updateUI(gameState);
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
                // handleAttackOnMonster가 반환하는 경험치를 받음
                const gainedExp = monsterManager.handleAttackOnMonster(
                    monsterToAttack.id,
                    player.attackPower
                );

                // 경험치를 얻었다면 (몬스터가 죽었다면)
                if (gainedExp > 0) {
                    player.exp += gainedExp;
                    console.log(`${gainedExp} 경험치 획득! 현재 경험치: ${player.exp}`);
                    checkForLevelUp(); // 레벨업 확인
                }
                player.attackCooldown = 30;

            } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                player.x = targetX;
                player.y = targetY;
            }

            handleItemCollision();
            monsterManager.update(gameState.player, handlePlayerAttacked);
        }

        // === 레벨업 확인 함수 새로 추가 ===
        function checkForLevelUp() {
            const player = gameState.player;
            // 현재 경험치가 필요 경험치보다 많거나 같으면 레벨업
            while (player.exp >= player.expNeeded) {
                player.exp -= player.expNeeded; // 현재 경험치에서 필요 경험치를 뺌
                player.level++;
                player.expNeeded = Math.floor(player.expNeeded * 1.5); // 다음 필요 경험치는 1.5배 증가
                player.maxHp += 5; // 최대 HP 5 증가
                player.hp = player.maxHp; // 체력을 모두 회복
                player.attackPower += 1; // 공격력 1 증가

                console.log(`레벨 업! LV ${player.level} 달성!`);
                // 여기에 레벨업 시각/음향 효과 등을 추가할 수 있음
            }
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
                    } else if (item.name === 'potion') {
                        if (gameState.inventory.length < 10) {
                            gameState.inventory.push(item);
                            itemManager.removeItem(item);
                        }
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
