import { CombatCalculator } from '../src/combat.js';

console.log("--- Running CombatCalculator Tests ---");
try {
    const calculator = new CombatCalculator(null); // 지금은 eventManager가 필요없음
    const attacker = { attackPower: 10 };
    const defender = { defense: 3 }; // 나중에 방어력 스탯 추가 대비

    const damage = calculator.calculateDamage(attacker, defender);

    if (damage !== 10) {
        throw new Error(`예상 피해량 10, 실제 피해량 ${damage}`);
    }
    console.log("✅ PASSED: 피해량 계산");
} catch (e) {
    console.error(`❌ FAILED: 피해량 계산 - ${e.message}`);
}
