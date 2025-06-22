import { StatEngine } from '../src/engines/statEngine.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('StatEngine', () => {
  test('exp_gained 이벤트가 경험치 추가로 이어진다', () => {
    const eventManager = new EventManager();
    let gained = 0;
    const player = { stats: { addExp: (exp) => { gained += exp; } } };

    new StatEngine(eventManager);

    eventManager.publish('exp_gained', { entity: player, exp: 10 });

    assert.strictEqual(gained, 10);
  });
});
