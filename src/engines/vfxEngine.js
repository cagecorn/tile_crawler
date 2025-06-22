import { debugLog } from '../utils/logger.js';

export class VFXEngine {
    constructor(eventManager, vfxManager, assets = {}) {
        this.eventManager = eventManager;
        this.vfxManager = vfxManager;
        this.assets = assets;

        if (this.eventManager) {
            this.eventManager.subscribe('entity_attack', data => {
                if (!data.skill || !data.skill.projectile) {
                    this.vfxManager.addSpriteEffect(
                        this.assets['strike-effect'],
                        data.defender.x,
                        data.defender.y,
                        {
                            width: data.defender.width,
                            height: data.defender.height,
                        }
                    );
                }
            });

            this.eventManager.subscribe('skill_used', data => {
                const { caster, skill, target } = data;
                this.vfxManager.castEffect(caster, skill);
                if (skill?.vfxKey && this.assets[skill.vfxKey]) {
                    const ent = target || caster;
                    this.vfxManager.addSpriteEffect(
                        this.assets[skill.vfxKey],
                        ent.x + ent.width / 2,
                        ent.y + ent.height / 2,
                        {
                            width: ent.width,
                            height: ent.height,
                        }
                    );
                }
            });

            this.eventManager.subscribe('entity_damaged', data => {
                this.vfxManager.flashEntity(data.defender, { color: 'rgba(255, 100, 100, 0.6)' });
            });

            // Death VFX is handled in registerGameEventListeners so tests can
            // easily verify removal and loot logic without requiring this engine.

            this.eventManager.subscribe('ai_mbti_trait_triggered', data => {
                this.vfxManager.addTextPopup(data.trait, data.entity);
            });

            this.eventManager.subscribe('knockback_wall_impact', data => {
                const centerX = data.defender.x + data.defender.width / 2;
                const centerY = data.defender.y + data.defender.height / 2;
                this.vfxManager.addShockwave(centerX, centerY, { duration: 20 });
            });
        }

        console.log('[VFXEngine] Initialized');
        debugLog('[VFXEngine] Initialized');
    }

    update() {
        if (this.vfxManager && typeof this.vfxManager.update === 'function') {
            this.vfxManager.update();
        }
    }
}
