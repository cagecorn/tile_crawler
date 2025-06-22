import { debugLog } from '../utils/logger.js';

export class ProjectileEngine {
    constructor(eventManager, projectileManager) {
        this.eventManager = eventManager;
        this.projectileManager = projectileManager;

        if (this.eventManager) {
            this.eventManager.subscribe('skill_used', ({ caster, skill, target }) => {
                if (skill?.projectile && target) {
                    this.projectileManager?.create(caster, target, skill);
                }
            });
        }

        console.log('[ProjectileEngine] Initialized');
        debugLog('[ProjectileEngine] Initialized');
    }

    update(entities) {
        if (this.projectileManager && typeof this.projectileManager.update === 'function') {
            this.projectileManager.update(entities);
        }
    }
}
