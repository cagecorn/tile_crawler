// src/entities.js

import { MeleeAI } from './ai.js';
import { StatManager } from './stats.js';

class Entity {
    constructor(config) {
        const { x, y, tileSize, image, groupId, stats, properties } = config;
        this.id = Math.random().toString(36).substr(2, 9);
        this.groupId = groupId;
        this.x = x;
        this.y = y;
        this.image = image;
        this.tileSize = tileSize;
        this.properties = properties || {};
        this.stats = new StatManager(stats || {}, this);
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
    get visionRange() { return this.stats.get('visionRange'); }
    get attackRange() { return this.stats.get('attackRange'); }

    render(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    getSaveState() {
        return {
            id: this.id,
            type: this.constructor.name,
            x: this.x,
            y: this.y,
            hp: this.hp,
            stats: this.stats.getSavableState(),
            properties: this.properties,
        };
    }

    takeDamage(damage) { this.hp -= damage; if (this.hp < 0) this.hp = 0; }
}

export class Player extends Entity {
    constructor(config) {
        super(config);
        this.isPlayer = true;
        this.isFriendly = true;
    }
}

export class Mercenary extends Entity {
    constructor(config) {
        super(config);
        this.isFriendly = true;
        this.ai = new MeleeAI();
    }
}

export class Monster extends Entity {
    constructor(config) {
        super(config);
        this.isFriendly = false;
        this.ai = new MeleeAI();
    }
}

export class Item {
    constructor(x, y, tileSize, name, image) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.name = name;
        this.image = image;
        this.width = tileSize;
        this.height = tileSize;
    }

    render(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    getSaveState() {
        return {
            name: this.name,
            x: this.x,
            y: this.y,
        };
    }
}
