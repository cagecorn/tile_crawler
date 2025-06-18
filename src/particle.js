export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.1;
        this.lifespan = 60 + Math.random() * 30;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.lifespan--;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.lifespan / 60;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}
