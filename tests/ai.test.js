import { MeleeAI } from '../src/ai.js';

console.log("--- Running AI Tests ---");
try {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 10 };
    const context = { enemies: [{ x: 5, y: 0 }] }; // 5칸 떨어진 적

    const action = ai.decideAction(self, context);
    if (action.type !== 'attack') {
        throw new Error(`공격 범위 내의 적에게 'attack'이 아닌 '${action.type}' 결정`);
    }
    console.log("✅ PASSED: MeleeAI - 공격 결정");
} catch (e) {
    console.error(`❌ FAILED: MeleeAI - 공격 결정 - ${e.message}`);
}
