// src/factory.js
import { Player, Mercenary, Monster, Item, Pet } from './entities.js';
import { FAITHS } from './data/faiths.js';
import { ORIGINS } from './data/origins.js';
import { TRAITS } from './data/traits.js';
import { ITEMS } from './data/items.js';
import { ARTIFACTS } from './data/artifacts.js';
import { EMBLEMS } from './data/emblems.js';
import { PREFIXES, SUFFIXES } from './data/affixes.js';
import { JOBS } from './data/jobs.js';
import { SKILLS } from './data/skills.js';
import { MBTI_TYPES } from './data/mbti.js';
import { PETS } from './data/pets.js';
import { WeaponStatManager } from './micro/WeaponStatManager.js';
import { SYNERGIES } from './data/synergies.js';
import { CombatBehavior } from './ai/behaviors/combat.js';
import { HealBehavior } from './ai/behaviors/heal.js';
import { BardBehavior } from './ai/behaviors/bard.js';
import { WanderBehavior } from './ai/behaviors/wander.js';
import { PurifierAI } from './ai.js';

export class CharacterFactory {
    constructor(assets) {
        this.assets = assets;
        this.itemFactory = new ItemFactory(assets);
    }

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
        properties.faith = (type !== 'player') ? this._rollRandomKey(FAITHS) : null;

        // 2-2. 결정된 속성과 직업에 따른 보너스 스탯을 'stats' 객체에 순서대로 합칩니다.
        const originBonus = ORIGINS[properties.origin]?.stat_bonuses || {};
        const jobStats = (type === 'mercenary' && config.jobId && JOBS[config.jobId]?.stats) ? JOBS[config.jobId].stats : {};
        Object.assign(stats, originBonus, jobStats);

        // 2-3. 최종 스탯과 속성을 finalConfig에 할당합니다.
        finalConfig.stats = stats;
        finalConfig.properties = properties;

        // 3. 타입에 맞는 캐릭터 클래스를 선택하여 '불량품 없는' 유닛을 생성합니다.
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
            case 'pet':
                const petData = PETS[config.petId] || PETS.fox;
                finalConfig.stats = { ...stats, ...(petData.baseStats || {}) };
                finalConfig.image = config.image || this.assets[petData.imageKey];
                finalConfig.auraSkill = petData.auraSkill;
                entity = new Pet(finalConfig);
                break;
            default:
                console.error(`Unknown character type: ${type}`);
                return null;
        }

        // 4. 생성된 캐릭터에 따라 추가적인 설정(스킬, AI, 장비 등)을 적용합니다.
        entity.behaviors = [];
        if (type === 'player') {
            entity.skills.push(SKILLS.fireball.id, SKILLS.iceball.id, SKILLS.teleport.id);
        } else if (type === 'mercenary') {
            const { jobId, tileSize } = config;
            if (jobId === 'healer') {
                entity.skills.push(SKILLS.heal.id, SKILLS.purify.id);
                entity.behaviors.push(new HealBehavior(), new PurifierAI());
            } else if (jobId === 'bard') {
                entity.skills.push(SKILLS.guardian_hymn.id, SKILLS.courage_hymn.id);
                const vb = this.itemFactory.create('violin_bow', 0, 0, tileSize);
                if (vb) entity.equipment.weapon = vb;
                entity.behaviors.push(new BardBehavior());
            } else if (jobId === 'warrior') {
                entity.skills.push(SKILLS.charge_attack.id);
            } else if (jobId === 'archer') {
                const bow = this.itemFactory.create('long_bow', 0, 0, tileSize);
                if (bow) entity.equipment.weapon = bow;
                const r = Math.random();
                entity.skills.push(r < 0.5 ? SKILLS.double_thrust.id : SKILLS.hawk_eye.id);
            } else if (jobId === 'wizard') {
                const r = Math.random();
                entity.skills.push(r < 0.5 ? SKILLS.fireball.id : SKILLS.iceball.id);
            } else {
                const r = Math.random();
                entity.skills.push(r < 0.5 ? SKILLS.double_strike.id : SKILLS.charge_attack.id);
            }

            if (!entity.equipment.weapon) {
                const sword = this.itemFactory.create('sword', 0, 0, tileSize);
                if (sword) entity.equipment.weapon = sword;
            }
            entity.behaviors.push(new CombatBehavior(), new WanderBehavior());
        } else { // Monster and Pet
            entity.behaviors.push(new CombatBehavior(), new WanderBehavior());
        }

        // 장비 상태에 맞게 AI를 업데이트한다.
        if (typeof entity.updateAI === 'function') {
            entity.updateAI();
        }

        // 모든 유닛의 스탯을 최종적으로 한 번 더 계산하여 마무리합니다.
        entity.stats?.recalculate();
        entity.stats?.updateEquipmentStats();

        return entity;
    }

    _rollMBTI() {
        return MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];
    }
    _rollRandomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }
    _rollMultipleRandomKeys(obj, count) {
        const keys = Object.keys(obj);
        const result = [];
        for (let i = 0; i < count; i++) {
            if (keys.length === 0) break;
            const idx = Math.floor(Math.random() * keys.length);
            result.push(keys.splice(idx, 1)[0]);
        }
        return result;
    }
}


// 아이템 팩토리는 수정할 필요가 없습니다. 그대로 둡니다.
export class ItemFactory {
    constructor(assets) {
        this.assets = assets;
    }

    create(itemId, x, y, tileSize) {
        const baseItem = ITEMS[itemId] || ARTIFACTS[itemId] || EMBLEMS[itemId];
        if (!baseItem) return null;

        const itemImage = this.assets[baseItem.imageKey];
        const item = new Item(x, y, tileSize, baseItem.name, itemImage);
        item.baseId = itemId;
        item.type = baseItem.type;
        item.tags = [...(baseItem.tags || [])];

        if (baseItem.tier) item.tier = baseItem.tier;
        if (baseItem.durability) item.durability = baseItem.durability;
        if (baseItem.weight) item.weight = baseItem.weight;
        if (baseItem.toughness) item.toughness = baseItem.toughness;
        if (item.type === 'weapon' || item.tags.includes('weapon')) {
            item.weaponStats = new WeaponStatManager(itemId, item.tags);
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
            const numSockets = Math.floor(Math.random() * 4);
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
        const synergyCount = Math.floor(Math.random() * 4);
        const available = [...synergyKeys];
        for (let i = 0; i < synergyCount; i++) {
            if (available.length === 0) break;
            const idx = Math.floor(Math.random() * available.length);
            const chosen = available.splice(idx, 1)[0];
            item.synergies.push(chosen);
        }
    }
}
