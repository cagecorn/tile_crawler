import { EffectManager } from '../src/managers/effectManager.js';
import { EventManager } from '../src/eventManager.js';

console.log("--- Running EffectManager Tests ---");
try {
    const eventManager = new EventManager();
    const effectManager = new EffectManager(eventManager);
    const mockTarget = { effects: [], stats: { recalculate: () => {} } };

    effectManager.addEffect(mockTarget, 'strength_buff');

    if (mockTarget.effects.length !== 1 || mockTarget.effects[0].id !== 'strength_buff') {
        throw new Error("버프가 정상적으로 추가되지 않음");
    }
    console.log("✅ PASSED: 버프 추가");
} catch (e) {
    console.error(`❌ FAILED: 버프 추가 - ${e.message}`);
}
