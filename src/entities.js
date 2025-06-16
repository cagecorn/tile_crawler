// src/entities.js

import { MeleeAI } from './ai.js';

class Entity {
    constructor(x, y, tileSize, image, groupId) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.groupId = groupId;
        this.x = x;
        this.y = y;
        this.width = tileSize;
        this.height = tileSize;
        this.image = image;
        this.speed = 4; // 기본 이동 속도 통일
        this.attackCooldown = 0;
        this.hp = 1; this.maxHp = 1;
        this.isPlayer = false;
        this.isFriendly = false;
    }
    render(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
    takeDamage(amount) {
        this.hp -= amount;
    }
}

export class Player extends Entity {
    constructor(x, y, tileSize, image, groupId) {
        super(x, y, tileSize, image, groupId);
        this.isPlayer = true;
        this.isFriendly = true;
        // 플레이어는 직접 조종하므로 AI가 없음 (null)
        this.ai = null;
        // ... (스탯 관련 로직은 나중에 StatManager로 옮길 예정)
        this.hp = 20; this.maxHp = 20; this.attackPower = 2;
    }
}

export class Mercenary extends Entity {
    constructor(x, y, tileSize, image, groupId) {
        super(x, y, tileSize, image, groupId);
        this.isFriendly = true;
        this.color = 'green';
        this.hp = 15; this.maxHp = 15;
        this.attackPower = 1;
        this.visionRange = 192 * 4;
        this.attackRange = 192 * 0.8;
        // 이 용병은 '전사형 AI'를 사용
        this.ai = new MeleeAI();
    }
    render(ctx) { /* ... Entity의 render를 사용, 필요시 재정의 ... */ }
}

export class Monster extends Entity {
    constructor(x, y, tileSize, image, groupId, sizeInTiles = { w: 1, h: 1 }) {
        super(x, y, tileSize, image, groupId);
        this.isFriendly = false;
        this.sizeInTiles = sizeInTiles;
        this.width = sizeInTiles.w * tileSize;
        this.height = sizeInTiles.h * tileSize;

        this.color = sizeInTiles.w > 1 ? 'purple' : 'red';
        this.hp = sizeInTiles.w > 1 ? 10 : 3;
        this.maxHp = this.hp;
        this.attackPower = sizeInTiles.w > 1 ? 3 : 1;
        this.expValue = sizeInTiles.w > 1 ? 15 : 5;
        this.visionRange = 192 * 5;
        this.attackRange = 192;
        // 이 몬스터는 '전사형 AI'를 사용
        this.ai = new MeleeAI();
    }
    render(ctx) { /* ... Entity의 render를 사용, 필요시 재정의 ... */ }
}

export class Item { /* ... 변경 없음 ... */ }
