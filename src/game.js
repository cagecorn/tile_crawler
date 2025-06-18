// src/game.js

import { SETTINGS } from '../config/gameSettings.js';
import { GameLoop } from './gameLoop.js';
import { InputHandler } from './inputHandler.js';
import { CharacterFactory, ItemFactory } from './factory.js';
import { EventManager } from './eventManager.js';
import { CombatLogManager, SystemLogManager } from './logManager.js';
import { CombatCalculator } from './combat.js';
import { MapManager } from './map.js';
import { MonsterManager, MercenaryManager, ItemManager, EquipmentManager, UIManager, VFXManager, SkillManager, SoundManager } from './managers/index.js';
import { AssetLoader } from './assetLoader.js';
import { MetaAIManager, STRATEGY } from './ai-managers.js';
import { SaveLoadManager } from './saveLoadManager.js';
import { LayerManager } from './layerManager.js';
import { PathfindingManager } from './pathfindingManager.js';
import { FogManager } from './fogManager.js';
import { NarrativeManager } from './narrativeManager.js';
import { TurnManager } from './turnManager.js';
import { SKILLS } from './data/skills.js';
import { EffectManager } from './managers/effectManager.js';

export class Game {
    constructor() {
        this.loader = new AssetLoader();
    }

    start() {
        this.loader.loadImage('player', 'assets/player.png');
        this.loader.loadImage('monster', 'assets/monster.png');
        this.loader.loadImage('epic_monster', 'assets/epic_monster.png');
        this.loader.loadImage('mercenary', 'assets/images/warrior.png');
        this.loader.loadImage('floor', 'assets/floor.png');
        this.loader.loadImage('wall', 'assets/wall.png');
        this.loader.loadImage('gold', 'assets/gold.png');
        this.loader.loadImage('potion', 'assets/potion.png');
        this.loader.loadImage('sword', 'assets/images/shortsword.png');
        this.loader.loadImage('bow', 'assets/images/bow.png');
        this.loader.loadImage('leather_armor', 'assets/images/leatherarmor.png');

        this.loader.onReady(assets => this.init(assets));
    }

    init(assets) {
        this.layerManager = new LayerManager();
        const canvas = this.layerManager.layers.mapBase;

        // === 1. 모든 매니저 및 시스템 생성 ===
        this.eventManager = new EventManager();
        this.inputHandler = new InputHandler(this.eventManager);
        this.combatLogManager = new CombatLogManager(this.eventManager);
        this.systemLogManager = new SystemLogManager(this.eventManager);
        this.combatCalculator = new CombatCalculator(this.eventManager);
        this.mapManager = new MapManager();
        this.saveLoadManager = new SaveLoadManager();
        this.turnManager = new TurnManager();
        this.narrativeManager = new NarrativeManager();
        this.effectManager = new EffectManager(this.eventManager);
        this.factory = new CharacterFactory(assets);

        // --- 새로 추가된 매니저들 생성 ---
        this.monsterManager = new MonsterManager();
        this.mercenaryManager = new MercenaryManager();
        this.itemManager = new ItemManager();
        this.equipmentManager = new EquipmentManager();
        this.uiManager = new UIManager();
        this.vfxManager = new VFXManager();
        this.skillManager = new SkillManager();
        this.soundManager = new SoundManager();

        this.itemFactory = new ItemFactory(assets);
        this.pathfindingManager = new PathfindingManager(this.mapManager);
        this.fogManager = new FogManager(this.mapManager.width, this.mapManager.height);
        // UIManager가 mercenaryManager에 접근할 수 있도록 설정
        this.uiManager.mercenaryManager = this.mercenaryManager;
        this.metaAIManager = new MetaAIManager(this.eventManager);

        this.playerGroup = this.metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
        this.monsterGroup = this.metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

        // === 2. 플레이어 생성 ===
        const startPos = this.mapManager.getRandomFloorPosition() || { x: this.mapManager.tileSize, y: this.mapManager.tileSize };
        const player = this.factory.create('player', {
            x: startPos.x,
            y: startPos.y,
            tileSize: this.mapManager.tileSize,
            groupId: this.playerGroup.id,
            image: assets.player,
            baseStats: { strength: 5, agility: 5, endurance: 5, movement: 5 }
        });
        this.gameState = {
            player,
            inventory: [],
            gold: 100,
            statPoints: 5,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: SETTINGS.DEFAULT_ZOOM,
            isPaused: false
        };
        this.playerGroup.addMember(player);

        // === 3. 몬스터 생성 ===
        const monsters = [];
        for (let i = 0; i < 7; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const monster = this.factory.create('monster', {
                    x: pos.x,
                    y: pos.y,
                    tileSize: this.mapManager.tileSize,
                    groupId: this.monsterGroup.id,
                    image: assets.monster,
                    baseStats: {}
                });
                monsters.push(monster);
            }
        }
        this.monsterManager.monsters = monsters;
        monsters.forEach(m => this.monsterGroup.addMember(m));

