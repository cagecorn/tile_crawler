// src/entities.js

// ai.js에서 상태 클래스들을 가져옵니다.
import { IdleState } from './ai.js';

export class Monster {
    constructor(x, y, tileSize, sizeInTiles = {w: 1, h: 1}) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        
        // 타일 크기를 기반으로 몬스터의 픽셀 크기 계산
        this.sizeInTiles = sizeInTiles;
        this.width = sizeInTiles.w * tileSize - (tileSize / 2);
        this.height = sizeInTiles.h * tileSize - (tileSize / 2);

        this.color = (sizeInTiles.w > 1) ? 'purple' : 'red'; // 크면 보라색, 작으면 빨간색
        
        this.hp = (sizeInTiles.w > 1) ? 10 : 3; // 에픽 몬스터는 HP 10
        this.maxHp = this.hp;

        this.speed = 2;
        this.attackPower = (sizeInTiles.w > 1) ? 3 : 1; // 에픽 몬스터는 공격력 3
        this.attackRange = tileSize * 0.8;
        this.visionRange = tileSize * 5;
        this.attackCooldown = 0;

        // 모든 몬스터는 'Idle' 상태로 시작
        this.state = new IdleState();
    }

    update(player, mapManager, onPlayerAttack) {
        // 자신의 현재 상태에게 행동 로직을 위임
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
