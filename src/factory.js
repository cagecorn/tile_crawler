// src/factory.js
import { Player, Mercenary, Monster, Item } from './entities.js';
import { rollOnTable } from './utils/random.js';
import { FAITHS } from './data/faiths.js';
import { ORIGINS } from './data/origins.js';
import { TRAITS } from './data/traits.js';
import { ITEMS } from './data/items.js';
import { PREFIXES, SUFFIXES } from './data/affixes.js';

export class CharacterFactory {
    constructor(assets) {
        this.assets = assets;
    }

    create(type, config) {
        const { x, y, tileSize, groupId } = config;

        // 1. 모든 유닛의 공통 속성을 여기서 랜덤으로 결정
        const mbti = this._rollMBTI();
        const faithId = this._rollRandomKey(FAITHS);
        const originId = this._rollRandomKey(ORIGINS);
        const traits = [this._rollRandomKey(TRAITS)];
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
        const finalConfig = {
            ...config,
            x, y, tileSize, groupId,
            stats: baseStats,
            properties: { mbti, faith: faithId, origin: originId, traits },
        };

        // 4. 타입에 맞는 캐릭터 생성 및 반환
        switch (type) {
            case 'player':
                return new Player(finalConfig);
            case 'mercenary':
                return new Mercenary(finalConfig);
            case 'monster':
                return new Monster(finalConfig);
        }
    }
    
    // === 아래는 다이스를 굴리는 내부 함수들 (구멍만 파기) ===
    _rollMBTI() { return 'ISTJ'; }
    _rollRandomKey(obj) { const keys = Object.keys(obj); return keys[Math.floor(Math.random() * keys.length)]; }
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
        const baseItem = ITEMS[itemId];
        if (!baseItem) return null;

        const item = new Item(x, y, tileSize, baseItem.name, this.assets[baseItem.imageKey]);
        item.baseId = itemId;
        item.type = baseItem.type;
        item.tags = [...baseItem.tags];

        if (Math.random() < 0.5) this._applyAffix(item, PREFIXES, 'prefix');
        if (Math.random() < 0.5) this._applyAffix(item, SUFFIXES, 'suffix');

        item.sockets = this._createSockets();

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

    _createSockets() {
        return [];
    }
}
