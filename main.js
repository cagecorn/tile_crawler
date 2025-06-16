// main.js

import { MapManager } from './src/map.js';
import { MonsterManager, UIManager, ItemManager } from './src/managers.js';
import { Player } from './src/entities.js';
import { AssetLoader } from './src/assetLoader.js';

window.onload = function() {
    const loader = new AssetLoader();
    loader.loadImage('player', 'assets/player.png');
    loader.loadImage('monster', 'assets/monster.png');
    loader.loadImage('epic_monster', 'assets/epic_monster.png');
    loader.loadImage('floor', 'assets/floor.png');
    loader.loadImage('wall', 'assets/wall.png');
    loader.loadImage('gold', 'assets/gold.png');
    loader.loadImage('potion', 'assets/potion.png');

    loader.onReady(assets => {
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

        const warriorJob = {
            strength: 5,
            agility: 3,
            endurance: 4,
            focus: 1,
            intelligence: 1,
            movement: 5,
        };

        const startPos = mapManager.getRandomFloorPosition() || {
            x: mapManager.tileSize,
            y: mapManager.tileSize,
        };
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
            statPoints: 5,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: 0.5 
        };

        function handleStatUp(stat) {
            if (gameState.statPoints > 0) {
                gameState.statPoints--;
                gameState.player.allocateStatPoint(stat);
            } else {
                console.log('스탯 포인트가 부족합니다.');
            }
        }

        function checkForLevelUp() {
            const player = gameState.player;
            const stats = player.stats;
            while (stats.get('exp') >= stats.get('expNeeded')) {
                stats.levelUp();
                stats.recalculate();
                player.hp = stats.get('maxHp');
                gameState.statPoints += 5;
                console.log(`레벨 업! LV ${stats.get('level')} 달성!`);
            }
        }

        const keysPressed = {};
        document.addEventListener('keydown', e => {
            keysPressed[e.key] = true;
        });
        document.addEventListener('keyup', e => {
            delete keysPressed[e.key];
        });

        function handlePlayerAttacked(damage) {
            gameState.player.takeDamage(damage);
            if (gameState.player.hp <= 0) {
                gameState.isGameOver = true;
                alert('게임 오버!');
            }
        }

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

        function update() {
            if (gameState.isGameOver) return;
            const player = gameState.player;
            if (player.attackCooldown > 0) player.attackCooldown--;

            let moveX = 0;
            let moveY = 0;
            if ('ArrowUp' in keysPressed) moveY -= player.speed;
            if ('ArrowDown' in keysPressed) moveY += player.speed;
            if ('ArrowLeft' in keysPressed) moveX -= player.speed;
            if ('ArrowRight' in keysPressed) moveX += player.speed;

            const targetX = player.x + moveX;
            const targetY = player.y + moveY;

            const monsterToAttack = monsterManager.getMonsterAt(
                targetX + player.width / 2,
                targetY + player.height / 2,
            );

            if (monsterToAttack && player.attackCooldown === 0) {
                const gainedExp = monsterManager.handleAttackOnMonster(
                    monsterToAttack.id,
                    player.attackPower,
                );

                if (gainedExp > 0) {
                    gameState.player.stats.addExp(gainedExp);
                    checkForLevelUp();
                }
                player.attackCooldown = 30;
            } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                player.x = targetX;
                player.y = targetY;
            }

            handleItemCollision();
            monsterManager.update(gameState.player, handlePlayerAttacked);
        }

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
            mapManager.render(ctx, assets);
            monsterManager.render(ctx);
            itemManager.render(ctx);
            player.render(ctx);
            uiManager.renderHpBars(ctx, gameState.player, monsterManager.monsters);
            ctx.restore();

            uiManager.updateUI(gameState);
        }

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        uiManager.init(handleStatUp);
        uiManager.updateUI(gameState);
        gameLoop();
    });
};
