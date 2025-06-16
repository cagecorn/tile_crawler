// src/entities.js

import { IdleState } from './ai.js';
import { StatManager } from './stats.js'; // StatManager를 불러옵니다.

export class Player {
    constructor(x, y, tileSize, job, image, groupId) {
        this.x = x;
        this.y = y;
        this.width = tileSize;
        this.height = tileSize;
        this.image = image;
        this.groupId = groupId;

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

        this.hp = (sizeInTiles.w > 1) ? 10 : 3;
        this.maxHp = this.hp;

        // --- 처치 시 얻는 경험치 추가 ---
        this.expValue = (sizeInTiles.w > 1) ? 15 : 5; // 에픽은 15, 일반은 5
        this.speed = 2;
        this.attackPower = (sizeInTiles.w > 1) ? 3 : 1;
        this.attackRange = tileSize;
        this.visionRange = tileSize * 5;
        this.attackCooldown = 0;
        this.state = new IdleState();
    }

    update(strategy, player, mapManager, onPlayerAttack) {
        this.state.update(this, strategy, player, mapManager, onPlayerAttack);
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
