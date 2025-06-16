// src/entities.js

import { MeleeAI } from './ai.js';
import { StatManager } from './stats.js';

class Entity {
    constructor(x, y, tileSize, image, groupId, statsConfig) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.groupId = groupId;
        this.x = x;
        this.y = y;
        this.image = image;
        this.stats = new StatManager(statsConfig);
        this.width = this.stats.get('sizeInTiles_w') * tileSize;
        this.height = this.stats.get('sizeInTiles_h') * tileSize;
        this.hp = this.stats.get('maxHp');
        this.attackCooldown = 0;
        this.isPlayer = false;
        this.isFriendly = false;
        this.ai = null;
    }
    
    get speed() { return this.stats.get('movementSpeed'); }
    get attackPower() { return this.stats.get('attackPower'); }
    get maxHp() { return this.stats.get('maxHp'); }
    get expValue() { return this.stats.get('expValue'); }

    render(ctx) { if (this.image) { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); } }
    takeDamage(damage) { this.hp -= damage; if(this.hp < 0) this.hp = 0; }
}

export class Player extends Entity {
    constructor(x, y, tileSize, image, groupId, job) {
        super(x, y, tileSize, image, groupId, job);
        this.isPlayer = true;
        this.isFriendly = true;
    }
}

export class Mercenary extends Entity {
    constructor(x, y, tileSize, image, groupId, job) {
        super(x, y, tileSize, image, groupId, job);
        this.isFriendly = true;
        this.ai = new MeleeAI();
    }
}

export class Monster extends Entity {
    constructor(x, y, tileSize, image, groupId, config) {
        super(x, y, tileSize, image, groupId, config);
        this.isFriendly = false;
        this.ai = new MeleeAI();
    }
}

export class Item { /* ... 변경 없음 ... */ }
