export class VFXManager {
    constructor() {
        this.effects = [];
        console.log("[VFXManager] Initialized");
    }

    /**
     * 간단한 빛나는 파티클을 추가합니다.
     * @param {number} x
     * @param {number} y
     * @param {object} [options]
     */
    addGlow(x, y, options = {}) {
        const effect = {
            type: 'glow',
            x,
            y,
            radius: options.radius || 20,
            alpha: options.alpha || 1.0,
            decay: options.decay || 0.05,
            colorInner: options.colorInner || 'rgba(255, 200, 100, ALPHA)',
            colorOuter: options.colorOuter || 'rgba(255, 100, 0, 0)',
            blendMode: 'lighter',
        };
        this.effects.push(effect);
    }

    update() {
        this.effects.forEach((effect, index) => {
            effect.alpha -= effect.decay;
            if (effect.alpha <= 0) {
                this.effects.splice(index, 1);
            }
        });
    }

    render(ctx) {
        for (const effect of this.effects) {
            if (effect.type === 'glow') {
                const { x, y, radius } = effect;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, effect.colorInner.replace('ALPHA', effect.alpha.toFixed(2)));
                gradient.addColorStop(1, effect.colorOuter);

                ctx.save();
                ctx.globalCompositeOperation = effect.blendMode;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            }
        }
    }
}
