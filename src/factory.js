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

    /**
     * ✨ 안정성을 위해 재설계된 create 메서드입니다.
     */
    create(type, config) {
        // 1. 최종적으로 엔티티에 전달될 설정 객체를 미리 준비합니다.
        const finalConfig = { ...config };

        // 2. 스탯(stats)과 속성(properties) 객체를 생성하고 단계별로 데이터를 채웁니다.
        const stats = { ...(config.baseStats || {}) };
        const properties = {};

        // 2-1. MBTI, 출신, 신앙, 특성 등 랜덤 속성을 먼저 결정합니다.
        properties.mbti = this._rollMBTI();
        properties.origin = this._rollRandomKey(ORIGINS);
        properties.traits = this._rollMultipleRandomKeys(TRAITS, 2);

        if (type !== 'player') {
            properties.faith = this._rollRandomKey(FAITHS);
        } else {
            // 플레이어는 신앙을 갖지 않습니다.
            properties.faith = 'NONE';
        }

        // 2-2. 결정된 속성에 따른 보너스 스탯을 'stats' 객체에 합칩니다.
        const originBonus = ORIGINS[properties.origin].stat_bonuses;
        Object.assign(stats, originBonus);

        if (type === 'mercenary' && config.jobId && JOBS[config.jobId]) {
            Object.assign(stats, JOBS[config.jobId].stats);
        }

        // 2-3. 최종 스탯과 속성을 finalConfig에 할당합니다.
        finalConfig.stats = stats;
        finalConfig.properties = properties;

        // 3. 타입에 맞는 캐릭터를 생성합니다.
        let entity;
        switch (type) {
            case 'player':
                entity = new Player(finalConfig);
                break;
            case 'mercenary':
                entity = new Mercenary(finalConfig);
                break;
            case 'monster':
                entity = new Monster(finalConfig);
                break;
            case 'pet': {
                const petData = PETS[config.petId] || PETS.fox;
                finalConfig.stats = { ...finalConfig.stats, ...(petData.baseStats || {}) };
                finalConfig.image = finalConfig.image || this.assets[petData.imageKey];
                finalConfig.auraSkill = petData.auraSkill;
                entity = new Pet(finalConfig);
                break;
            }
            default:
                return null;
        }

        // 4. 생성된 캐릭터에 따라 추가적인 설정(스킬, AI, 장비 등)을 적용합니다.
        entity.behaviors = [];
        if (type === 'player') {
            entity.skills.push(SKILLS.fireball.id, SKILLS.iceball.id, SKILLS.teleport.id);
        } else if (type === 'mercenary') {
            if (config.jobId === 'healer') {
                entity.skills.push(SKILLS.heal.id, SKILLS.purify.id);
                entity.behaviors.push(new HealBehavior(), new PurifierAI());
            } else if (config.jobId === 'bard') {
                entity.skills.push(SKILLS.guardian_hymn.id, SKILLS.courage_hymn.id);
                const vb = this.itemFactory.create('violin_bow', 0, 0, config.tileSize);
                if (vb) entity.equipment.weapon = vb;
                entity.behaviors.push(new BardBehavior());
            } else if (config.jobId === 'warrior') {
                entity.skills.push(SKILLS.charge_attack.id);
            } else if (config.jobId === 'archer') {
                const bow = this.itemFactory.create('long_bow', 0, 0, config.tileSize);
                if (bow) entity.equipment.weapon = bow;
            }

            if (!entity.equipment.weapon && type !== 'bard') {
                const sword = this.itemFactory.create('sword', 0, 0, config.tileSize);
                if (sword) entity.equipment.weapon = sword;
            }

            entity.behaviors.push(new CombatBehavior(), new WanderBehavior());
        } else if (type === 'monster' || type === 'pet') {
            entity.behaviors.push(new CombatBehavior(), new WanderBehavior());
        }

        if (entity.stats?.updateEquipmentStats) {
            entity.stats.updateEquipmentStats();
        }

        return entity;
    }

    // === 아래는 다이스를 굴리는 내부 함수들 (수정 없음) ===
    _rollMBTI() {
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
