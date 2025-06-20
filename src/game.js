// src/game.js

import { SETTINGS } from '../config/gameSettings.js';
import { GameLoop } from './gameLoop.js';
import { InputHandler } from './inputHandler.js';
import { CharacterFactory, ItemFactory } from './factory.js';
import { EventManager } from './managers/eventManager.js';
import { CombatLogManager, SystemLogManager } from './managers/logManager.js';
import { CombatCalculator } from './combat.js';
import { TagManager } from './managers/tagManager.js';
import { MapManager } from './map.js';
import { AquariumMapManager } from './aquariumMap.js';
import { AquariumManager, AquariumInspector } from './managers/aquariumManager.js';
import * as Managers from './managers/index.js'; // managers/index.js에서 모든 매니저를 한 번에 불러옴
import { AssetLoader } from './assetLoader.js';
import { MetaAIManager, STRATEGY } from './managers/ai-managers.js';
import { SaveLoadManager } from './managers/saveLoadManager.js';
import { LayerManager } from './managers/layerManager.js';
import { PathfindingManager } from './managers/pathfindingManager.js';
import { MovementManager } from './managers/movementManager.js';
import { FogManager } from './managers/fogManager.js';
import { NarrativeManager } from './managers/narrativeManager.js';
import { TurnManager } from './managers/turnManager.js';
import { SKILLS } from './data/skills.js';
import { Item } from './entities.js';
import { rollOnTable } from './utils/random.js';
import { getMonsterLootTable } from './data/tables.js';

export class Game {
    constructor() {
        this.loader = new AssetLoader();
    }

