// src/entities.js

export class Monster {
    constructor(x, y, tileSize) {
        this.id = Math.random().toString(36).substr(2, 9); // 각 몬스터를 구별할 고유 ID
        this.x = x;
        this.y = y;
        this.width = tileSize / 2;
        this.height = tileSize / 2;
        this.color = 'red';
        this.hp = 3; // 몬스터의 체력
        this.maxHp = 3; // 최대 체력 속성 추가
    }

    takeDamage(amount) {
        this.hp -= amount;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
