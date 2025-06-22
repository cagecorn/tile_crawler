import { debugLog } from '../utils/logger.js';

export class SkillEngine {
    constructor(eventManager, skillManager) {
        this.eventManager = eventManager;
        this.skillManager = skillManager;
        if (this.eventManager) {
            this.eventManager.subscribe('skill_used', ({ caster, skill, target }) => {
                this.skillManager?.applySkillEffects(caster, skill, target);
            });
        }
        console.log('[SkillEngine] Initialized');
        debugLog('[SkillEngine] Initialized');
    }

    update() {
        if (this.skillManager && typeof this.skillManager.update === 'function') {
            this.skillManager.update();
        }
    }
}
