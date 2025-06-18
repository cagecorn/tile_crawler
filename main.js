// main.js

import { CharacterFactory, ItemFactory } from './src/factory.js';
import { EventManager } from './src/eventManager.js';
import { CombatLogManager, SystemLogManager } from './src/logManager.js';
import { CombatCalculator } from './src/combat.js';
import { MapManager } from './src/map.js';
import { MercenaryManager, MonsterManager, UIManager, ItemManager, EquipmentManager } from './src/managers.js';
import { AssetLoader } from './src/assetLoader.js';
import { MetaAIManager, STRATEGY } from './src/ai-managers.js';
import { SaveLoadManager } from './src/saveLoadManager.js';
import { LayerManager } from './src/layerManager.js';
import { PathfindingManager } from './src/pathfindingManager.js';
import { FogManager } from './src/fogManager.js';
import { NarrativeManager } from './src/narrativeManager.js';
import { TurnManager } from './src/turnManager.js';

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
    loader.loadImage('sword', 'assets/images/shortsword.png');
    loader.loadImage('bow', 'assets/images/bow.png');
    loader.loadImage('leather_armor', 'assets/images/leatherarmor.png');

    loader.onReady(assets => {
        const layerManager = new LayerManager();
        const canvas = layerManager.layers.mapBase;

        // === 1. 핵심 객체들 생성 ===
        const eventManager = new EventManager();
        const factory = new CharacterFactory(assets);
        const itemFactory = new ItemFactory(assets);
        const equipmentManager = new EquipmentManager(eventManager);
        ItemManager.prototype._spawnItems = function(count) {
            for(let i=0; i<count; i++) {
                const pos = this.mapManager.getRandomFloorPosition();
                this.items.push(itemFactory.create('short_sword', pos.x, pos.y, this.mapManager.tileSize));
            }
        };
        const combatLogManager = new CombatLogManager(eventManager);
        const systemLogManager = new SystemLogManager(eventManager);
        const combatCalculator = new CombatCalculator(eventManager);
        const mapManager = new MapManager();
        const pathfindingManager = new PathfindingManager(mapManager);
        const fogManager = new FogManager(mapManager.width, mapManager.height);
        const monsterManager = new MonsterManager(7, mapManager, assets, eventManager, factory);
        const mercenaryManager = new MercenaryManager(assets, factory);
        const itemManager = new ItemManager(20, mapManager, assets);
        const uiManager = new UIManager();
        const narrativeManager = new NarrativeManager();
        const turnManager = new TurnManager();
        // UIManager가 mercenaryManager에 접근할 수 있도록 설정
        uiManager.mercenaryManager = mercenaryManager;
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
            zoomLevel: 0.5,
            isPaused: false
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
                const newMerc = mercenaryManager.hireMercenary(
                    'warrior',
                    gameState.player.x + mapManager.tileSize,
                    gameState.player.y,
                    mapManager.tileSize,
                    'player_party'
                );

                if (newMerc) {
                    playerGroup.addMember(newMerc);
                    eventManager.publish('log', { message: `전사 용병을 고용했습니다.` });
                }
            } else {
                eventManager.publish('log', { message: `골드가 부족합니다.` });
            }
        };

        document.getElementById('save-game-btn').onclick = () => {
            const saveData = saveLoadManager.gatherSaveData(gameState, monsterManager, mercenaryManager);
            console.log("--- GAME STATE SAVED (SNAPSHOT) ---");
            console.log(saveData);
            eventManager.publish('log', { message: '게임 상태 스냅샷이 콘솔에 저장되었습니다.' });
        };

        // === 메뉴 버튼 이벤트 리스너 추가 ===
        document.querySelectorAll('.menu-btn').forEach(button => {
            button.onclick = () => {
                const panelId = button.dataset.panelId;
                uiManager.showPanel(panelId);
                gameState.isPaused = true;
            };
        });

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
                eventManager.publish('entity_removed', { victimId: data.defender.id });
            }
        });

        // 죽음 이벤트가 발생하면 경험치 이벤트를 발행
        eventManager.subscribe('entity_death', (data) => {
            const { attacker, victim } = data;
            eventManager.publish('log', { message: `${victim.constructor.name}가 쓰러졌습니다.`, color: 'red' });

            if (!victim.isFriendly && (attacker.isPlayer || attacker.isFriendly)) {
                if (attacker.isPlayer) {
                    // 플레이어가 직접 처치한 경우 전체 경험치 지급
                    eventManager.publish('exp_gained', { player: attacker, exp: victim.expValue });
                } else if (attacker.isFriendly) {
                    // 용병이 처치한 경우 용병과 플레이어가 경험치를 절반씩 나눔
                    const sharedExp = victim.expValue / 2;
                    eventManager.publish('exp_gained', { player: attacker, exp: sharedExp });
                    eventManager.publish('exp_gained', { player: gameState.player, exp: sharedExp });
                }
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

            layerManager.clear();

            const camera = gameState.camera;
            const zoom = gameState.zoomLevel;

            const targetCameraX = gameState.player.x - canvas.width / (2 * zoom);
            const targetCameraY = gameState.player.y - canvas.height / (2 * zoom);
            const mapPixelWidth = mapManager.width * mapManager.tileSize;
            const mapPixelHeight = mapManager.height * mapManager.tileSize;
            camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width / zoom));
            camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height / zoom));

            for (const key in layerManager.contexts) {
                const ctx = layerManager.contexts[key];
                ctx.save();
                ctx.scale(zoom, zoom);
                ctx.translate(-camera.x, -camera.y);
            }

            const contexts = layerManager.contexts;

            mapManager.render(contexts.mapBase, contexts.mapDecor, assets);
            itemManager.render(contexts.mapDecor);

            // buffManager.renderGroundAuras(contexts.groundFx, ...); // (미래 구멍)

            monsterManager.render(contexts.entity);
            mercenaryManager.render(contexts.entity);
            gameState.player.render(contexts.entity);

            fogManager.render(contexts.vfx, mapManager.tileSize);
            uiManager.renderHpBars(contexts.vfx, gameState.player, monsterManager.monsters, mercenaryManager.mercenaries);

            // weatherManager.render(contexts.weather); // (미래 구멍)

            for (const key in layerManager.contexts) {
                layerManager.contexts[key].restore();
            }

            uiManager.updateUI(gameState);
        }

       function update() {
           if (gameState.isPaused || gameState.isGameOver) return;

            const allEntities = [gameState.player, ...mercenaryManager.mercenaries, ...monsterManager.monsters];
            turnManager.update(allEntities); // 턴 매니저 업데이트
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
            fogManager.update(player, mapManager);
            const context = { eventManager, player, mapManager, monsterManager, mercenaryManager, pathfindingManager };
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

        function handleStatUp(stat) {
            if (gameState.statPoints > 0) {
                gameState.statPoints--;
                gameState.player.stats.allocatePoint(stat);
                gameState.player.stats.recalculate();
            }
        }

        uiManager.init({
            onStatUp: handleStatUp,
            onItemUse: (itemIndex) => {
                const item = gameState.inventory[itemIndex];
                if (!item) return;

                if (item.tags.includes('weapon') || item.tags.includes('armor') ||
                    item.type === 'weapon' || item.type === 'armor') {
                    uiManager._showEquipTargetPanel(item, gameState);
                } else if (item.name === 'potion') {
                    const playerChar = gameState.player;
                    playerChar.hp = Math.min(playerChar.maxHp, playerChar.hp + 5);
                    gameState.inventory.splice(itemIndex, 1);
                }
                uiManager.renderInventory(gameState);
            },
           onEquipItem: (entity, item) => {
                const targetInventory = entity.isPlayer ? gameState.inventory : (entity.inventory || gameState.inventory);
                equipmentManager.equip(entity, item, targetInventory);
                gameState.inventory = gameState.inventory.filter(i => i !== item);
                uiManager.renderInventory(gameState);
            }
        });

        // 용병 상세창 닫기 버튼 이벤트 핸들러 추가
        uiManager.closeMercDetailBtn.onclick = () => uiManager.hideMercenaryDetail();
        // 장착 대상 선택창 닫기 버튼 이벤트 핸들러 추가
        const closeEquipBtn = document.getElementById('close-equip-target-btn');
        if (closeEquipBtn) closeEquipBtn.onclick = () => uiManager.hideEquipTargetPanel();

        // === 캔버스 클릭 이벤트 추가 (가장 상단 weather-canvas에 연결) ===
        layerManager.layers.weather.addEventListener('click', (event) => {
            if (gameState.isGameOver) return;

            const rect = layerManager.layers.weather.getBoundingClientRect();
            const scale = gameState.zoomLevel;
            const worldX = (event.clientX - rect.left) / scale + gameState.camera.x;
            const worldY = (event.clientY - rect.top) / scale + gameState.camera.y;

            const clickedMerc = [...mercenaryManager.mercenaries].reverse().find(merc =>
                worldX >= merc.x && worldX <= merc.x + merc.width &&
                worldY >= merc.y && worldY <= merc.y + merc.height
            );

            if (clickedMerc) {
                uiManager.showMercenaryDetail(clickedMerc);
                return; // 용병을 클릭했으면 더 이상 진행 안 함
            }

            // 나중에 몬스터 클릭 시 정보창 띄우는 로직도 여기에 추가 가능
        });

       function gameLoop() {
            if (!gameState.isPaused) update();
            render();
            requestAnimationFrame(gameLoop);
       }

        gameLoop();
    });
};
