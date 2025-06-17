// main.js

import { CharacterFactory } from './src/factory.js';
import { EventManager } from './src/eventManager.js';
import { CombatLogManager, SystemLogManager } from './src/logManager.js';
import { CombatCalculator } from './src/combat.js';
import { MapManager } from './src/map.js';
import { MercenaryManager, MonsterManager, UIManager, ItemManager } from './src/managers.js';
import { AssetLoader } from './src/assetLoader.js';
import { MetaAIManager, STRATEGY } from './src/ai-managers.js';
import { SaveLoadManager } from './src/saveLoadManager.js';

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

        // === 1. 핵심 객체들 생성 ===
        const eventManager = new EventManager();
        const factory = new CharacterFactory(assets);
        const combatLogManager = new CombatLogManager(eventManager);
        const systemLogManager = new SystemLogManager(eventManager);
        const combatCalculator = new CombatCalculator(eventManager);
        const mapManager = new MapManager();
        const monsterManager = new MonsterManager(7, mapManager, assets, eventManager, factory);
        const mercenaryManager = new MercenaryManager(assets);
        const itemManager = new ItemManager(20, mapManager, assets);
        const uiManager = new UIManager();
        const metaAIManager = new MetaAIManager(eventManager);
        const saveLoadManager = new SaveLoadManager();

        const playerGroup = metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
        const monsterGroup = metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

        // === 2. 플레이어 생성 ===
        const startPos = mapManager.getRandomFloorPosition() || { x: mapManager.tileSize, y: mapManager.tileSize };
        const player = factory.create('player', {
            x: startPos.x,
            y: startPos.y,
            tileSize: mapManager.tileSize,
            groupId: playerGroup.id,
            image: assets.player,
            baseStats: { strength: 5, agility: 5, endurance: 5, movement: 5 }
        });
        const gameState = {
            player,
            inventory: [],
            gold: 100,
            statPoints: 5,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: 0.5
        };
        playerGroup.addMember(player);

        // === 3. 몬스터 생성 ===
        const monsters = [];
        for (let i = 0; i < 7; i++) {
            const pos = mapManager.getRandomFloorPosition();
            if (pos) {
                const monster = factory.create('monster', {
                    x: pos.x,
                    y: pos.y,
                    tileSize: mapManager.tileSize,
                    groupId: monsterGroup.id,
                    image: assets.monster,
                    baseStats: {}
                });
                monsters.push(monster);
            }
        }
        monsterManager.monsters = monsters;
        monsters.forEach(m => monsterGroup.addMember(m));

        // === 4. 용병 고용 로직 ===
        document.getElementById('hire-mercenary').onclick = () => {
            if (gameState.gold >= 50) {
                gameState.gold -= 50;
                const newMerc = factory.create('mercenary', {
                    x: gameState.player.x,
                    y: gameState.player.y,
                    tileSize: mapManager.tileSize,
                    groupId: playerGroup.id,
                    image: assets.mercenary,
                    baseStats: { strength: 2, agility: 2, endurance: 2, movement: 4 }
                });
                mercenaryManager.hire(newMerc);
                playerGroup.addMember(newMerc);
            }
        };

        document.getElementById('save-game-btn').onclick = () => {
            const saveData = saveLoadManager.gatherSaveData(gameState, monsterManager, mercenaryManager);
            console.log("--- GAME STATE SAVED (SNAPSHOT) ---");
            console.log(saveData);
            eventManager.publish('log', { message: '게임 상태 스냅샷이 콘솔에 저장되었습니다.' });
        };

        // === 2. 이벤트 구독 설정 ===
        // 공격 이벤트가 발생하면 CombatCalculator에 계산을 요청
        eventManager.subscribe('entity_attack', (data) => {
            combatCalculator.handleAttack(data);
        });

        // 피해량 계산 완료 이벤트를 받아 실제 피해 적용
        eventManager.subscribe('damage_calculated', (data) => {
            data.defender.takeDamage(data.damage);
            if (data.defender.hp <= 0) {
                eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
            }
        });

        // 죽음 이벤트가 발생하면 경험치 이벤트를 발행
        eventManager.subscribe('entity_death', (data) => {
            const { attacker, victim } = data;
            eventManager.publish('log', { message: `${victim.constructor.name}가 쓰러졌습니다.`, color: 'red' });

            if (!victim.isFriendly && (attacker.isPlayer || attacker.isFriendly)) {
                eventManager.publish('exp_gained', { player: attacker, exp: victim.expValue });
            }
        });

        // 게임오버 이벤트 구독 추가
        eventManager.subscribe('game_over', () => {
            gameState.isGameOver = true;
            alert("게임 오버!");
            combatLogManager.add('%c게임 오버!', 'magenta');
        });

        eventManager.subscribe('exp_gained', (data) => {
            const { player, exp } = data;
            player.stats.addExp(exp);
            combatLogManager.add(`%c${exp}의 경험치를 획득했습니다.`, 'yellow');
            checkForLevelUp(player);
        });

        eventManager.subscribe('drop_loot', (data) => {
            console.log(`${data.position.x}, ${data.position.y} 위치에 아이템 드랍!`);
        });

        // === 3. 게임 로직 ===
        // 공격 처리를 위한 함수는 이벤트만 발행하도록 변경
        function handleAttack(attacker, defender) {
            eventManager.publish('entity_attack', { attacker, defender });
        }

        const keysPressed = {};
        document.addEventListener('keydown', e => { keysPressed[e.key] = true; });
        document.addEventListener('keyup', e => { delete keysPressed[e.key]; });

        function render() {
            if (gameState.isGameOver) return;
            const camera = gameState.camera;
            const player = gameState.player;
            const zoom = gameState.zoomLevel;
            const targetCameraX = player.x - canvas.width / (2 * zoom);
            const targetCameraY = player.y - canvas.height / (2 * zoom);
            const mapPixelWidth = mapManager.width * mapManager.tileSize;
            const mapPixelHeight = mapManager.height * mapManager.tileSize;
            camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width / zoom));
            camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height / zoom));
            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(-camera.x, -camera.y);
            mapManager.render(ctx, assets);
            itemManager.render(ctx);
            monsterManager.render(ctx);
            mercenaryManager.render(ctx);
            gameState.player.render(ctx);
            uiManager.renderHpBars(ctx, gameState.player, monsterManager.monsters, mercenaryManager.mercenaries);
            ctx.restore();
            uiManager.updateUI(gameState);
        }

        function update() {
            if (gameState.isGameOver) return;
            eventManager.publish('debug', { tag: 'Frame', message: '--- Frame Update Start ---' });
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
                    handleAttack(player, monsterToAttack);
                    player.attackCooldown = 30;
                } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                    player.x = targetX;
                    player.y = targetY;
                }
            }
            const itemToPick = itemManager.items.find(item =>
                player.x < item.x + mapManager.tileSize &&
                player.x + player.width > item.x &&
                player.y < item.y + mapManager.tileSize &&
                player.y + player.height > item.y
            );
            if (itemToPick) {
                if (itemToPick.name === 'gold') {
                    gameState.gold += 10;
                    combatLogManager.add(`골드를 주웠습니다! 현재 골드: ${gameState.gold}`);
                } else {
                    gameState.inventory.push(itemToPick);
                    combatLogManager.add(`${itemToPick.name}을(를) 인벤토리에 추가했습니다.`);
                }
                itemManager.removeItem(itemToPick);
            }
            const context = { eventManager, player, mapManager, monsterManager, mercenaryManager };
            metaAIManager.update(context);
            eventManager.publish('debug', { tag: 'Frame', message: '--- Frame Update End ---' });
        }

        function checkForLevelUp(player) {
            const stats = player.stats;
            while (stats.get('exp') >= stats.get('expNeeded')) {
                stats.levelUp();
                stats.recalculate();
                player.hp = player.maxHp;
                gameState.statPoints += 5;
                eventManager.publish('level_up', { player: player, level: stats.get('level') });
            }
        }

        uiManager.init(stat => {
            if (gameState.statPoints > 0) {
                gameState.statPoints--;
                gameState.player.stats.allocatePoint(stat);
                gameState.player.stats.recalculate();
            }
        });

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        gameLoop();
    });
};
