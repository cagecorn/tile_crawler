// src/stats.js

export class StatManager {
    constructor(entity, config = {}) {
        // entity 자신을 참조할 수 있도록 저장
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
            castingSpeed: config.castingSpeed || 1,
            attackSpeed: config.attackSpeed || 1,
            hpRegen: config.hpRegen || 0,
            mpRegen: config.mpRegen || 0,
        };
        this._pointsAllocated = {
            strength: 0, agility: 0, endurance: 0, focus: 0, intelligence: 0, movement: 0, castingSpeed: 0, attackSpeed: 0,
        };

        // 장비로부터 적용되는 스탯 저장용
        this._fromEquipment = {};

        this.derivedStats = {};
        this.recalculate();
    }

    allocatePoint(stat) {
        if (this._pointsAllocated[stat] !== undefined) {
            this._pointsAllocated[stat]++;
        }
    }

    // 장비 스탯을 업데이트하는 함수
    updateEquipmentStats() {
        this._fromEquipment = {};
        if (!this.entity || !this.entity.equipment) return;

        for (const slot in this.entity.equipment) {
            const item = this.entity.equipment[slot];
            if (item && item.stats) {
                if (item.stats instanceof Map) {
                    for (const [stat, value] of item.stats.entries()) {
                        this._fromEquipment[stat] = (this._fromEquipment[stat] || 0) + value;
                    }
                } else {
                    for (const [stat, value] of Object.entries(item.stats)) {
                        this._fromEquipment[stat] = (this._fromEquipment[stat] || 0) + value;
                    }
                }
            }
        }
        this.recalculate();
    }

    recalculate() {
        const final = {};
        for (const stat in this._baseStats) {
            final[stat] = (this._baseStats[stat] || 0)
                       + (this._pointsAllocated[stat] || 0)
                       + (this._fromEquipment[stat] || 0);
        }

        // 장비에만 존재하는 스탯도 합산
        for (const stat in this._fromEquipment) {
            if (!(stat in final)) {
                final[stat] = this._fromEquipment[stat];
            }
        }

        final.maxHp = 10 + final.endurance * 5;
        final.attackPower = (final.attackPower || 0) + 1 + final.strength * 2;
        final.maxMp = 10 + final.focus * 10;
        final.movementSpeed = final.movement;
        // 체력/마나 재생률이 지나치게 높아 전투 테스트가 어려웠다.
        // 기본 회복 공식을 완화하여 초당 회복량을 대폭 줄인다.
        final.hpRegen = (final.hpRegen || 0) + final.endurance * 0.01;
        final.mpRegen = (final.mpRegen || 0) + final.focus * 0.01;

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
        let finalAmount = amount;
        if (this.entity?.consumables?.some(i => i.type === 'parasite' || i.tags?.includes('parasite'))) {
            finalAmount = Math.floor(amount * 0.8);
        }
        this._baseStats.exp += finalAmount;

        while (this.get('exp') >= this.get('expNeeded')) {
            this.levelUp();
            this.entity.hp = this.entity.maxHp;
            this.entity.mp = this.entity.maxMp;

            if (this.entity.isPlayer) {
                if (this.entity.eventManager) {
                    this.entity.eventManager.publish('player_levelup_bonus', { statPoints: 5 });
                }
            }

            if (this.entity.eventManager) {
                this.entity.eventManager.publish('level_up', { player: this.entity, level: this.get('level') });
            }
            
            // --- BUG FIX ---
            // 루프가 끝난 후에 호출되던 것을 루프 안으로 이동시켜
            // 매 레벨업마다 스탯을 다시 계산하도록 수정합니다.
            this.recalculate();
        }

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
