// src/entities.js

import { IdleState } from './ai.js';

export class Player {
    constructor(x, y, tileSize, job, image) {
        this.x = x;
        this.y = y;
        this.width = tileSize;
        this.height = tileSize;
        this.image = image; // 'color' 대신 'image' 사용
        this.speed = 5;

        this.hp = job.maxHp;
        this.maxHp = job.maxHp;
        this.attackPower = job.attackPower;
        this.attackCooldown = 0;
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
    constructor(x, y, tileSize, image, sizeInTiles = {w: 1, h: 1}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.sizeInTiles = sizeInTiles;
        // 픽셀 크기 계산을 조금 더 정확하게 수정
        this.width = sizeInTiles.w * tileSize;
        this.height = sizeInTiles.h * tileSize;
        this.image = image;

        this.hp = (sizeInTiles.w > 1) ? 10 : 3;
        this.maxHp = this.hp;
        this.speed = 2;
        this.attackPower = (sizeInTiles.w > 1) ? 3 : 1;
        this.attackRange = tileSize;
        this.visionRange = tileSize * 5;
        this.attackCooldown = 0;
        this.state = new IdleState();
    }

    update(player, mapManager, onPlayerAttack) {
        this.state.update(this, player, mapManager, onPlayerAttack);
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
