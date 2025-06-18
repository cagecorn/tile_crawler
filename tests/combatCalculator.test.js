import { CombatCalculator } from '../src/combat.js';
import { EventManager } from '../src/managers/eventManager.js';
import { test, assert } from './helpers.js';

console.log("--- Running CombatCalculator Tests ---");

test('피해량 계산 이벤트', () => {
    const eventManager = new EventManager();
    const calculator = new CombatCalculator(eventManager);
    let eventData = null;
    eventManager.subscribe('damage_calculated', data => { eventData = data; });

    const originalRandom = Math.random;
    Math.random = () => 0; // deterministic roll

    const attacker = {
        equipment: { weapon: { damageDice: '1d6' } },
        stats: { get: (s) => (s === 'strength' ? 2 : 0) },
    };
    const defender = { stats: { get: (s) => (s === 'defense' ? 1 : 0) } };

    calculator.handleAttack({ attacker, defender });

    Math.random = originalRandom;

    assert.ok(eventData, '이벤트 수신 여부');
    assert.strictEqual(eventData.damage, 2);
    assert.strictEqual(eventData.attacker, attacker);
    assert.strictEqual(eventData.defender, defender);
    assert.ok(eventData.details);
});
