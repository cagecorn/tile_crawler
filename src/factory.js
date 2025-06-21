// src/factory.js
import { Player, Mercenary, Monster, Item, Pet } from './entities.js';
import { rollOnTable } from './utils/random.js';
import { FAITHS } from './data/faiths.js';
import { ORIGINS } from './data/origins.js';
import { TRAITS } from './data/traits.js';
import { ITEMS } from './data/items.js';
import { ARTIFACTS } from './data/artifacts.js';
import { EMBLEMS } from './data/emblems.js';
import { PREFIXES, SUFFIXES } from './data/affixes.js';
import { JOBS } from './data/jobs.js';
import { SKILLS } from './data/skills.js';
import { CompositeAI, PurifierAI } from './ai.js';
import { MBTI_TYPES } from './data/mbti.js';
import { PETS } from './data/pets.js';
import { WeaponStatManager } from './micro/WeaponStatManager.js';
import { SYNERGIES } from './data/synergies.js';
// 새 행동 모듈들
import { CombatBehavior } from './ai/behaviors/combat.js';
import { HealBehavior } from './ai/behaviors/heal.js';
import { BardBehavior } from './ai/behaviors/bard.js';
import { WanderBehavior } from './ai/behaviors/wander.js';

export class CharacterFactory {
    constructor(assets) {
        this.assets = assets;
        this.itemFactory = new ItemFactory(assets);
    }

    create(type, config) {
        const { x, y, tileSize, groupId } = config;

        // 1. 모든 유닛의 공통 속성을 여기서 랜덤으로 결정
        let mbti = this._rollMBTI();
        if (type === 'mercenary' && config.jobId === 'healer' && !mbti.includes('S')) {
            mbti = 'ISFP';
        }
        const originId = this._rollRandomKey(ORIGINS);
        let faithId = null;
        // unit-features-plan.md에 따라 플레이어는 신앙을 갖지 않음
        if (type !== 'player') {
            faithId = this._rollRandomKey(FAITHS);
        }
        const traits = this._rollMultipleRandomKeys(TRAITS, 2);
        const stars = this._rollStars();

        // 2. 기본 스탯 설정 (직업, 몬스터 종류, 출신 보너스 등)
        const baseStats = { ...(config.baseStats || {}) };
        if (type === 'monster' && baseStats.expValue === undefined) {
            // 기본 몬스터 경험치를 10으로 상향
            baseStats.expValue = 10;
        }
        const originBonus = ORIGINS[originId].stat_bonuses;
        for (const stat in originBonus) {
            baseStats[stat] = (baseStats[stat] || 0) + originBonus[stat];
        }
        baseStats.stars = stars;

        // 3. 최종 설정 객체 생성
        const properties = { mbti, origin: originId, traits };
        if (faithId) properties.faith = faithId;

        const finalConfig = {
            ...config,
            x, y, tileSize, groupId,
            stats: baseStats,
            properties,
        };

        // 4. 타입에 맞는 캐릭터 생성 및 반환
        switch (type) {
            case 'player':
                const player = new Player(finalConfig);
                player.consumables = [];
                player.consumableCapacity = 4;
                player.skills.push(SKILLS.fireball.id);
                player.skills.push(SKILLS.iceball.id);
                player.skills.push(SKILLS.teleport.id);
                return player;
            case 'mercenary':
                if (config.jobId && JOBS[config.jobId]) {
                    finalConfig.stats = { ...finalConfig.stats, ...JOBS[config.jobId].stats };
                }
                const merc = new Mercenary(finalConfig);
                merc.behaviors = [];

                if (config.jobId === 'healer') {
                    merc.skills.push(SKILLS.heal.id);
                    merc.skills.push(SKILLS.purify.id);
                    merc.behaviors.push(new HealBehavior());
                    merc.behaviors.push(new PurifierAI());
                } else if (config.jobId === 'bard') {
                    merc.skills.push(SKILLS.guardian_hymn.id, SKILLS.courage_hymn.id);
                    const vb = this.itemFactory.create('violin_bow', 0, 0, tileSize);
                    if (vb) merc.equipment.weapon = vb;
                    merc.behaviors.push(new BardBehavior());
                } else if (config.jobId === 'archer') {
                    const bow = this.itemFactory.create('long_bow', 0, 0, tileSize);
                    if (bow) merc.equipment.weapon = bow;
                } else if (config.jobId === 'warrior') {
                    merc.skills.push(SKILLS.charge_attack.id);
                }

                // 모든 용병은 전투 및 배회 행동을 가짐
                merc.behaviors.push(new CombatBehavior());
                merc.behaviors.push(new WanderBehavior());

                if (!merc.equipment.weapon) {
                    const sword = this.itemFactory.create('sword', 0, 0, tileSize);
                    if (sword) merc.equipment.weapon = sword;
                }
                if (merc.stats) merc.stats.updateEquipmentStats();

                return merc;
            case 'monster':
                const monster = new Monster(finalConfig);
                monster.behaviors = [new CombatBehavior()];
                return monster;
            case 'pet':
                const petData = PETS[config.petId] || PETS.fox;
                finalConfig.stats = { ...finalConfig.stats, ...(petData.baseStats || {}) };
                finalConfig.image = finalConfig.image || this.assets[petData.imageKey];
                finalConfig.auraSkill = petData.auraSkill;
                const pet = new Pet(finalConfig);
                pet.behaviors = [new CombatBehavior(), new WanderBehavior()];
                return pet;
        }
    }
    