        // === 4. 용병 고용 로직 ===
        document.getElementById('hire-mercenary').onclick = () => {
            if (this.gameState.gold >= 50) {
                this.gameState.gold -= 50;
                const newMerc = this.mercenaryManager.hireMercenary(
                    'warrior',
                    this.gameState.player.x + this.mapManager.tileSize,
                    this.gameState.player.y,
                    this.mapManager.tileSize,
                    'player_party'
                );

                if (newMerc) {
                    this.playerGroup.addMember(newMerc);
                    this.eventManager.publish('log', { message: `전사 용병을 고용했습니다.` });
                }
            } else {
                this.eventManager.publish('log', { message: `골드가 부족합니다.` });
            }
        };

        document.getElementById('save-game-btn').onclick = () => {
            const saveData = this.saveLoadManager.gatherSaveData(this.gameState, this.monsterManager, this.mercenaryManager);
            console.log("--- GAME STATE SAVED (SNAPSHOT) ---");
            console.log(saveData);
            this.eventManager.publish('log', { message: '게임 상태 스냅샷이 콘솔에 저장되었습니다.' });
        };

        // === 메뉴 버튼 이벤트 리스너 추가 ===
        document.querySelectorAll('.menu-btn').forEach(button => {
            button.onclick = () => {
                const panelId = button.dataset.panelId;
                this.uiManager.showPanel(panelId);
                this.gameState.isPaused = true;
            };
        });

        this.setupEventListeners(assets, canvas);

