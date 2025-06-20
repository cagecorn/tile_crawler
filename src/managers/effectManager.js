import { EFFECTS } from '../data/effects.js';

export class EffectManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        console.log("[EffectManager] Initialized");
    }

    // 특정 유닛에게 효과를 추가하는 함수
    addEffect(target, effectId) {
        const effectData = EFFECTS[effectId];
        if (!effectData) return;

        // 이미 같은 효과가 걸려있다면, 지속시간만 갱신 (나중에 중첩 로직 추가 가능)
        const existingEffect = target.effects.find(e => e.id === effectId);
        if (existingEffect) {
            existingEffect.remaining = effectData.duration;
        } else {
            const newEffect = { id: effectId, ...effectData, remaining: effectData.duration };
            target.effects.push(newEffect);
            if (effectData.type === 'shield') {
                target.shield = (target.shield || 0) + effectData.shieldAmount;
            } else if (effectData.type === 'damage_buff') {
                target.damageBonus = (target.damageBonus || 0) + effectData.bonusDamage;
            }
        }

        // 효과가 적용되면 스탯을 다시 계산하도록 이벤트 발행
        this.eventManager.publish('stats_changed', { entity: target });
    }

    // 매 프레임 모든 유닛의 효과를 업데이트
    update(entities) {
        entities.forEach(entity => {
            if (entity.effects.length === 0) return;

            entity.effects.forEach(effect => {
                effect.remaining--;

                if (effect.type === 'dot' && effect.remaining % 100 === 0) {
                    entity.takeDamage(effect.damagePerTurn);
                }
            });

            const initialCount = entity.effects.length;
            entity.effects = entity.effects.filter(effect => {
                if (effect.remaining > 0) return true;

                if (effect.type === 'shield') {
                    entity.shield = Math.max(0, entity.shield - (effect.shieldAmount || 0));
                } else if (effect.type === 'damage_buff') {
                    entity.damageBonus = Math.max(0, entity.damageBonus - (effect.bonusDamage || 0));
                }
                return false;
            });

            if (entity.effects.length < initialCount) {
                this.eventManager.publish('stats_changed', { entity });
            }
        });
    }
}
