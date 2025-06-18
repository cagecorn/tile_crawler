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

    /**
     * 이미지 스프라이트 이펙트를 추가합니다.
     * 대상 위치에 밝게 표시되며 일정 시간 후 사라집니다.
     * @param {HTMLImageElement} image
     * @param {number} x
     * @param {number} y
     * @param {object} [options]
     */
    addSpriteEffect(image, x, y, options = {}) {
        const effect = {
            type: 'sprite',
            image,
            x,
            y,
            width: options.width || image.width,
            height: options.height || image.height,
            duration: options.duration || 20,
            alpha: options.alpha || 1.0,
            fade: options.fade || 0.05,
            blendMode: options.blendMode || 'lighter',
        };
        this.effects.push(effect);
    }

    update() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            if (effect.type === 'glow') {
                effect.alpha -= effect.decay;
                if (effect.alpha <= 0) {
                    this.effects.splice(i, 1);
                }
            } else if (effect.type === 'sprite') {
                effect.duration--;
                effect.alpha -= effect.fade;
                if (effect.duration <= 0 || effect.alpha <= 0) {
                    this.effects.splice(i, 1);
                }
            }
        }
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
            } else if (effect.type === 'sprite') {
                ctx.save();
                ctx.globalCompositeOperation = effect.blendMode;
                ctx.globalAlpha = effect.alpha;
                ctx.drawImage(
                    effect.image,
                    effect.x - effect.width / 2,
                    effect.y - effect.height / 2,
                    effect.width,
                    effect.height
                );
                ctx.restore();
            }
        }
    }
}
