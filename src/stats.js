// src/stats.js

export class StatManager {
    constructor(config) {
        // 1. 유닛의 기본 스탯
        this._baseStats = {
            level: config.level || 1,
            exp: config.exp || 0,
            expNeeded: config.expNeeded || 20,
            strength: config.strength || 1,
            agility: config.agility || 1,
            endurance: config.endurance || 1,
            focus: config.focus || 1,
            intelligence: config.intelligence || 1,
            movement: config.movement || 3,
            expValue: config.expValue || 0,
            sizeInTiles_w: config.sizeInTiles_w || 1,
            sizeInTiles_h: config.sizeInTiles_h || 1,
            visionRange: config.visionRange || 192 * 4,
            attackRange: config.attackRange || 192,
        };
        // 2. 플레이어가 직접 투자한 스탯
        this._pointsAllocated = {
            strength: 0, agility: 0, endurance: 0, focus: 0, intelligence: 0, movement: 0
        };
        // 3. 최종 계산된 파생 스탯
        this.derivedStats = {};

        this.recalculate();
    }

    allocatePoint(stat) {
        if (this._pointsAllocated[stat] !== undefined) {
            this._pointsAllocated[stat]++;
        }
    }

    recalculate() {
        const final = { ...this._baseStats };
        // --- 수정된 부분: 포인트로 올린 스탯을 정확하게 합산 ---
        for (const stat in this._pointsAllocated) {
            final[stat] = (this._baseStats[stat] || 0) + this._pointsAllocated[stat];
        }

        // --- 파생 스탯 계산 ---
        final.maxHp = 10 + final.endurance * 5;
        final.attackPower = 1 + final.strength * 2;
        // === 누락되었던 이동속도 계산 로직 추가 ===
        final.movementSpeed = final.movement;

        this.derivedStats = final;
    }

    get(statName) {
        return this.derivedStats[statName] ?? 0;
    }

    addExp(amount) {
        // 경험치는 기본 스탯에 누적한 뒤 즉시 재계산하여 UI와 레벨업 체크에 반영
        this._baseStats.exp += amount;
        this.recalculate();
    }

    levelUp() {
        // 레벨 관련 수치를 기본 스탯에 반영해 recalculate 이후에도 유지한다
        this._baseStats.level++;
        this._baseStats.exp -= this._baseStats.expNeeded;
        this._baseStats.expNeeded = Math.floor(this._baseStats.expNeeded * 1.5);
        // 레벨업 시 기본 스탯 상승 (예시: 체력, 힘)
        this.increaseBaseStat('endurance', 1);
        this.increaseBaseStat('strength', 1);
    }
    
    increaseBaseStat(stat, value) {
        if (this._baseStats[stat] !== undefined) {
            this._baseStats[stat] += value;
        }
    }
}
