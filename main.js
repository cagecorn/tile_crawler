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
                }
            }

            // [수정] 아이템 줍기 로직 전체를 아래 코드로 교체해주세요.
            const itemToPick = itemManager.items.find(item =>
                player.x < item.x + mapManager.tileSize &&
                player.x + player.width > item.x &&
                player.y < item.y + mapManager.tileSize &&
                player.y + player.height > item.y
            );

            if (itemToPick) {
                if (itemToPick.name === 'gold') {
                    gameState.gold += 10; // 예시: 골드 10씩 증가
                    console.log(`골드를 주웠습니다! 현재 골드: ${gameState.gold}`);
                } else {
                    // 포션을 포함한 다른 아이템은 인벤토리에 저장
                    gameState.inventory.push(itemToPick);
                    console.log(`${itemToPick.name}을(를) 인벤토리에 추가했습니다.`);
                }

                itemManager.removeItem(itemToPick); // 맵에서 아이템 제거
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
            if (gainedExp > 0) { // 몬스터가 죽어서 경험치를 얻었다면
                gameState.player.stats.addExp(gainedExp); // 플레이어에게 경험치 추가
                checkForLevelUp(); // 레벨업 체크!
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
                gameState.statPoints--; // 포인트 1 감소
                gameState.player.stats.allocatePoint(stat); // 해당 스탯에 포인트 투자
                gameState.player.stats.recalculate(); // 투자된 포인트에 맞춰 능력치 재계산
            }
        }
        
        // 기존 checkForLevelUp 함수를 삭제하고 아래 코드로 교체해주세요.
        function checkForLevelUp() {
            const stats = gameState.player.stats;
            // 현재 경험치가 필요 경험치보다 많거나 같은 동안 계속 반복
            while (stats.get('exp') >= stats.get('expNeeded')) {
                stats.levelUp(); // StatManager에 있는 levelUp 함수 호출
                stats.recalculate(); // 스탯 재계산
                gameState.player.hp = stats.get('maxHp'); // 체력을 최대로 회복
                gameState.statPoints += 5; // 레벨업 시 스탯 포인트 5 지급
                console.log("레벨 업! 현재 레벨: ", stats.get('level')); // 개발자 확인용 로그
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
