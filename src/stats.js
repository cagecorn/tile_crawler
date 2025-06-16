// src/stats.js

export class StatManager {
    constructor(job) {
        this._baseStats = {
            strength: job.strength || 1,
            agility: job.agility || 1,
            endurance: job.endurance || 1,
            focus: job.focus || 1,
            intelligence: job.intelligence || 1,
            movement: job.movement || 3,
            // --- 레벨과 경험치도 기본 스탯으로 관리 ---
            level: 1,
            exp: 0,
            expNeeded: 20,
        };
        this._fromEquipment = {};
        this._fromBuffs = {};
        this.derivedStats = {};
        this.recalculate();
    }

    increaseBaseStat(stat, value) {
        if (this._baseStats[stat] !== undefined) {
            this._baseStats[stat] += value;
        }
    }

    // 경험치를 추가하는 전용 함수
    addExp(amount) {
        this._baseStats.exp += amount;
    }

    // 레벨업 처리를 위한 함수
    levelUp() {
        this._baseStats.level++;
        this._baseStats.exp -= this._baseStats.expNeeded;
        this._baseStats.expNeeded = Math.floor(this._baseStats.expNeeded * 1.5);
        this.increaseBaseStat('endurance', 1); // 레벨업 시 체력 1 자동 증가
        this.increaseBaseStat('strength', 1); // 레벨업 시 힘 1 자동 증가
    }

    recalculate() {
        const final = { ...this._baseStats };
        // ... (파생 스탯 계산 로직은 변경 없음)
        this.derivedStats.maxHp = 10 + final.endurance * 5;
        this.derivedStats.attackPower = 1 + final.strength * 2;
        this.derivedStats.weightCapacity = 50 + final.strength * 10;
        this.derivedStats.currentWeight = 0;
        const encumbranceRatio = this.derivedStats.currentWeight / this.derivedStats.weightCapacity;
        const speedModifier = Math.max(0.1, 1 - (encumbranceRatio - 0.5));
        this.derivedStats.movementSpeed = final.movement * speedModifier;
        this.derivedStats.defense = Math.floor(final.endurance / 2);
        this.derivedStats.accuracy = 75 + final.agility * 2;
    }

    get(statName) {
        return this.derivedStats[statName] ?? this._baseStats[statName] ?? 0;
    }
}
