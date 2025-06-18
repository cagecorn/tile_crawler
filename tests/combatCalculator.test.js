import { CombatCalculator } from '../src/combat.js';
import { EventManager } from '../src/eventManager.js';
import { test, assert } from './helpers.js';

console.log("--- Running CombatCalculator Tests ---");

test('피해량 계산 이벤트', () => {
    const eventManager = new EventManager();
    const calculator = new CombatCalculator(eventManager);
    let eventData = null;
    eventManager.subscribe('damage_calculated', data => { eventData = data; });

    const attacker = { attackPower: 10 };
    const defender = {};
    calculator.handleAttack({ attacker, defender });

    assert.ok(eventData, '이벤트 수신 여부');
    assert.strictEqual(eventData.damage, 10);
    assert.strictEqual(eventData.attacker, attacker);
    assert.strictEqual(eventData.defender, defender);
});
