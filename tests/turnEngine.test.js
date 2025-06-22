import { describe, test, assert } from './helpers.js';
import { EventManager } from '../src/managers/eventManager.js';
import { TurnEngine } from '../src/engines/turnEngine.js';

describe('TurnEngine', () => {
  test('update가 TurnManager.update를 호출한다', () => {
    const em = new EventManager();
    let called = false;
    const dummy = { update: (ents, ctx) => { if(ctx.eventManager === em) called = true; } };
    const engine = new TurnEngine(em, dummy);
    engine.update([], { player: null });
    assert.ok(called);
  });

  test('프레임이 누적되면 턴 카운트가 증가한다', () => {
    const em = new EventManager();
    const engine = new TurnEngine(em);
    engine.turnManager.framesPerTurn = 5;
    for(let i=0;i<5;i++) engine.update([], {});
    assert.strictEqual(engine.turnManager.turnCount, 1);
  });
});
