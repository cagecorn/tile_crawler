// src/entities.js

import { IdleState } from './ai.js';

// --- Player 클래스 새로 추가 ---
export class Player {
    constructor(x, y, tileSize, job) {
        this.x = x;
        this.y = y;
        this.width = tileSize / 2;
        this.height = tileSize / 2;
        this.color = 'blue';
        this.speed = 5;

        // 직업(job) 객체로부터 능력치를 설정
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
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

export class Monster {
    constructor(x, y, tileSize, sizeInTiles = {w: 1, h: 1}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        
        this.sizeInTiles = sizeInTiles;
        this.width = sizeInTiles.w * tileSize - (tileSize / 2);
        this.height = sizeInTiles.h * tileSize - (tileSize / 2);

        this.color = (sizeInTiles.w > 1) ? 'purple' : 'red';
        
        this.hp = (sizeInTiles.w > 1) ? 10 : 3;
        this.maxHp = this.hp;

        this.speed = 2;
        this.attackPower = (sizeInTiles.w > 1) ? 3 : 1;
        this.attackRange = tileSize * 0.8;
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
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