        const gameLoop = new GameLoop(this.update, this.render);
        gameLoop.start();
    }

    setupEventListeners(assets, canvas) {
        const { eventManager, combatCalculator, monsterManager, mercenaryManager, mapManager, metaAIManager, pathfindingManager } = this;
        const gameState = this.gameState;

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
            this.combatLogManager.add('%c게임 오버!', 'magenta');
        });

        eventManager.subscribe('exp_gained', (data) => {
            const { player, exp } = data;
            player.stats.addExp(exp);
            this.combatLogManager.add(`%c${exp}의 경험치를 획득했습니다.`, 'yellow');
            this.checkForLevelUp(player);
        });

        eventManager.subscribe('drop_loot', (data) => {
            console.log(`${data.position.x}, ${data.position.y} 위치에 아이템 드랍!`);
        });

        eventManager.subscribe('skill_used', (data) => {
            const { caster, skill } = data;
            eventManager.publish('log', { message: `${caster.constructor.name} (이)가 ${skill.name} 스킬 사용!`, color: 'aqua' });

            if (skill.id === 'power_strike') {
                const nearestEnemy = this.findNearestEnemy(caster, monsterManager.monsters);
                if (nearestEnemy) {
                    const damage = caster.attackPower * skill.damageMultiplier;
                    eventManager.publish('entity_attack', { attacker: caster, defender: nearestEnemy, damage: damage });
                }
            }
        });

        // 스탯 변경 이벤트 구독 (효과 적용/해제 시 스탯 재계산)
        eventManager.subscribe('stats_changed', (data) => {
            data.entity.stats.recalculate();
        });

        eventManager.subscribe('key_pressed', (data) => {
            const key = data.key;
            if (gameState.isPaused || gameState.isGameOver) return;

            if (['1', '2', '3', '4'].includes(key)) {
                const skillIndex = parseInt(key) - 1;
                const player = gameState.player;
                const skillId = player.skills[skillIndex];

                if (skillId && (player.skillCooldowns[skillId] || 0) <= 0) {
                    const skillData = SKILLS[skillId];
                    if (player.mp >= skillData.manaCost) {
                        player.mp -= skillData.manaCost;
                        player.skillCooldowns[skillId] = skillData.cooldown;
                        eventManager.publish('skill_used', { caster: player, skill: skillData });
                    } else {
                        eventManager.publish('log', { message: '마나가 부족합니다.' });
                    }
                }
            }
        });

        this.uiManager.init({
            onStatUp: this.handleStatUp,
            onItemUse: (itemIndex) => {
                const item = gameState.inventory[itemIndex];
                if (!item) return;

                if (item.tags.includes('weapon') || item.tags.includes('armor') ||
                    item.type === 'weapon' || item.type === 'armor') {
                    this.uiManager._showEquipTargetPanel(item, gameState);
                } else if (item.name === 'potion') {
                    const playerChar = gameState.player;
                    playerChar.hp = Math.min(playerChar.maxHp, playerChar.hp + 5);
                    gameState.inventory.splice(itemIndex, 1);
                }
                this.uiManager.renderInventory(gameState);
            },
            onEquipItem: (entity, item) => {
                const targetInventory = entity.isPlayer ? gameState.inventory : (entity.inventory || gameState.inventory);
                this.equipmentManager.equip(entity, item, targetInventory);
                gameState.inventory = gameState.inventory.filter(i => i !== item);
                this.uiManager.renderInventory(gameState);
            }
        });

        // 용병 상세창 닫기 버튼 이벤트 핸들러 추가
        this.uiManager.closeMercDetailBtn.onclick = () => this.uiManager.hideMercenaryDetail();
        // 장착 대상 선택창 닫기 버튼 이벤트 핸들러 추가
        const closeEquipBtn = document.getElementById('close-equip-target-btn');
        if (closeEquipBtn) closeEquipBtn.onclick = () => this.uiManager.hideEquipTargetPanel();

        // === 캔버스 클릭 이벤트 추가 (가장 상단 weather-canvas에 연결) ===
        this.layerManager.layers.weather.addEventListener('click', (event) => {
            if (gameState.isGameOver) return;

            const rect = this.layerManager.layers.weather.getBoundingClientRect();
            const scale = gameState.zoomLevel;
            const worldX = (event.clientX - rect.left) / scale + gameState.camera.x;
            const worldY = (event.clientY - rect.top) / scale + gameState.camera.y;

            const clickedMerc = [...mercenaryManager.mercenaries].reverse().find(merc =>
                worldX >= merc.x && worldX <= merc.x + merc.width &&
                worldY >= merc.y && worldY <= merc.y + merc.height
            );

            if (clickedMerc) {
                this.uiManager.showMercenaryDetail(clickedMerc);
                return; // 용병을 클릭했으면 더 이상 진행 안 함
            }

            // 나중에 몬스터 클릭 시 정보창 띄우는 로직도 여기에 추가 가능
        });
    }

    findNearestEnemy(caster, enemies) {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dx = enemy.x - caster.x;
            const dy = enemy.y - caster.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    update = (deltaTime) => {
        const { gameState, mercenaryManager, monsterManager, mapManager, inputHandler, effectManager, turnManager, pathfindingManager, metaAIManager, eventManager } = this;
        if (gameState.isPaused || gameState.isGameOver) return;

        const allEntities = [gameState.player, ...mercenaryManager.mercenaries, ...monsterManager.monsters];
        effectManager.update(allEntities); // EffectManager 업데이트 호출
        turnManager.update(allEntities); // 턴 매니저 업데이트
        eventManager.publish('debug', { tag: 'Frame', message: '--- Frame Update Start ---' });
        const player = gameState.player;
        if (player.attackCooldown > 0) player.attackCooldown--;
        let moveX = 0, moveY = 0;
        if (inputHandler.keysPressed['ArrowUp']) moveY -= player.speed;
        if (inputHandler.keysPressed['ArrowDown']) moveY += player.speed;
        if (inputHandler.keysPressed['ArrowLeft']) moveX -= player.speed;
        if (inputHandler.keysPressed['ArrowRight']) moveX += player.speed;
        if (moveX !== 0 || moveY !== 0) {
            const targetX = player.x + moveX;
            const targetY = player.y + moveY;
            const monsterToAttack = monsterManager.getMonsterAt(
                targetX + player.width / 2,
                targetY + player.height / 2
            );
            if (monsterToAttack && player.attackCooldown === 0) {
                this.handleAttack(player, monsterToAttack);
                player.attackCooldown = 30;
            } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                player.x = targetX;
                player.y = targetY;
            }
        }
        const itemToPick = this.itemManager.items.find(item =>
            player.x < item.x + mapManager.tileSize &&
            player.x + player.width > item.x &&
            player.y < item.y + mapManager.tileSize &&
            player.y + player.height > item.y
        );
        if (itemToPick) {
            if (itemToPick.name === 'gold') {
                gameState.gold += 10;
                this.combatLogManager.add(`골드를 주웠습니다! 현재 골드: ${gameState.gold}`);
            } else {
                gameState.inventory.push(itemToPick);
                this.combatLogManager.add(`${itemToPick.name}을(를) 인벤토리에 추가했습니다.`);
            }
            this.itemManager.removeItem(itemToPick);
        }
        this.fogManager.update(player, mapManager);
        const context = { eventManager, player, mapManager, monsterManager, mercenaryManager, pathfindingManager };
        metaAIManager.update(context);
        eventManager.publish('debug', { tag: 'Frame', message: '--- Frame Update End ---' });
    }

    render = () => {
        const { layerManager, gameState, mapManager, itemManager, monsterManager, mercenaryManager, fogManager, uiManager } = this;
        const assets = this.loader.assets;
        const canvas = layerManager.layers.mapBase;

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

    handleAttack(attacker, defender) {
        this.eventManager.publish('entity_attack', { attacker, defender });
    }

    checkForLevelUp(player) {
        const stats = player.stats;
        while (stats.get('exp') >= stats.get('expNeeded')) {
            stats.levelUp();
            stats.recalculate();
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            this.gameState.statPoints += 5;
            this.eventManager.publish('level_up', { player: player, level: stats.get('level') });
        }
    }

    handleStatUp = (stat) => {
        if (this.gameState.statPoints > 0) {
            this.gameState.statPoints--;
            this.gameState.player.stats.allocatePoint(stat);
            this.gameState.player.stats.recalculate();
        }
    }
}
