import { EffectManager } from '../src/managers/effectManager.js';
import { EventManager } from '../src/eventManager.js';
import { test, assert } from './helpers.js';

console.log("--- Running EffectManager Tests ---");

test('버프 추가', () => {
    const eventManager = new EventManager();
    const effectManager = new EffectManager(eventManager);
    const mockTarget = { effects: [], stats: { recalculate: () => {} } };
    let eventFired = false;
    eventManager.subscribe('stats_changed', () => { eventFired = true; });

    effectManager.addEffect(mockTarget, 'strength_buff');

    assert.strictEqual(mockTarget.effects.length, 1);
    assert.strictEqual(mockTarget.effects[0].name, '힘의 축복');
    assert.ok(eventFired, 'stats_changed 이벤트');
});
