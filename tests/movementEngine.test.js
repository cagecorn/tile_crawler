import { MovementEngine } from '../src/engines/movementEngine.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('MovementEngine', () => {
  test('move_entity 이벤트로 MovementManager.moveEntityTowards 호출', () => {
    const em = new EventManager();
    let called = false;
    const mm = { moveEntityTowards: () => { called = true; } };
    new MovementEngine(em, mm);
    em.publish('move_entity', { entity:{}, target:{}, context:{} });
    assert.ok(called);
  });
});
