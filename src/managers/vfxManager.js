import { Particle } from '../particle.js';

export class VFXManager {
    constructor(eventManager = null, itemManager = null) {
        this.effects = [];
        this.particles = [];
        this.emitters = [];
        this.eventManager = eventManager;
        this.itemManager = itemManager;
        console.log("[VFXManager] Initialized");
    }

    /**
     * 화살이 날아갈 때 그 궤적을 선으로 그려주는 효과를 추가한다.
     * @param {object} projectile Projectile instance
     * @param {object} [options]
     */
    addArrowTrail(projectile, options = {}) {
        const duration = options.duration || 60;
        const effect = {
            type: 'arrow_trail',
            projectile,
            duration,
            life: duration,
        };
        this.effects.push(effect);
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
     * 작은 사각형 파티클 여러 개를 한 번에 생성합니다.
     * @param {number} x
     * @param {number} y
     * @param {object} [options]
     */
    addParticleBurst(x, y, options = {}) {
        const count = options.count || 8;
        const color = options.color || 'yellow';
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, options));
        }
    }

    /**
     * 지속적으로 파티클을 생성하는 이미터를 추가합니다.
     * @param {number} x
     * @param {number} y
     * @param {object} [options]
     * @returns {object} emitter handle
     */
    addEmitter(x, y, options = {}) {
        const emitter = {
            x,
            y,
            spawnRate: options.spawnRate || 2,
            duration: options.duration !== undefined ? options.duration : 60,
            particleOptions: options.particleOptions || {},
            followTarget: options.followTarget || null,
            offsetX: options.offsetX || 0,
            offsetY: options.offsetY || 0,
        };
        this.emitters.push(emitter);
        return emitter;
    }

    /**
     * 이동체의 위치를 따라가는 궤적 이미터를 생성합니다.
     * @param {object} target Entity or object with x,y properties
     * @param {object} [options]
     */
    createTrail(target, options = {}) {
        return this.addEmitter(target.x, target.y, {
            followTarget: target,
            spawnRate: options.spawnRate || 1,
            duration: options.duration !== undefined ? options.duration : -1,
            particleOptions: options.particleOptions || {},
            offsetX: options.offsetX || target.width / 2 || 0,
            offsetY: options.offsetY || target.height / 2 || 0,
        });
    }

    /**
     * 목표 지점을 향해 수집되는 파티클들을 생성합니다.
     * @param {number} x
     * @param {number} y
     * @param {object} target Object with x,y
     * @param {object} [options]
     */
    addHomingBurst(x, y, target, options = {}) {
        const count = options.count || 12;
        const particleOpts = {
            ...options.particleOptions,
            homingTarget: target,
        };
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, options.color || 'white', particleOpts));
        }
    }

    createDashTrail(fromX, fromY, toX, toY) {
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const progress = i / particleCount;
            const x = fromX + (toX - fromX) * progress;
            const y = fromY + (toY - fromY) * progress;
            const particle = new Particle(x, y, 'rgba(255, 255, 255, 0.5)');
            particle.lifespan = 20;
            particle.gravity = 0;
            this.particles.push(particle);
        }
    }

    /**
     * 아이템이 시체 위치에서 포물선을 그리며 튀어나오는 애니메이션을 추가합니다.
     * 애니메이션이 종료되면 ItemManager에 아이템을 정식으로 추가합니다.
     * @param {object} item - 드롭될 아이템 객체
     * @param {{x:number,y:number}} startPos - 시작 위치
     * @param {{x:number,y:number}} endPos - 최종 위치
     */
    addItemPopAnimation(item, startPos, endPos) {
        const effect = {
            type: 'item_pop',
            item,
            startPos,
            endPos,
            duration: 20,
            life: 20,
            popHeight: 48,
        };
        this.effects.push(effect);
    }

    /**
     * 소모품 사용 시 해당 아이콘이 머리 위에 나타났다 사라지는 효과를 추가합니다.
     * @param {object} entity - 아이템을 사용한 유닛
     * @param {HTMLImageElement} image - 아이템 이미지
     */
    addItemUseEffect(entity, image) {
        if (!image) return;
        const effect = {
            type: 'item_use',
            image,
            x: entity.x + entity.width / 2,
            y: entity.y - entity.height * 0.5,
            duration: 30,
            life: 30,
            startScale: 0.5,
            endScale: 1.5,
            scale: 0.5,
            alpha: 1.0,
        };
        this.effects.push(effect);
    }

    /**
     * 시전 이펙트: 지정 유닛 주변에서 파티클이 모여드는 애니메이션을 생성합니다.
     * 시전 속도가 빠를수록 파티클이 더 빠르게 모여듭니다.
     * 색상은 스킬 태그에 따라 달라집니다.
     * @param {object} caster Entity casting the skill
     * @param {object} skill Skill data object
     */
    castEffect(caster, skill) {
        const centerX = caster.x + caster.width / 2;
        const centerY = caster.y + caster.height / 2;
        let color = 'white';
        if (skill && Array.isArray(skill.tags)) {
            if (skill.tags.includes('fire')) color = 'orange';
            else if (skill.tags.includes('ice')) color = 'cyan';
            else if (skill.tags.includes('holy')) color = 'yellow';
        }
        const radius = Math.max(caster.width, caster.height);
        const strength = 0.03 * (caster.stats.get('castingSpeed') || 1);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const sx = centerX + Math.cos(angle) * radius;
            const sy = centerY + Math.sin(angle) * radius;
            this.addHomingBurst(sx, sy, caster, {
                count: 6,
                color,
                particleOptions: { homingStrength: strength, gravity: 0 }
            });
        }
    }

    /**
     * 몬스터가 죽는 애니메이션을 추가한다.
     * 애니메이션이 끝나면 entity_removed 이벤트를 발행한다.
     * @param {object} entity - 사망한 엔티티
     * @param {string} [type] - explode 또는 fade
     */
    addDeathAnimation(entity, type = 'explode') {
        const effect = {
            type: 'death_animation',
            entity,
            animationType: type,
            duration: 30,
            life: 30,
        };

        if (type === 'explode') {
            this.addParticleBurst(
                entity.x + entity.width / 2,
                entity.y + entity.height / 2,
                { color: 'white', count: 30, speed: 5 }
            );
        }

        this.effects.push(effect);
    }

    /**
     * 지정한 이미터를 제거합니다.
     * @param {object} emitter
     */
    removeEmitter(emitter) {
        const idx = this.emitters.indexOf(emitter);
        if (idx >= 0) {
            this.emitters.splice(idx, 1);
        }
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

    /**
     * 대상 엔티티 이미지를 잠깐 색상으로 덮어씌워 번쩍이는 효과를 줍니다.
     * @param {object} entity - Entity instance (player, monster 등)
     * @param {object} [options]
     */
    flashEntity(entity, options = {}) {
        const effect = {
            type: 'flash',
            entity,
            duration: options.duration || 6,
            color: options.color || 'rgba(255,0,0,0.5)'
        };
        this.effects.push(effect);
    }

    update() {
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const e = this.emitters[i];
            if (e.followTarget) {
                e.x = e.followTarget.x + e.offsetX;
                e.y = e.followTarget.y + e.offsetY;
            }

            for (let j = 0; j < e.spawnRate; j++) {
                this.particles.push(new Particle(e.x, e.y, e.particleOptions.color || 'white', e.particleOptions));
            }

            if (e.duration > 0) {
                e.duration--;
                if (e.duration <= 0) {
                    this.emitters.splice(i, 1);
                }
            }
        }

        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];

            if (effect.type === 'death_animation') {
                effect.life--;
                if (effect.life <= 0) {
                    if (this.eventManager) {
                        this.eventManager.publish('entity_removed', { victimId: effect.entity.id });
                    }
                    this.effects.splice(i, 1);
                }
                continue;
            }

            if (effect.type === 'item_pop') {
                effect.life--;
                if (effect.life <= 0) {
                    if (this.itemManager && effect.item) {
                        effect.item.x = effect.endPos.x;
                        effect.item.y = effect.endPos.y;
                        this.itemManager.addItem(effect.item);
                    }
                    this.effects.splice(i, 1);
                }
                continue;
            }

            if (effect.type === 'item_use') {
                effect.life--;
                const progress = 1 - effect.life / effect.duration;
                effect.scale = effect.startScale + (effect.endScale - effect.startScale) * progress;
                effect.alpha = 1 - progress;
                if (effect.life <= 0) {
                    this.effects.splice(i, 1);
                }
                continue;
            }


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
            } else if (effect.type === 'flash') {
                effect.duration--;
                if (effect.duration <= 0) {
                    this.effects.splice(i, 1);
                }
            } else if (effect.type === 'arrow_trail') {
                effect.life--;
                if (effect.life <= 0 || effect.projectile.isDead) {
                    this.effects.splice(i, 1);
                }
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.lifespan <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const effect of this.effects) {
            if (effect.type === 'death_animation') {
                const { entity, animationType, life, duration } = effect;
                const progress = life / duration;

                ctx.save();
                if (animationType === 'explode') {
                    if (progress > 0.66) {
                        ctx.globalAlpha = (1 - progress) * 3;
                        ctx.drawImage(entity.image, entity.x, entity.y, entity.width, entity.height);
                        ctx.globalCompositeOperation = 'source-atop';
                        ctx.fillStyle = 'white';
                        ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
                    }
                } else if (animationType === 'fade') {
                    ctx.globalAlpha = progress;
                    ctx.drawImage(entity.image, entity.x, entity.y, entity.width, entity.height);
                }
                ctx.restore();
            } else if (effect.type === 'item_pop') {
                const { item, startPos, endPos, life, duration, popHeight } = effect;
                const progress = 1 - (life / duration);
                const currentX = startPos.x + (endPos.x - startPos.x) * progress;
                const currentY = startPos.y + (endPos.y - startPos.y) * progress;
                const arc = Math.sin(progress * Math.PI) * popHeight;
                ctx.drawImage(item.image, currentX, currentY - arc, item.width, item.height);
            } else if (effect.type === 'item_use') {
                const w = effect.image.width * effect.scale;
                const h = effect.image.height * effect.scale;
                ctx.save();
                ctx.globalAlpha = effect.alpha;
                ctx.drawImage(effect.image, effect.x - w / 2, effect.y - h / 2, w, h);
                ctx.restore();
            } else if (effect.type === 'glow') {
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
            } else if (effect.type === 'flash') {
                const { entity } = effect;
                ctx.save();
                ctx.drawImage(entity.image, entity.x, entity.y, entity.width, entity.height);
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = effect.color;
                ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
                ctx.restore();
            } else if (effect.type === 'arrow_trail') {
                const p = effect.projectile;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(p.startX, p.startY);
                ctx.lineTo(p.x + p.width / 2, p.y + p.height / 2);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = effect.life / effect.duration;
                ctx.stroke();
                ctx.restore();
            }
        }

        for (const p of this.particles) {
            p.render(ctx);
        }
    }
}

