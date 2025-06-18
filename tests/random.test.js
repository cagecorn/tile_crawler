import { rollOnTable } from '../src/utils/random.js';

console.log("--- Running Random (DiceBot) Tests ---");
try {
    const testTable = [
        { id: 'success', weight: 100 },
        { id: 'fail', weight: 0 },
    ];
    const result = rollOnTable(testTable);
    if (result !== 'success') {
        throw new Error(`100% 확률 테스트에서 'success'가 아닌 '${result}'가 나옴`);
    }
    console.log("✅ PASSED: 가중치 기반 롤링");
} catch (e) {
    console.error(`❌ FAILED: 가중치 기반 롤링 - ${e.message}`);
}
