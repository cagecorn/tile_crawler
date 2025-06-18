import { rollOnTable } from '../src/utils/random.js';
import { test, assert } from './helpers.js';

console.log("--- Running Random (DiceBot) Tests ---");

test('가중치 기반 롤링', () => {
    const testTable = [
        { id: 'success', weight: 100 },
        { id: 'fail', weight: 0 },
    ];
    const result = rollOnTable(testTable);
    assert.strictEqual(result, 'success');
});