    start() {
        this.loader.loadImage('player', 'assets/player.png');
        this.loader.loadImage('monster', 'assets/monster.png');
        this.loader.loadImage('epic_monster', 'assets/epic_monster.png');
        // 병종별 용병 이미지를 로드한다
        this.loader.loadImage('warrior', 'assets/images/warrior.png');
        this.loader.loadImage('archer', 'assets/images/archer.png');
        this.loader.loadImage('healer', 'assets/images/healer.png');
        this.loader.loadImage('wizard', 'assets/images/wizard.png');
        this.loader.loadImage('summoner', 'assets/images/summoner.png');
        // 기존 호환성을 위해 기본 mercenary 키도 전사 이미지로 유지
        this.loader.loadImage('mercenary', 'assets/images/warrior.png');
        this.loader.loadImage('floor', 'assets/floor.png');
        this.loader.loadImage('wall', 'assets/wall.png');
        this.loader.loadImage('gold', 'assets/gold.png');
        this.loader.loadImage('potion', 'assets/potion.png');
        this.loader.loadImage('sword', 'assets/images/shortsword.png');
        this.loader.loadImage('bow', 'assets/images/bow.png');
        this.loader.loadImage('arrow', 'assets/images/arrow.png');
        this.loader.loadImage('leather_armor', 'assets/images/leatherarmor.png');
        this.loader.loadImage('plate-armor', 'assets/images/plate-armor.png');
        this.loader.loadImage('violin-bow', 'assets/images/violin-bow.png');
        this.loader.loadImage('fire-ball', 'assets/images/fire-ball.png');
        this.loader.loadImage('ice-ball', 'assets/images/ice-ball-effect.png');
        this.loader.loadImage('strike-effect', 'assets/images/strike-effect.png');
        this.loader.loadImage('healing-effect', 'assets/images/healing-effect.png');
        this.loader.loadImage('corpse', 'assets/images/corpse.png');
        this.loader.loadImage('parasite', 'assets/images/parasite.png');
        this.loader.loadImage('leech', 'assets/images/parasite.png');
        this.loader.loadImage('worm', 'assets/images/parasite.png');

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
        this.tagManager = new TagManager();
        this.combatCalculator = new CombatCalculator(this.eventManager, this.tagManager);
        // Player begins in the Aquarium map for feature testing
        this.mapManager = new AquariumMapManager();
        this.saveLoadManager = new SaveLoadManager();
        this.turnManager = new TurnManager();
        this.narrativeManager = new NarrativeManager();
        this.factory = new CharacterFactory(assets);

        // --- 매니저 생성 부분 수정 ---
        this.managers = {};
        // ItemManager를 먼저 생성합니다.
        this.itemManager = new Managers.ItemManager(this.eventManager, assets, this.factory);
        this.managers.ItemManager = this.itemManager;

        // VFXManager는 ItemManager와 EventManager가 모두 필요합니다.
        this.managers.VFXManager = new Managers.VFXManager(this.eventManager, this.itemManager);

        const otherManagerNames = Object.keys(Managers).filter(name => name !== 'VFXManager' && name !== 'ItemManager');
        for (const managerName of otherManagerNames) {
            this.managers[managerName] = new Managers[managerName](this.eventManager, assets, this.factory);
        }

        this.monsterManager = this.managers.MonsterManager;
        this.mercenaryManager = this.managers.MercenaryManager;
        this.itemManager = this.managers.ItemManager;
        this.equipmentManager = this.managers.EquipmentManager;
        this.uiManager = this.managers.UIManager;
        this.vfxManager = this.managers.VFXManager;
        this.skillManager = this.managers.SkillManager;
        this.soundManager = this.managers.SoundManager;
        this.effectManager = this.managers.EffectManager;
        this.projectileManager = this.managers.ProjectileManager;
        this.projectileManager.vfxManager = this.vfxManager;
        this.itemAIManager = new Managers.ItemAIManager(
            this.eventManager,
            this.projectileManager,
            this.vfxManager
        );
        this.equipmentRenderManager = this.managers.EquipmentRenderManager;
        this.mercenaryManager.equipmentRenderManager = this.equipmentRenderManager;
        this.traitManager = this.managers.TraitManager;
        this.mercenaryManager.setTraitManager(this.traitManager);
        this.monsterManager.setTraitManager(this.traitManager);
        this.parasiteManager = this.managers.ParasiteManager;

        // 매니저 간 의존성 연결
        this.skillManager.setEffectManager(this.effectManager);
        this.equipmentManager.setTagManager(this.tagManager);

        this.itemFactory = new ItemFactory(assets);
        this.pathfindingManager = new PathfindingManager(this.mapManager);
        this.motionManager = new Managers.MotionManager(this.mapManager, this.pathfindingManager);
        this.movementManager = new MovementManager(this.mapManager);
        this.fogManager = new FogManager(this.mapManager.width, this.mapManager.height);
        this.particleDecoratorManager = new Managers.ParticleDecoratorManager();
        this.particleDecoratorManager.setManagers(this.vfxManager, this.mapManager);
        this.particleDecoratorManager.init();
        // UIManager가 mercenaryManager에 접근할 수 있도록 설정
        this.uiManager.mercenaryManager = this.mercenaryManager;
        this.uiManager.particleDecoratorManager = this.particleDecoratorManager;
        this.uiManager.vfxManager = this.vfxManager;
        this.metaAIManager = new MetaAIManager(this.eventManager);
        this.aquariumManager = new AquariumManager(
            this.eventManager,
            this.monsterManager,
            this.itemManager,
            this.mapManager,
            this.factory,
            this.itemFactory,
            this.vfxManager,
            this.traitManager
        );
        this.aquariumInspector = new AquariumInspector(this.aquariumManager);

        for (let i = 0; i < 20; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const isGold = Math.random() < 0.6;
                const itemName = isGold ? 'gold' : 'potion';
                const item = this.itemFactory.create(itemName, pos.x, pos.y, this.mapManager.tileSize);
                if (item) this.itemManager.addItem(item);
            }
        }

