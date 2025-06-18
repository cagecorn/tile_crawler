import { TurnManager } from '../src/turnManager.js';

console.log("--- Running TurnManager Tests ---");
try {
    const turnManager = new TurnManager();
    turnManager.framesPerTurn = 10;
    for (let i = 0; i < 10; i++) {
        turnManager.update([]);
    }
    if (turnManager.turnCount !== 1) {
        throw new Error(`10프레임 후 턴 카운트가 1이 아님 (실제: ${turnManager.turnCount})`);
    }
    console.log("✅ PASSED: 턴 카운트 증가");
} catch (e) {
    console.error(`❌ FAILED: 턴 카운트 증가 - ${e.message}`);
}
