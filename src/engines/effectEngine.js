import { debugLog } from '../utils/logger.js';

export class EffectEngine {
    constructor(eventManager, effectManager) {
        this.eventManager = eventManager;
        this.effectManager = effectManager;

        if (this.eventManager) {
            this.eventManager.subscribe('apply_effect', data => {
                const { target, effectId, caster } = data || {};
                if (target && effectId) {
                    this.effectManager.addEffect(target, effectId, caster);
                }
            });

            this.eventManager.subscribe('remove_effect', data => {
                const { target, effect } = data || {};
                if (target && effect) {
                    this.effectManager.removeEffect(target, effect);
                }
            });
        }

        console.log('[EffectEngine] Initialized');
        debugLog('[EffectEngine] Initialized');
    }

    update(entities) {
        if (this.effectManager && typeof this.effectManager.update === 'function') {
            this.effectManager.update(entities);
        }
    }
}