        // example feature: spawn several monsters for poison debuff testing
        for (let i = 0; i < 10; i++) {
            this.aquariumManager.addTestingFeature({
                type: 'monster',
                image: assets.monster,
                baseStats: { }
            });
        }
        // Add a single epic monster to highlight new boss-level enemies
        this.aquariumManager.addTestingFeature({
            type: 'monster',
            image: assets.epic_monster,
            baseStats: {
                sizeInTiles_w: 2,
                sizeInTiles_h: 2,
                strength: 5,
                agility: 4,
                endurance: 20,
                movement: 6,
                expValue: 100
            }
        });
        this.aquariumInspector.run();

        this.playerGroup = this.metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
        this.metaAIManager.setGroupStrategy('player_party', STRATEGY.IDLE); // prevent player AI actions
        this.monsterGroup = this.metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

        // === 2. 플레이어 생성 ===
        const startPos = this.mapManager.getRandomFloorPosition() || { x: this.mapManager.tileSize, y: this.mapManager.tileSize };
        const player = this.factory.create('player', {
            x: startPos.x,
            y: startPos.y,
            tileSize: this.mapManager.tileSize,
            groupId: this.playerGroup.id,
            image: assets.player,
            baseStats: { strength: 5, agility: 5, endurance: 15, movement: 10 }
        });
        player.ai = null; // disable any automatic skills for the player
        player.equipmentRenderManager = this.equipmentRenderManager;
        this.gameState = {
            player,
            inventory: [],
            gold: 1000,
            statPoints: 5,
            camera: { x: 0, y: 0 },
            isGameOver: false,
            zoomLevel: SETTINGS.DEFAULT_ZOOM,
            isPaused: false
        };
        this.playerGroup.addMember(player);

        // 초기 아이템 배치
        const potion = this.itemFactory.create(
                                'potion',
                                player.x + this.mapManager.tileSize,
                                player.y,
                                this.mapManager.tileSize);
        const dagger = this.itemFactory.create('short_sword',
                                player.x - this.mapManager.tileSize,
                                player.y,
                                this.mapManager.tileSize);
        const bow = this.itemFactory.create('long_bow',
                                player.x,
                                player.y + this.mapManager.tileSize,
                                this.mapManager.tileSize);
        const violinBow = this.itemFactory.create('violin_bow',
                                player.x + this.mapManager.tileSize,
                                player.y - this.mapManager.tileSize,
                                this.mapManager.tileSize);
        const plateArmor = this.itemFactory.create('plate_armor',
                                player.x + this.mapManager.tileSize * 2,
                                player.y - this.mapManager.tileSize,
                                this.mapManager.tileSize);
        this.itemManager.addItem(potion);
        if (dagger) this.itemManager.addItem(dagger);
        if (bow) this.itemManager.addItem(bow);
        if (violinBow) this.itemManager.addItem(violinBow);
        if (plateArmor) this.itemManager.addItem(plateArmor);