    // === 아래는 다이스를 굴리는 내부 함수들 (구멍만 파기) ===
    _rollMBTI() {
        // MBTI를 무작위로 선택한다
        const idx = Math.floor(Math.random() * MBTI_TYPES.length);
        return MBTI_TYPES[idx];
    }
    _rollRandomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    _rollMultipleRandomKeys(obj, count) {
        const keys = Object.keys(obj);
        const result = [];
        while (result.length < count && keys.length) {
            const idx = Math.floor(Math.random() * keys.length);
            result.push(keys.splice(idx, 1)[0]);
        }
        return result;
    }
    _rollStars() {
        // ... (별 갯수 랜덤 배분 로직) ...
        return { strength: 1, agility: 1, endurance: 1, focus: 1, intelligence: 1 };
    }
}

// === ItemFactory 클래스 새로 추가 ===
export class ItemFactory {
    constructor(assets) {
        this.assets = assets;
    }

    create(itemId, x, y, tileSize) {
        const baseItem = ITEMS[itemId] || ARTIFACTS[itemId] || EMBLEMS[itemId];
        if (!baseItem) return null;

        // 아이템 생성 시 imageKey로부터 올바른 이미지를 불러온다
        const itemImage = this.assets[baseItem.imageKey];
        if (!itemImage) {
            console.warn(`Missing image for item ${itemId} with key ${baseItem.imageKey}`);
        }
        const item = new Item(x, y, tileSize, baseItem.name, itemImage);
        item.baseId = itemId;
        item.type = baseItem.type;
        item.tags = [...baseItem.tags];

        if (baseItem.tier) item.tier = baseItem.tier;
        if (baseItem.durability) item.durability = baseItem.durability;
        if (baseItem.weight) item.weight = baseItem.weight;
        if (baseItem.toughness) item.toughness = baseItem.toughness;
        if (item.type === 'weapon' || item.tags.includes('weapon')) {
            item.weaponStats = new WeaponStatManager(itemId);
        }
        if (baseItem.range) {
            item.range = baseItem.range;
        }
        if (baseItem.stats) {
            item.stats.add(baseItem.stats);
        }
        if (baseItem.cooldown) {
            item.cooldown = baseItem.cooldown;
            item.cooldownRemaining = 0;
        }
        if (baseItem.healAmount) item.healAmount = baseItem.healAmount;
        if (baseItem.effectId) item.effectId = baseItem.effectId;

        if (item.type === 'weapon' || item.type === 'armor') {
            const numSockets = Math.floor(Math.random() * 4); // 0~3개 소켓
            item.sockets = Array(numSockets).fill(null);
            this._applySynergies(item);
        } else {
            item.sockets = [];
        }

        if (Math.random() < 0.5) this._applyAffix(item, PREFIXES, 'prefix');
        if (Math.random() < 0.5) this._applyAffix(item, SUFFIXES, 'suffix');

        if (baseItem.possessionAI) {
            item.possessionAI = baseItem.possessionAI;
        }

        return item;
    }

    _applyAffix(item, affixPool, type) {
        const keys = Object.keys(affixPool);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const affix = affixPool[randomKey];

        item.name = (type === 'prefix') ? `${affix.name} ${item.name}` : `${item.name} ${affix.name}`;
        if (!item.stats.add) {
            item.stats.add = function(statObj) {
                for (const key in statObj) {
                    this.set(key, (this.get(key) || 0) + statObj[key]);
                }
            };
        }
        item.stats.add(affix.stats);
    }

    _applySynergies(item) {
        const synergyKeys = Object.keys(SYNERGIES);
        const synergyCount = Math.floor(Math.random() * 4); // 0 ~ 3개
        const available = [...synergyKeys];
        for (let i = 0; i < synergyCount; i++) {
            if (available.length === 0) break;
            const idx = Math.floor(Math.random() * available.length);
            const chosen = available.splice(idx, 1)[0];
            item.synergies.push(chosen);
        }
    }

    _createSockets() {
        return [];
    }
}
