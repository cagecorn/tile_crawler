// src/factory.js
import { Player, Mercenary, Monster } from './entities.js';
import { rollOnTable } from './utils/random.js';
import { FAITHS } from './data/faiths.js';
import { ORIGINS } from './data/origins.js';
import { TRAITS } from './data/traits.js';

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
