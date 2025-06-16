// src/entities.js

import { MeleeAI } from './ai.js';
import { StatManager } from './stats.js';

class Entity {
    constructor(x, y, tileSize, image, groupId, statsConfig = {}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.groupId = groupId;
        this.x = x;
        this.y = y;
        this.image = image;

        // --- StatManager를 부모가 가장 먼저 생성! ---
        this.stats = new StatManager(statsConfig);

        this.width = (this.stats.get('sizeInTiles_w') || 1) * tileSize;
        this.height = (this.stats.get('sizeInTiles_h') || 1) * tileSize;

        this.hp = this.stats.get('maxHp');
        this.attackCooldown = 0;

        this.isPlayer = false;
        this.isFriendly = false;
        this.ai = null;

        // 스탯에서 바로 불러올 수 있는 값들은 미리 설정
        this.visionRange = this.stats.get('visionRange');
        this.attackRange = this.stats.get('attackRange');
    }

    get speed() { return this.stats.get('movementSpeed'); }
    get attackPower() { return this.stats.get('attackPower'); }

    render(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
    }
}

export class Player extends Entity {
    constructor(x, y, tileSize, image, groupId, job = {}) {
        // 직업(job) 정보를 스탯 설정으로 전달
        super(x, y, tileSize, image, groupId, job);
        this.isPlayer = true;
        this.isFriendly = true;
        this.ai = null; // 플레이어는 직접 조종
        this._maxHpBonus = 0;
        this._attackPowerBonus = 0;
    }

    allocateStatPoint(stat) {
        this.stats.allocatePoint(stat);
        this.stats.recalculate();
    }

    get speed() { return this.stats.get('movementSpeed'); }
    set speed(value) {
        this.stats._baseStats.movement = value;
        this.stats.recalculate();
    }

    get attackPower() { return this.stats.get('attackPower') + this._attackPowerBonus; }
    set attackPower(value) {
        this._attackPowerBonus = value - this.stats.get('attackPower');
    }

    get maxHp() { return this.stats.get('maxHp') + this._maxHpBonus; }
    set maxHp(value) {
        this._maxHpBonus = value - this.stats.get('maxHp');
    }
}

export class Mercenary extends Entity {
    constructor(x, y, tileSize, image, groupId, job = {}) {
        super(x, y, tileSize, image, groupId, job);
        this.isFriendly = true;
        this.ai = new MeleeAI();
    }
}

export class Monster extends Entity {
    constructor(x, y, tileSize, image, groupId, config = {}) {
        super(x, y, tileSize, image, groupId, config);
        this.isFriendly = false;
        this.ai = new MeleeAI();
    }
    get expValue() { return this.stats.get('expValue'); }
}

export class Item { /* ... 변경 없음 ... */ }
