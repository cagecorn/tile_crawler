import { MicroTurnEngine } from '../src/engines/microTurnEngine.js';
import { describe, test, assert } from './helpers.js';

describe('MicroTurnEngine', () => {
  test('update가 MicroTurnManager.update를 호출한다', () => {
    let called = false;
    const manager = { update: () => { called = true; } };
    const engine = new MicroTurnEngine(manager);
    engine.update([]);
    assert.ok(called);
  });
});
