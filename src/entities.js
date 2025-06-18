// src/entities.js

import { MeleeAI, RangedAI } from './ai.js';
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
        // StatManager가 entity 자신을 참조하도록 첫 번째 인자로 전달
        this.stats = new StatManager(this, stats || {});
        this.width = this.stats.get('sizeInTiles_w') * tileSize;
        this.height = this.stats.get('sizeInTiles_h') * tileSize;
        this.hp = this.stats.get('maxHp');
        this.attackCooldown = 0;
        this.isPlayer = false;
        this.isFriendly = false;
        this.ai = null;
        this.unitType = 'generic'; // 기본 유닛 타입을 '일반'으로 설정

        // --- 장비창(Equipment) 추가 ---
        this.equipment = {
            weapon: null,
            armor: null,
            accessory1: null,
            accessory2: null,
        };
    }

    get speed() { return this.stats.get('movementSpeed'); }
    get attackPower() { return this.stats.get('attackPower'); }
    get maxHp() { return this.stats.get('maxHp'); }
    get expValue() { return this.stats.get('expValue'); }
    get visionRange() { return this.stats.get('visionRange'); }
    get attackRange() { return this.stats.get('attackRange'); }

    // --- AI를 동적으로 변경하는 메서드 추가 ---
    updateAI() {
        if (!this.ai) return;

        const weapon = this.equipment.weapon;
        if (weapon && weapon.tags.includes('ranged')) {
            this.ai = new RangedAI();
        } else {
            this.ai = new MeleeAI();
        }
    }

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
        this.unitType = 'human'; // 플레이어의 타입은 '인간'
    }
}

export class Mercenary extends Entity {
    constructor(config) {
        super(config);
        this.isFriendly = true;
        this.unitType = 'human'; // 용병의 타입도 '인간'
        this.ai = new MeleeAI();
    }

    render(ctx) {
        // 1. 기본 이미지를 먼저 그린다
        super.render(ctx);

        // 2. 장착한 무기가 있으면 그 위에 겹쳐서 그린다
        const weapon = this.equipment.weapon;
        if (weapon && weapon.image) {
            const drawX = this.x + this.width * 0.3;
            const drawY = this.y + this.height * 0.3;
            const drawW = this.width * 0.8;
            const drawH = this.height * 0.8;
            ctx.drawImage(weapon.image, drawX, drawY, drawW, drawH);
        }
    }
}

export class Monster extends Entity {
    constructor(config) {
        super(config);
        this.isFriendly = false;
        // 나중에 몬스터 종류에 따라 'undead', 'beast' 등으로 설정 가능
        this.unitType = 'monster'; 
        this.ai = new MeleeAI();
    }
}

export class Item {
    constructor(x, y, tileSize, name, image) {
        this.x = x; this.y = y; this.width = tileSize; this.height = tileSize;
        this.name = name; this.image = image;
        this.baseId = '';
        this.tags = [];
        const statsMap = new Map();
        statsMap.add = function(statObj) {
            for (const key in statObj) {
                this.set(key, (this.get(key) || 0) + statObj[key]);
            }
        };
        this.stats = statsMap;
        this.sockets = [];
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
