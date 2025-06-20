export class SkillManager {
    constructor(eventManager = null) {
        this.eventManager = eventManager;
        this.effectManager = null;
        console.log("[SkillManager] Initialized");

        if (this.eventManager) {
            this.eventManager.subscribe('skill_used', ({ caster, skill, target }) => {
                this.applySkillEffects(caster, skill, target);
            });
        }
    }

    setEffectManager(effectManager) {
        this.effectManager = effectManager;
    }

    applySkillEffects(caster, skill, target = null) {
        if (!skill || !this.effectManager) return;
        if (skill.effects) {
            if (skill.effects.self) {
                for (const eff of skill.effects.self) {
                    this.effectManager.addEffect(caster, eff);
                }
            }
            if (skill.effects.target && target) {
                for (const eff of skill.effects.target) {
                    this.effectManager.addEffect(target, eff);
                }
            }
        }
        if (skill.removeTags && target) {
            for (const tag of skill.removeTags) {
                this.effectManager.removeEffectsByTag(target, tag);
            }
        }
    }
}
