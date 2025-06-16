// src/entities.js

import { MeleeAI } from './ai.js';
import { StatManager } from './stats.js'; // StatManager를 불러옵니다.

export class Player {
    constructor(x, y, tileSize, job, image, groupId) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.width = tileSize;
        this.height = tileSize;
        this.image = image;
        this.groupId = groupId;

        this.isPlayer = true;
        this.isFriendly = true;

        // --- StatManager를 생성하고 플레이어의 모든 스탯을 위임 ---
        this.stats = new StatManager(job);

        this.hp = this.stats.get('maxHp'); // 현재 HP
        this._maxHpBonus = 0;
        this._attackPowerBonus = 0;

        this.attackCooldown = 0;
    }

    // 스탯이 오르면 StatManager에 알리고 재계산
    allocateStatPoint(stat) {
        this.stats.increaseBaseStat(stat, 1);
        this.stats.recalculate();
    }

    // 파생 스탯이 필요할 땐 StatManager에 요청
    get speed() {
        return this.stats.get('movementSpeed');
    }

    get attackPower() {
        return this.stats.get('attackPower') + this._attackPowerBonus;
    }

    set attackPower(value) {
        this._attackPowerBonus = value - this.stats.get('attackPower');
    }

    get maxHp() {
        return this.stats.get('maxHp') + this._maxHpBonus;
    }

    set maxHp(value) {
        this._maxHpBonus = value - this.stats.get('maxHp');
    }

    // 레벨과 경험치를 StatManager에서 조회하기 위한 게터
    get level() {
        return this.stats.get('level');
    }

    get exp() {
        return this.stats.get('exp');
    }

    get expNeeded() {
        return this.stats.get('expNeeded');
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
    }

    render(ctx) {
        // fillRect 대신 drawImage 사용
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}

export class Monster {
    constructor(x, y, tileSize, image, groupId, sizeInTiles = {w: 1, h: 1}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.groupId = groupId;
        this.sizeInTiles = sizeInTiles;
        // 픽셀 크기 계산을 조금 더 정확하게 수정
        this.width = sizeInTiles.w * tileSize;
        this.height = sizeInTiles.h * tileSize;
        this.image = image;
        this.tileSize = tileSize;

        this.isPlayer = false;
        this.isFriendly = false;

        this.hp = (sizeInTiles.w > 1) ? 10 : 3;
        this.maxHp = this.hp;

        // --- 처치 시 얻는 경험치 추가 ---
        this.expValue = (sizeInTiles.w > 1) ? 15 : 5; // 에픽은 15, 일반은 5
        this.speed = 2;
        this.attackPower = (sizeInTiles.w > 1) ? 3 : 1;
        this.attackRange = tileSize;
        this.visionRange = tileSize * 5;
        this.attackCooldown = 0;
        this.ai = new MeleeAI();
    }

    update(context) {
        if (this.attackCooldown > 0) this.attackCooldown--;
        const action = this.ai.decideAction(this, context);
        const { mapManager } = context;

        if (action.type === 'move' && action.target) {
            const dx = action.target.x - this.x;
            const dy = action.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                const moveX = (dx / distance) * this.speed;
                const moveY = (dy / distance) * this.speed;
                const newX = this.x + moveX;
                const newY = this.y + moveY;
                if (!mapManager.isWallAt(newX, newY, this.width, this.height)) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        } else if (action.type === 'attack' && action.target) {
            if (this.attackCooldown === 0) {
                if (action.target.isPlayer && context.onPlayerAttack) {
                    context.onPlayerAttack(this.attackPower);
                } else if (context.monsterManager && !action.target.isFriendly) {
                    const gained = context.monsterManager.handleAttackOnMonster(action.target.id, this.attackPower);
                    if (gained > 0 && context.onGainExp) context.onGainExp(gained);
                } else {
                    action.target.takeDamage(this.attackPower);
                }
                this.attackCooldown = 60;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
    }

    render(ctx) {
        // fillRect 대신 drawImage 사용
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}

export class Mercenary {
    constructor(x, y, tileSize, image, groupId) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.width = tileSize;
        this.height = tileSize;
        this.image = image;
        this.groupId = groupId;

        this.isPlayer = false;
        this.isFriendly = true;

        this.hp = 5;
        this.maxHp = 5;
        this.speed = 2;
        this.attackPower = 2;
        this.attackRange = tileSize;
        this.visionRange = tileSize * 5;
        this.attackCooldown = 0;
        this.ai = new MeleeAI();
    }

    update(context) {
        if (this.attackCooldown > 0) this.attackCooldown--;
        const action = this.ai.decideAction(this, context);
        const { mapManager } = context;

        if (action.type === 'move' && action.target) {
            const dx = action.target.x - this.x;
            const dy = action.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                const moveX = (dx / distance) * this.speed;
                const moveY = (dy / distance) * this.speed;
                const newX = this.x + moveX;
                const newY = this.y + moveY;
                if (!mapManager.isWallAt(newX, newY, this.width, this.height)) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        } else if (action.type === 'attack' && action.target) {
            if (this.attackCooldown === 0) {
                if (!action.target.isFriendly && context.monsterManager) {
                    const gained = context.monsterManager.handleAttackOnMonster(action.target.id, this.attackPower);
                    if (gained > 0 && context.onGainExp) context.onGainExp(gained);
                } else {
                    action.target.takeDamage(this.attackPower);
                }
                this.attackCooldown = 30;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
    }

    render(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}

// === 아래 Item 클래스를 파일 맨 아래에 새로 추가 ===
export class Item {
    constructor(x, y, tileSize, name, image) {
        this.x = x;
        this.y = y;
        this.width = tileSize;
        this.height = tileSize;
        this.name = name;
        this.image = image;
    }

    render(ctx) {
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}
