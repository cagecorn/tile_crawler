// src/stats.js

export class StatManager {
    constructor(config = {}, entity) {
        this.entity = entity;
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
        this._pointsAllocated = {
            strength: 0, agility: 0, endurance: 0, focus: 0, intelligence: 0, movement: 0,
        };
        this.derivedStats = {};
        this.recalculate();
    }

    allocatePoint(stat) {
        if (this._pointsAllocated[stat] !== undefined) {
            this._pointsAllocated[stat]++;
        }
    }

    recalculate() {
        const final = {};
        // 기본 스탯과 포인트 투자 스탯을 합산
        for (const stat in this._baseStats) {
            final[stat] = (this._baseStats[stat] || 0) + (this._pointsAllocated[stat] || 0);
        }

        // 파생 스탯 계산
        final.maxHp = 10 + final.endurance * 5;
        final.attackPower = 1 + final.strength * 2;
        final.movementSpeed = final.movement;

        // 기존의 level, exp, expNeeded 값을 유지 (버그 수정)
        // 이전에 계산된 값이 있다면 그것을 사용하고, 없다면 final에서 가져옴
        final.level = this.derivedStats.level || final.level;
        final.exp = this.derivedStats.exp || final.exp;
        final.expNeeded = this.derivedStats.expNeeded || final.expNeeded;

        this.derivedStats = final;
    }

    get(statName) {
        return this.derivedStats[statName] ?? 0;
    }

    getSavableState() {
        return {
            baseStats: this._baseStats,
            pointsAllocated: this._pointsAllocated,
        };
    }

    addExp(amount) {
        this._baseStats.exp += amount;
        this.recalculate();
    }

    levelUp() {
        this._baseStats.level++;
        this._baseStats.exp -= this._baseStats.expNeeded;
        this._baseStats.expNeeded = Math.floor(this._baseStats.expNeeded * 1.5);
        this.increaseBaseStat('endurance', 1);
        this.increaseBaseStat('strength', 1);
    }

    increaseBaseStat(stat, value) {
        if (this._baseStats[stat] !== undefined) {
            this._baseStats[stat] += value;
        }
    }
}
