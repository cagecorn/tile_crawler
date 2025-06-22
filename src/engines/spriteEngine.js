import { debugLog } from '../utils/logger.js';

export class SpriteEngine {
    constructor(eventManager, vfxManager) {
        this.eventManager = eventManager;
        this.vfxManager = vfxManager;
        this.animations = [];

        if (this.eventManager) {
            this.eventManager.subscribe('play_sprite_animation', data => {
                const { frames = [], x = 0, y = 0, frameDuration = 5, loop = false } = data || {};
                if (frames.length === 0) return;
                this.animations.push({
                    frames,
                    x,
                    y,
                    frameDuration,
                    loop,
                    currentFrame: 0,
                    timer: frameDuration,
                });
            });

            this.eventManager.subscribe('cancel_sprite_animation', anim => {
                const idx = this.animations.indexOf(anim);
                if (idx !== -1) this.animations.splice(idx, 1);
            });
        }

        console.log('[SpriteEngine] Initialized');
        debugLog('[SpriteEngine] Initialized');
    }

    update() {
        if (!this.vfxManager) return;
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            if (anim.timer-- <= 0) {
                anim.currentFrame++;
                if (anim.currentFrame >= anim.frames.length) {
                    if (anim.loop) {
                        anim.currentFrame = 0;
                    } else {
                        this.animations.splice(i, 1);
                        continue;
                    }
                }
                anim.timer = anim.frameDuration;
            }

            const frameImage = anim.frames[anim.currentFrame];
            if (frameImage) {
                this.vfxManager.addSpriteEffect(frameImage, anim.x, anim.y);
            }
        }
    }
}
