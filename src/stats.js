// src/stats.js

export class StatManager {
    constructor(config) {
        this._baseStats = {
            level: config.level || 1,
            exp: config.exp || 0,
            expNeeded: config.expNeeded || 20,
            strength: config.strength || 1,
            agility: config.agility || 1,
            endurance: config.endurance || 1,
            focus: config.focus || 1,
            intelligence: config.intelligence || 1,
            movement: config.movement || 5,
            hp: config.hp || 1,
            maxHp: config.maxHp || 1,
            attackPower: config.attackPower || 1,
            expValue: config.expValue || 0,
            sizeInTiles_w: config.sizeInTiles_w || 1,
            sizeInTiles_h: config.sizeInTiles_h || 1,
        };
        this._pointsAllocated = {
            strength: 0, agility: 0, endurance: 0, focus: 0, intelligence: 0
        };
        this.recalculate();
    }

    allocatePoint(stat) {
        if (this._pointsAllocated[stat] !== undefined) {
            this._pointsAllocated[stat]++;
        }
    }

    recalculate() {
        const final = { ...this._baseStats };
        for (const stat in this._pointsAllocated) {
            final[stat] += this._pointsAllocated[stat];
        }
        
        final.maxHp = 10 + final.endurance * 5;
        final.attackPower = 1 + final.strength * 2;
        
        this.derivedStats = final;
    }

    get(statName) {
        return this.derivedStats[statName] ?? 0;
    }

    addExp(amount) {
        this.derivedStats.exp += amount;
    }

    levelUp() {
        this.derivedStats.level++;
        this.derivedStats.exp -= this.derivedStats.expNeeded;
        this.derivedStats.expNeeded = Math.floor(this.derivedStats.expNeeded * 1.5);
        this.increaseBaseStat('endurance', 1);
        this.increaseBaseStat('strength', 1);
    }
    
    increaseBaseStat(stat, value) {
        if (this._baseStats[stat] !== undefined) {
            this._baseStats[stat] += value;
        }
    }
}
