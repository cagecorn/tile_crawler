// src/stats.js

export class StatManager {
    constructor(config = {}) {
        // 1. 유닛의 기본 스탯 (직업, 몬스터 종류 등에 따라 결정)
        const defaults = {
            level: 1,
            exp: 0,
            expNeeded: 20,
            strength: 1,
            agility: 1,
            endurance: 1,
            focus: 1,
            intelligence: 1,
            movement: 3,
        };

        // config 객체에 추가로 전달된 값은 그대로 저장하여 활용할 수 있도록 한다
        this._baseStats = { ...defaults, ...config };
        // 2. 플레이어가 직접 투자한 스탯
        this._pointsAllocated = {
            strength: 0, agility: 0, endurance: 0, focus: 0, intelligence: 0
        };
        // 3. (미래를 위한 구멍) 장비, 버프 스탯
        this._fromEquipment = {};
        this._fromBuffs = {};
        // 4. 최종 계산된 파생 스탯
        this.derivedStats = {};

        this.recalculate();
    }

    // 스탯 포인트를 사용하여 기본 스탯을 올리는 함수
    allocatePoint(stat) {
        if (this._pointsAllocated[stat] !== undefined) {
            this._pointsAllocated[stat]++;
        }
    }

    // 모든 스탯을 다시 계산하는 핵심 함수
    recalculate() {
        const final = { ...this._baseStats };
        // 포인트로 올린 스탯 합산
        for (const stat in this._pointsAllocated) {
            final[stat] += this._pointsAllocated[stat];
        }
        // 나중에 여기에 장비, 버프 스탯을 합산하는 로직 추가

        // --- 파생 스탯 계산 ---
        this.derivedStats.maxHp = 10 + final.endurance * 5;
        this.derivedStats.attackPower = 1 + final.strength * 2;
        this.derivedStats.movementSpeed = final.movement; // 지금은 무게 시스템을 단순화
        
        // --- 기본 스탯도 derivedStats에 복사하여 get()으로 한번에 접근 ---
        for (const stat in final) {
            if (this.derivedStats[stat] === undefined) {
                this.derivedStats[stat] = final[stat];
            }
        }
    }

    // 최종 계산된 스탯을 가져오는 함수
    get(statName) {
        return this.derivedStats[statName] ?? 0;
    }

    addExp(amount) {
        this._baseStats.exp += amount;
    }

    levelUp() {
        this._baseStats.level++;
        this._baseStats.exp -= this._baseStats.expNeeded;
        this._baseStats.expNeeded = Math.floor(this._baseStats.expNeeded * 1.5);
        this._baseStats.endurance++;
        this._baseStats.strength++;
    }
}
