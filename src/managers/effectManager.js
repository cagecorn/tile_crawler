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
            existingEffect.duration = effectData.duration;
        } else {
            const newEffect = { ...effectData, remaining: effectData.duration };
            target.effects.push(newEffect);
        }

        // 효과가 적용되면 스탯을 다시 계산하도록 이벤트 발행
        this.eventManager.publish('stats_changed', { entity: target });
    }

    // 매 프레임 모든 유닛의 효과를 업데이트
    update(entities) {
        entities.forEach(entity => {
            if (entity.effects.length === 0) return;

            // 효과 지속시간 감소
            entity.effects.forEach(effect => {
                effect.remaining--;
                // (미래 구멍) '독' 같은 상태이상 데미지 처리
                if (effect.type === 'dot' && effect.remaining % 100 === 0) {
                    // entity.takeDamage(effect.damagePerTurn);
                }
            });

            // 지속시간이 다 된 효과 제거
            const initialCount = entity.effects.length;
            entity.effects = entity.effects.filter(effect => effect.remaining > 0);

            // 효과가 제거되었다면, 스탯 재계산 이벤트 발행
            if (entity.effects.length < initialCount) {
                this.eventManager.publish('stats_changed', { entity: entity });
            }
        });
    }
}
