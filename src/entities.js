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
        this.mp = this.stats.get('maxMp');
        this.skills = [];
        this.skillCooldowns = {};
        this.attackCooldown = 0;
        this.isPlayer = false;
        this.isFriendly = false;
        this.ai = null;
        this.effects = []; // 적용중인 효과 목록 배열 추가
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
    get maxMp() { return this.stats.get('maxMp'); }
    get hpRegen() { return this.stats.get('hpRegen'); }
    get mpRegen() { return this.stats.get('mpRegen'); }
    get expValue() { return this.stats.get('expValue'); }
    get visionRange() { return this.stats.get('visionRange'); }
    get attackRange() { return this.stats.get('attackRange'); }
    get castingSpeed() { return this.stats.get('castingSpeed'); }
    get attackSpeed() { return this.stats.get('attackSpeed'); }

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

    update(context) {
        this.applyRegen();
        if (this.ai) {
            const action = this.ai.decideAction(this, context);
            context.metaAIManager.executeAction(this, action, context);
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        for (const skillId in this.skillCooldowns) {
            if (this.skillCooldowns[skillId] > 0) {
                this.skillCooldowns[skillId]--;
            }
        }
    }

    applyRegen() {
        const hpRegen = this.stats.get('hpRegen');
        if (hpRegen) {
            this.hp = Math.min(this.maxHp, this.hp + hpRegen);
        }
        const mpRegen = this.stats.get('mpRegen');
        if (mpRegen) {
            this.mp = Math.min(this.maxMp, this.mp + mpRegen);
        }
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

    render(ctx) {
        // 기본 이미지를 그린다
        super.render(ctx);

        if (this.equipmentRenderManager) {
            this.equipmentRenderManager.drawWeapon(ctx, this);
        } else {
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
}

export class Mercenary extends Entity {
    constructor(config) {
        super(config);
        this.isFriendly = true;
        this.unitType = 'human'; // 용병의 타입도 '인간'
        this.ai = new MeleeAI();
        this.inventory = [];

        this.stuckCounter = 0;
        this.maxStuckCount = 5;
        this.lastPosition = { x: this.x, y: this.y };
    }

    render(ctx) {
        // 1. 기본 이미지를 먼저 그린다
        super.render(ctx);

        if (this.equipmentRenderManager) {
            this.equipmentRenderManager.drawWeapon(ctx, this);
        } else {
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

    update(context) {
        const prevX = this.x;
        const prevY = this.y;
        super.update(context);

        if (this.x === prevX && this.y === prevY) {
            this.stuckCounter++;
            if (this.stuckCounter >= this.maxStuckCount) {
                const tileSize = context.mapManager.tileSize;
                const startX = Math.floor(this.x / tileSize);
                const startY = Math.floor(this.y / tileSize);
                const allEntities = [
                    context.player,
                    ...context.monsterManager.monsters,
                    ...context.mercenaryManager.mercenaries
                ];
                const isBlocked = (x, y) => {
                    for (const e of allEntities) {
                        if (e === this) continue;
                        const ex = Math.floor(e.x / tileSize);
                        const ey = Math.floor(e.y / tileSize);
                        if (ex === x && ey === y) return true;
                    }
                    return false;
                };
                const escape = context.pathfindingManager.findEscapeRoute(startX, startY, isBlocked);
                if (escape) {
                    this.x = escape.x * tileSize;
                    this.y = escape.y * tileSize;
                }
                this.stuckCounter = 0;
            }
        } else {
            this.stuckCounter = 0;
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

export class Projectile {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.target = config.target;
        this.speed = config.speed || 10;
        this.acceleration = config.acceleration || 0;
        this.image = config.image;
        this.width = config.width || 32;
        this.height = config.height || 32;
        this.damage = config.damage;
        this.caster = config.caster;
        // 밝게 그려야 하는 마법 투사체의 경우 blendMode를 'lighter'로 설정할 수 있다
        this.blendMode = config.blendMode || null;

        this.vfxManager = config.vfxManager || null;
        this.enableGlow = config.enableGlow || false;
    }

    update() {
        // 주기적으로 파티클을 생성하여 이동 경로에 잔상을 남김
        if (this.enableGlow && this.vfxManager) {
            this.vfxManager.addGlow(
                this.x + this.width / 2,
                this.y + this.height / 2
            );
        }

        // 가속도 적용
        this.speed += this.acceleration;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            return { collided: true, target: this.target };
        }

        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;

        return { collided: false };
    }

    render(ctx) {
        ctx.save();

        if (this.blendMode) {
            ctx.globalCompositeOperation = this.blendMode;
        }

        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }

}
