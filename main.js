// main.js

import { MapManager } from './src/map.js';
import { MercenaryManager, MonsterManager, UIManager, ItemManager } from './src/managers.js';
import { Player } from './src/entities.js';
import { AssetLoader } from './src/assetLoader.js';
import { MetaAIManager, STRATEGY } from './src/ai-managers.js';

window.onload = function() {
    const loader = new AssetLoader();
    loader.loadImage('player', 'assets/player.png');
    loader.loadImage('monster', 'assets/monster.png');
    loader.loadImage('epic_monster', 'assets/epic_monster.png');
    loader.loadImage('mercenary', 'assets/images/warrior.png');
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
        const mercenaryManager = new MercenaryManager(assets);
        const itemManager = new ItemManager(20, mapManager, assets); // 아이템 20개 생성
        const uiManager = new UIManager();
        const metaAIManager = new MetaAIManager();

        const playerGroup = metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
        const monsterGroup = metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

        monsterManager.monsters.forEach(monster => monsterGroup.addMember(monster));
        mercenaryManager.mercenaries.forEach(merc => playerGroup.addMember(merc));

        const warriorJob = {
            strength: 5, agility: 5, endurance: 5, focus: 5, intelligence: 5,
            movement: 5, maxHp: 20, attackPower: 2,
        };

        const startPos = mapManager.getRandomFloorPosition() || { x: mapManager.tileSize, y: mapManager.tileSize };
        const gameState = {
            player: new Player(startPos.x, startPos.y, mapManager.tileSize, assets.player, playerGroup.id, warriorJob),
            inventory: [], gold: 100, statPoints: 5,
            camera: { x: 0, y: 0 }, isGameOver: false, zoomLevel: 0.5
        };
        playerGroup.addMember(gameState.player);

        document.getElementById('hire-mercenary').onclick = () => {
            if (gameState.gold >= 50) {
                gameState.gold -= 50;
                const newMerc = mercenaryManager.hireMercenary(gameState.player.x, gameState.player.y, mapManager.tileSize, 'player_party');
                playerGroup.addMember(newMerc);
            }
        };

        const keysPressed = {};
        document.addEventListener('keydown', e => { keysPressed[e.key] = true; });
        document.addEventListener('keyup', e => { delete keysPressed[e.key]; });

        function render() {
            if (gameState.isGameOver) return;
            const camera = gameState.camera;
            const player = gameState.player;

            const zoom = gameState.zoomLevel;
            let targetCameraX = player.x - canvas.width / (2 * zoom);
            let targetCameraY = player.y - canvas.height / (2 * zoom);

            const mapPixelWidth = mapManager.width * mapManager.tileSize;
            const mapPixelHeight = mapManager.height * mapManager.tileSize;

            camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width / zoom));
            camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height / zoom));

            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(-camera.x, -camera.y);
            mapManager.render(ctx, assets);
            itemManager.render(ctx); // 아이템을 그립니다.
            monsterManager.render(ctx);
            mercenaryManager.render(ctx);
            gameState.player.render(ctx);
            uiManager.renderHpBars(ctx, gameState.player, monsterManager.monsters);
            ctx.restore();

            uiManager.updateUI(gameState);
        }

        function update() {
            if (gameState.isGameOver) return;

            const player = gameState.player;
            if (player.attackCooldown > 0) player.attackCooldown--;

            let moveX = 0, moveY = 0;
            if (keysPressed['ArrowUp']) moveY -= player.speed;
            if (keysPressed['ArrowDown']) moveY += player.speed;
            if (keysPressed['ArrowLeft']) moveX -= player.speed;
            if (keysPressed['ArrowRight']) moveX += player.speed;

            if (moveX !== 0 || moveY !== 0) {
                const targetX = player.x + moveX;
                const targetY = player.y + moveY;
                const monsterToAttack = monsterManager.getMonsterAt(
                    targetX + player.width / 2,
                    targetY + player.height / 2
                );

                if (monsterToAttack && player.attackCooldown === 0) {
                    handleMonsterAttacked(monsterToAttack.id, player.attackPower);
                    player.attackCooldown = 30;
                } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                    player.x = targetX;
                    player.y = targetY;

                    // 아이템 줍기 로직
                    const itemToPick = itemManager.items.find(item =>
                        player.x < item.x + item.width &&
                        player.x + player.width > item.x &&
                        player.y < item.y + item.height &&
                        player.y + player.height > item.y
                    );

                    if (itemToPick) {
                        gameState.inventory.push(itemToPick); // 인벤토리에 추가
                        itemManager.removeItem(itemToPick);   // 맵에서 제거
                        console.log(`${itemToPick.name}을(를) 주웠습니다!`);
                    }
                }
            }

            const context = {
                player,
                mapManager,
                onPlayerAttacked: (damage, target) => handlePlayerAttacked(damage, target),
                onMonsterAttacked: handleMonsterAttacked,
            };
            metaAIManager.update(context);
        }

        function handleMonsterAttacked(monsterId, damage) {
            const gainedExp = monsterManager.handleAttackOnMonster(monsterId, damage);
            if (gainedExp > 0) {
                gameState.player.stats.addExp(gainedExp);
                checkForLevelUp();
            }
        }
        
        function handlePlayerAttacked(damage, target) {
            target.takeDamage(damage);
            if (target.hp <= 0) {
                if(target.isPlayer) {
                    gameState.isGameOver = true;
                    alert('게임 오버!');
                } else {
                    // 용병 사망 처리
                }
            }
        }
        
        function handleStatUp(stat) {
            if (gameState.statPoints > 0) {
                gameState.statPoints--;
                gameState.player.stats.allocatePoint(stat);
                gameState.player.stats.recalculate();
                gameState.player.hp = gameState.player.maxHp;
            }
        }
        
        function checkForLevelUp() {
            const stats = gameState.player.stats;
            while (stats.get('exp') >= stats.get('expNeeded')) {
                stats.levelUp();
                stats.recalculate();
                gameState.player.hp = stats.get('maxHp');
                gameState.statPoints += 5;
            }
        }
        
        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }
        uiManager.init(handleStatUp);
        gameLoop();
    });
};
