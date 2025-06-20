export class MicroTurnManager {
    constructor() {
        this.turn = 0;
    }

    update(allItems) {
        this.turn++;
        for (const item of allItems) {
            if (item.weaponStats && item.weaponStats.cooldown > 0) {
                item.weaponStats.cooldown--;
            }
            if (item.cooldownRemaining > 0) {
                item.cooldownRemaining--;
            }
        }
    }

    recordAttack(weapon) {
        if (weapon?.weaponStats) {
            weapon.weaponStats.gainExp(1);
        }
    }
}
