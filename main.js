// main.js

import { EventManager } from './src/eventManager.js';
import { LogManager } from './src/logManager.js';
import { CombatCalculator } from './src/combat.js';
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

        const eventManager = new EventManager();
        const logManager = new LogManager();
        const combatCalculator = new CombatCalculator();
        const mapManager = new MapManager();
        const monsterManager = new MonsterManager(7, mapManager, assets);
        const mercenaryManager = new MercenaryManager(assets);
        const itemManager = new ItemManager(20, mapManager, assets);
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
            inventory: [],
            gold: 100,
            statPoints: 5,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: 0.5
        };
        playerGroup.addMember(gameState.player);

        function handleMonsterAttacked(monsterId, damage) {
            const { gainedExp, victimName } = monsterManager.handleAttackOnMonster(monsterId, damage);
            if (gainedExp > 0) {
                eventManager.publish('entity_death', { attacker: this, victimName: victimName, exp: gainedExp });
                metaAIManager.getGroup('dungeon_monsters').removeMember(monsterId);
            }
        }

        document.getElementById('hire-mercenary').onclick = () => {
            if (gameState.gold >= 50) {
                gameState.gold -= 50;
                const newMerc = mercenaryManager.hireMercenary(gameState.player.x, gameState.player.y, mapManager.tileSize, playerGroup.id);
                playerGroup.addMember(newMerc);
            }
        };

        eventManager.subscribe('entity_attack', ({ attacker, defender }) => {
            const damage = combatCalculator.calculateDamage(attacker, defender);
            defender.takeDamage(damage);
            logManager.add(`${attacker.constructor.name}가 ${defender.constructor.name}을(를) 공격하여 ${damage}의 피해를 입혔습니다.`);
            if (defender.hp <= 0) {
                eventManager.publish('entity_death', { attacker, victim: defender });
            }
        });

        eventManager.subscribe('entity_death', (payload) => {
            if (payload.victim) {
                const { attacker, victim } = payload;
                logManager.add(`${victim.constructor.name}가 쓰러졌습니다.`);
                if (!victim.isFriendly) {
                    monsterManager.monsters = monsterManager.monsters.filter(m => m.id !== victim.id);
                    monsterGroup.removeMember(victim.id);
                    attacker.stats.addExp(victim.expValue);
                    logManager.add(`${victim.expValue}의 경험치를 획득했습니다.`);
                    eventManager.publish('exp_gained', { player: attacker });
                } else if (victim.isPlayer) {
                    gameState.isGameOver = true;
                    alert('게임 오버!');
                }
            } else {
                const { attacker, victimName, exp } = payload;
                logManager.add(`${victimName}가 쓰러졌습니다.`);
                if (exp && attacker) {
                    attacker.stats.addExp(exp);
                    logManager.add(`${exp}의 경험치를 획득했습니다.`);
                    eventManager.publish('exp_gained', { player: attacker });
                }
                if (victimName === 'Player') {
                    gameState.isGameOver = true;
                    alert('게임 오버!');
                }
            }
        });

        eventManager.subscribe('exp_gained', ({ player }) => {
            const stats = player.stats;
            while (stats.get('exp') >= stats.get('expNeeded')) {
                stats.levelUp();
                stats.recalculate();
                player.hp = player.maxHp;
                if (player.isPlayer) gameState.statPoints += 5;
                logManager.add(`레벨 업! LV ${stats.get('level')} 달성!`);
            }
        });

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
                    eventManager.publish('entity_attack', { attacker: player, defender: monsterToAttack });
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
                    logManager.add(`골드를 주웠습니다! 현재 골드: ${gameState.gold}`);
                } else {
                    gameState.inventory.push(itemToPick);
                    logManager.add(`${itemToPick.name}을(를) 인벤토리에 추가했습니다.`);
                }
                itemManager.removeItem(itemToPick);
            }

            const context = {
                player,
                mapManager,
                onPlayerAttacked: (damage, target) => {
                    target.takeDamage(damage);
                    if (target.hp <= 0) {
                        eventManager.publish('entity_death', { attacker: null, victim: target });
                    }
                },
                onMonsterAttacked: (monsterId, damage) => {
                    handleMonsterAttacked.call(player, monsterId, damage);
                }
            };
            metaAIManager.update(context);
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
