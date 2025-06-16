// src/stats.js

export class StatManager {
    constructor(job) {
        // 1. 플레이어가 직접 찍는 순수 기본 스탯
        this._baseStats = {
            strength: job.strength || 1,
            agility: job.agility || 1,
            endurance: job.endurance || 1,
            focus: job.focus || 1,
            intelligence: job.intelligence || 1,
            movement: job.movement || 3,
        };

        // 2. (나중을 위한 구멍) 장비, 버프 등으로 추가될 스탯
        this._fromEquipment = {};
        this._fromBuffs = {};

        // 3. 최종 계산된 파생 스탯
        this.derivedStats = {};

        this.recalculate(); // 초기 스탯 계산
    }

    // 기본 스탯을 올리는 함수
    increaseBaseStat(stat, value) {
        if (this._baseStats[stat] !== undefined) {
            this._baseStats[stat] += value;
        }
    }

    // 모든 스탯을 다시 계산하는 핵심 함수
    recalculate() {
        const final = { ...this._baseStats };
        // 나중에 여기에 장비, 버프 스탯을 합산하는 로직 추가

        // --- 파생 스탯 계산 ---
        this.derivedStats.maxHp = 10 + final.endurance * 5;
        this.derivedStats.attackPower = 1 + final.strength * 2;
        
        // 무게 및 이동력 계산
        this.derivedStats.weightCapacity = 50 + final.strength * 10;
        this.derivedStats.currentWeight = 0; // 지금은 아이템이 없어 0
        
        const encumbranceRatio = this.derivedStats.currentWeight / this.derivedStats.weightCapacity;
        // 무게가 가용 무게치의 50%를 넘으면 이동력 감소 시작
        const speedModifier = Math.max(0.1, 1 - (encumbranceRatio - 0.5)); 
        
        this.derivedStats.movementSpeed = final.movement * speedModifier;

        // 기타 파생 스탯 (미래를 위한 구멍)
        this.derivedStats.defense = Math.floor(final.endurance / 2);
        this.derivedStats.accuracy = 75 + final.agility * 2;
    }

    // 최종 계산된 스탯을 가져오는 함수
    get(statName) {
        return this.derivedStats[statName] ?? this._baseStats[statName] ?? 0;
    }
}
