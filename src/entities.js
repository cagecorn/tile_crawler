// 몬스터의 설계도 역할을 하는 Monster 클래스
export class Monster {
    constructor(x, y, tileSize) {
        this.x = x;
        this.y = y;
        this.width = tileSize / 2;
        this.height = tileSize / 2;
        this.color = 'red';
    }

    // 몬스터를 캔버스에 그리는 메서드
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
