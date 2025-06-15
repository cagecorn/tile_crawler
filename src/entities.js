// src/entities.js

import { IdleState } from './ai.js';

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
