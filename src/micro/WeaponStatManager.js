import { SwordAI, BowAI, SpearAI, SaberAI } from './WeaponAI.js';

export class WeaponStatManager {
    constructor(itemId) {
        this.level = 1;
        this.exp = 0;
        this.expNeeded = 10;
        this.skills = [];
        this.cooldown = 0;
        this.ai = this._getAIByItemId(itemId);
    }

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expNeeded) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp = 0;
        this.expNeeded = Math.floor(this.expNeeded * 1.5);
    }

    getAI() {
        return this.ai;
    }

    _getAIByItemId(itemId) {
        if (itemId.includes('sword')) return new SwordAI();
        if (itemId.includes('bow')) return new BowAI();
        if (itemId.includes('spear')) return new SpearAI();
        if (itemId.includes('saber')) return new SaberAI();
        return new SwordAI();
    }
}