        // === 3. 몬스터 생성 ===
        const monsters = [];
        for (let i = 0; i < 80; i++) {
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
                monster.equipmentRenderManager = this.equipmentRenderManager;
                // 몬스터 초기 장비 및 소지품 설정
                monster.consumables = [];
                monster.consumableCapacity = 4;
                const itemCount = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < itemCount; j++) {
                    const id = rollOnTable(getMonsterLootTable());
                    const item = this.itemFactory.create(
                        id,
                        monster.x,
                        monster.y,
                        this.mapManager.tileSize
                    );
                    if (!item) continue;
                    if (
                        item.tags.includes('weapon') ||
                        item.type === 'weapon' ||
                        item.tags.includes('armor') ||
                        item.type === 'armor'
                    ) {
                        this.equipmentManager.equip(monster, item, null);
                    } else {
                        monster.addConsumable(item);
                    }
                }
                if (Math.random() < 0.15) {
                    const pid = Math.random() < 0.5 ? 'parasite_leech' : 'parasite_worm';
                    const pItem = this.itemFactory.create(
                        pid,
                        monster.x,
                        monster.y,
                        this.mapManager.tileSize
                    );
                    if (pItem) this.parasiteManager.equip(monster, pItem);
                }
                if (Math.random() < 0.3) {
                    const bow = this.itemFactory.create(
                        'long_bow',
                        monster.x,
                        monster.y,
                        this.mapManager.tileSize
                    );
                    if (bow) this.equipmentManager.equip(monster, bow, null);
                }
                monsters.push(monster);
            }
        }
        this.monsterManager.monsters = monsters;
        monsters.forEach(m => this.monsterGroup.addMember(m));

        // === 4. 용병 고용 로직 ===
        const hireBtn = document.getElementById('hire-mercenary');
        if (hireBtn) {
            hireBtn.onclick = () => {
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
        }

        const archerBtn = document.getElementById('hire-archer');
        if (archerBtn) {
            archerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'archer',
                        this.gameState.player.x + this.mapManager.tileSize,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('log', { message: `궁수 용병을 고용했습니다.` });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const healerBtn = document.getElementById('hire-healer');
        if (healerBtn) {
            healerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'healer',
                        this.gameState.player.x + this.mapManager.tileSize,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('log', { message: `힐러 용병을 고용했습니다.` });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const wizardBtn = document.getElementById('hire-wizard');
        if (wizardBtn) {
            wizardBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'wizard',
                        this.gameState.player.x + this.mapManager.tileSize,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('log', { message: `마법사 용병을 고용했습니다.` });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const summonerBtn = document.getElementById('hire-summoner');
        if (summonerBtn) {
            summonerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'summoner',
                        this.gameState.player.x + this.mapManager.tileSize,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.playerGroup.addMember(newMerc);
                        this.eventManager.publish('log', { message: `소환사 용병을 고용했습니다.` });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const saveBtn = document.getElementById('save-game-btn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const saveData = this.saveLoadManager.gatherSaveData(this.gameState, this.monsterManager, this.mercenaryManager);
                console.log("--- GAME STATE SAVED (SNAPSHOT) ---");
                console.log(saveData);
                this.eventManager.publish('log', { message: '게임 상태 스냅샷이 콘솔에 저장되었습니다.' });
            };
        }

        // === 메뉴 버튼 이벤트 리스너 수정 ===
        const playerInfoBtn = document.querySelector('.menu-btn[data-panel-id="character-sheet-panel"]');
        if (playerInfoBtn) {
            playerInfoBtn.onclick = () => {
                this.uiManager.showCharacterSheet(this.gameState.player);
                this.gameState.isPaused = true;
            };
        }
        document.querySelectorAll('.menu-btn').forEach(button => {
            if (button.dataset.panelId !== 'character-sheet-panel') {
                button.onclick = () => {
                    const panelId = button.dataset.panelId;
                    this.uiManager.showPanel(panelId);
                    this.gameState.isPaused = true;
                };
            }
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

            const { attacker, defender, skill } = data;
            if (!skill || !skill.projectile) {
                const img = assets['strike-effect'];
                if (img) {
                    this.vfxManager.addSpriteEffect(
                        img,
                        defender.x + defender.width / 2,
                        defender.y + defender.height / 2,
                        {
                            width: defender.width,
                            height: defender.height,
                            blendMode: 'screen'
                        }
                    );
                    this.vfxManager.addParticleBurst(
                        defender.x + defender.width / 2,
                        defender.y + defender.height / 2,
                        { color: 'rgba(200,0,0,0.9)', count: 12 }
                    );
                }
            }
        });

        // 피해량 계산 완료 이벤트를 받아 실제 피해 적용
        eventManager.subscribe('damage_calculated', (data) => {
            data.defender.takeDamage(data.damage);
            eventManager.publish('entity_damaged', { attacker: data.attacker, defender: data.defender, damage: data.damage });
            if (data.defender.hp <= 0) {
                eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
            }
        });

        eventManager.subscribe('entity_damaged', (data) => {
            this.vfxManager.flashEntity(data.defender);
        });

        // 죽음 이벤트가 발생하면 경험치 획득 및 애니메이션을 시작
        eventManager.subscribe('entity_death', (data) => {
            const { attacker, victim } = data;

            victim.isDying = true;
            this.vfxManager.addDeathAnimation(victim, 'explode');

            eventManager.publish('log', { message: `${victim.constructor.name}가 쓰러졌습니다.`, color: 'red' });

            if (victim.unitType === 'monster') {
                const dropPool = [];
                if (victim.consumables) dropPool.push(...victim.consumables);
                if (victim.equipment) {
                    for (const slot in victim.equipment) {
                        const it = victim.equipment[slot];
                        if (it) dropPool.push(it);
                    }
                }
                const dropCount = Math.min(dropPool.length, Math.floor(Math.random() * 6));
                for (let i = 0; i < dropCount; i++) {
                    const idx = Math.floor(Math.random() * dropPool.length);
                    const item = dropPool.splice(idx, 1)[0];
                    const startPos = { x: victim.x, y: victim.y };
                    const endPos = this.findRandomEmptyAdjacentTile(victim.x, victim.y) || startPos;
                    item.x = endPos.x;
                    item.y = endPos.y;
                    this.itemManager.addItem(item);
                    this.vfxManager.addItemPopAnimation(item, startPos, endPos);
                }
            }

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

            // 몬스터 시체 생성
            if (victim.unitType === 'monster' && assets.corpse) {
                const corpse = new Item(
                    victim.x,
                    victim.y,
                    this.mapManager.tileSize,
                    'corpse',
                    assets.corpse
                );
                corpse.bobbingSpeed = 0;
                corpse.bobbingAmount = 0;
                corpse.baseY = victim.y;
                this.itemManager.addItem(corpse);
            }
        });

        // 게임오버 이벤트 구독 추가
        eventManager.subscribe('game_over', () => {
            gameState.isGameOver = true;
            alert("게임 오버!");
            this.combatLogManager.add('%c게임 오버!');
        });

        eventManager.subscribe('exp_gained', (data) => {
            const { player, exp } = data;
            player.stats.addExp(exp);
            this.combatLogManager.add(`%c${exp}의 경험치를 획득했습니다.`);
            this.checkForLevelUp(player);
        });

        eventManager.subscribe('drop_loot', (data) => {
            const lootTable = getMonsterLootTable(data.monsterType);
            const droppedId = rollOnTable(lootTable);
            if (!droppedId) return;

            const startPos = { x: data.position.x, y: data.position.y };
            const endPos = this.findRandomEmptyAdjacentTile(startPos.x, startPos.y);
            if (!endPos) return;

            const item = this.itemFactory.create(droppedId, endPos.x, endPos.y, this.mapManager.tileSize);
            if (!item) return;

            this.vfxManager.addItemPopAnimation(item, startPos, endPos);
        });

        eventManager.subscribe('skill_used', (data) => {
            const { caster, skill, target } = data;
            eventManager.publish('log', { message: `${caster.constructor.name} (이)가 ${skill.name} 스킬 사용!`, color: 'aqua' });
            this.vfxManager.castEffect(caster, skill);

            if (skill.tags && (skill.tags.includes('healing') || skill.tags.includes('회복'))) {
                const healTarget = target || caster;
                const amount = skill.healAmount || 10;
                const prevHp = healTarget.hp;
                healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + amount);
                const healed = healTarget.hp - prevHp;
                if (healed > 0) {
                    eventManager.publish('log', { message: `${healTarget.constructor.name}의 체력이 ${healed} 회복되었습니다.`, color: 'lime' });
                }
                this.particleDecoratorManager.playHealingEffect(healTarget);
                const img = assets['healing-effect'];
                if (img) {
                    this.vfxManager.addSpriteEffect(
                        img,
                        healTarget.x + healTarget.width / 2,
                        healTarget.y + healTarget.height / 2,
                        {
                            width: healTarget.width,
                            height: healTarget.height,
                            blendMode: 'screen'
                        }
                    );
                }
            }

            if (skill.teleport) {
                this.handleTeleportSkill(caster);
            }

            if (skill.tags.includes('attack')) {
                const range = skill.range || Infinity;
                const nearestEnemy = this.findNearestEnemy(caster, monsterManager.monsters, range);
                if (nearestEnemy) {
                    if (skill.dashRange) {
                        this.motionManager.dashTowards(caster, nearestEnemy, skill.dashRange);
                    }
                    const hits = skill.hits || 1;
                    for (let i = 0; i < hits; i++) {
                        if (skill.projectile) {
                            this.projectileManager.create(caster, nearestEnemy, skill);
                        } else {
                            eventManager.publish('entity_attack', { attacker: caster, defender: nearestEnemy, skill: skill });
                        }
                    }
                } else {
                    eventManager.publish('log', { message: '시야에 대상이 없습니다.' });
                    caster.mp += skill.manaCost;
                    caster.skillCooldowns[skill.id] = 0;
                }
            }
        });

        eventManager.subscribe('vfx_request', (data) => {
            if (data.type === 'dash_trail') {
                this.vfxManager.createDashTrail(data.from.x, data.from.y, data.to.x, data.to.y);
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
                        eventManager.publish('skill_used', { caster: player, skill: skillData, target: null });
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
                } else if (item.baseId === 'potion' || item.name === 'potion') {
                    const playerChar = gameState.player;
                    playerChar.hp = Math.min(playerChar.maxHp, playerChar.hp + 5);
                    this.particleDecoratorManager.playHealingEffect(playerChar);
                    if (item.quantity > 1) {
                        item.quantity -= 1;
                    } else {
                        gameState.inventory.splice(itemIndex, 1);
                    }
                }
                this.uiManager.renderInventory(gameState);
            },
            onEquipItem: (entity, item) => {
                const targetInventory = entity.isPlayer ? gameState.inventory : (entity.consumables || entity.inventory || gameState.inventory);
                this.equipmentManager.equip(entity, item, targetInventory);
                gameState.inventory = gameState.inventory.filter(i => i !== item);
                this.uiManager.renderInventory(gameState);
            }
        });

        // 닫기 버튼 공통 로직 수정
        document.querySelectorAll('.close-btn').forEach(button => {
            button.onclick = () => {
                const panel = button.closest('.modal-panel');
                if (panel) panel.classList.add('hidden');
                this.gameState.isPaused = false;
            };
        });

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
                if (this.uiManager.showMercenaryDetail) {
                    this.uiManager.showMercenaryDetail(clickedMerc);
                    if (this.uiManager.mercDetailPanel)
                        this.gameState.isPaused = true;
                }
                return; // 용병을 클릭했으면 더 이상 진행 안 함
            }

            const clickedMonster = [...monsterManager.monsters].reverse().find(mon =>
                worldX >= mon.x && worldX <= mon.x + mon.width &&
                worldY >= mon.y && worldY <= mon.y + mon.height
            );

            if (clickedMonster) {
                if (this.uiManager.showCharacterSheet) {
                    this.uiManager.showCharacterSheet(clickedMonster);
                    this.gameState.isPaused = true;
                }
                return;
            }
        });
    }

    findNearestEnemy(caster, enemies, range = Infinity) {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dx = enemy.x - caster.x;
            const dy = enemy.y - caster.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minDist && dist <= range) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    update = (deltaTime) => {
        const { gameState, mercenaryManager, monsterManager, itemManager, mapManager, inputHandler, effectManager, turnManager, pathfindingManager, metaAIManager, eventManager } = this;
        if (gameState.isPaused || gameState.isGameOver) return;

        const allEntities = [gameState.player, ...mercenaryManager.mercenaries, ...monsterManager.monsters];
        gameState.player.applyRegen();
        effectManager.update(allEntities); // EffectManager 업데이트 호출
        turnManager.update(allEntities, { eventManager, player: gameState.player, parasiteManager: this.parasiteManager }); // 턴 매니저 업데이트
        itemManager.update();
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
                this.handleAttack(player, monsterToAttack, null);
                const baseCd = 30;
                player.attackCooldown = Math.max(1, Math.round(baseCd / (player.attackSpeed || 1)));
            } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                player.x = targetX;
                player.y = targetY;
            } else {
                if (!mapManager.isWallAt(targetX, player.y, player.width, player.height)) {
                    player.x = targetX;
                } else if (!mapManager.isWallAt(player.x, targetY, player.width, player.height)) {
                    player.y = targetY;
                }
            }
        }
        const itemToPick = this.itemManager.items.find(item =>
            player.x < item.x + mapManager.tileSize &&
            player.x + player.width > item.x &&
            player.y < item.y + mapManager.tileSize &&
            player.y + player.height > item.y
        );
        if (itemToPick) {
            if (itemToPick.baseId === 'gold' || itemToPick.name === 'gold') {
                gameState.gold += 10;
                this.combatLogManager.add(`골드를 주웠습니다! 현재 골드: ${gameState.gold}`);
            } else {
                const existing = gameState.inventory.find(i => i.baseId === itemToPick.baseId);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    gameState.inventory.push(itemToPick);
                }
                this.combatLogManager.add(`${itemToPick.name}을(를) 인벤토리에 추가했습니다.`);
            }
            this.itemManager.removeItem(itemToPick);
        }
        this.fogManager.update(player, mapManager);
        const context = { eventManager, player, mapManager, monsterManager, mercenaryManager, pathfindingManager, movementManager: this.movementManager, projectileManager: this.projectileManager };
        metaAIManager.update(context);
        this.itemAIManager.update(context);
        this.projectileManager.update();
        this.vfxManager.update();
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
        this.projectileManager.render(contexts.vfx);
        this.vfxManager.render(contexts.vfx);

        // weatherManager.render(contexts.weather); // (미래 구멍)

        for (const key in layerManager.contexts) {
            layerManager.contexts[key].restore();
        }

        uiManager.updateUI(gameState);
    }

    handleAttack(attacker, defender, skill = null) {
        this.eventManager.publish('entity_attack', { attacker, defender, skill });
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

    handleTeleportSkill(caster) {
        if (!caster.teleportSavedPos) {
            caster.teleportSavedPos = { x: caster.x, y: caster.y };
            this.eventManager.publish('log', { message: '🌀 위치를 저장했습니다.' });
        } else if (!caster.teleportReturnPos) {
            caster.teleportReturnPos = { x: caster.x, y: caster.y };
            caster.x = caster.teleportSavedPos.x;
            caster.y = caster.teleportSavedPos.y;
            this.eventManager.publish('log', { message: '🌀 저장된 위치로 이동했습니다.' });
        } else {
            const { x, y } = caster.teleportReturnPos;
            caster.teleportReturnPos = null;
            caster.x = x;
            caster.y = y;
            this.eventManager.publish('log', { message: '🌀 이전 위치로 돌아왔습니다.' });
        }
    }

    /**
     * 지정된 좌표 인근의 비어 있는 임의 타일을 찾는다.
     * @param {number} centerX
     * @param {number} centerY
     * @returns {{x:number,y:number}|null}
     */
    findRandomEmptyAdjacentTile(centerX, centerY) {
        const tileSize = this.mapManager.tileSize;
        const baseX = Math.floor(centerX / tileSize);
        const baseY = Math.floor(centerY / tileSize);
        const dirs = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 },                   { x: 1, y: 0 },
            { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
        ];
        dirs.sort(() => Math.random() - 0.5);
        for (const d of dirs) {
            const tileX = baseX + d.x;
            const tileY = baseY + d.y;
            const worldX = tileX * tileSize;
            const worldY = tileY * tileSize;
            if (!this.mapManager.isWallAt(worldX, worldY)) {
                return { x: worldX, y: worldY };
            }
        }
        return null;
    }

    handleStatUp = (stat) => {
        if (this.gameState.statPoints > 0) {
            this.gameState.statPoints--;
            this.gameState.player.stats.allocatePoint(stat);
            this.gameState.player.stats.recalculate();
        }
    }
}
