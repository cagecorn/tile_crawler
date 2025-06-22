import { EventEngine } from '../src/engines/eventEngine.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('EventEngine', () => {
  test('지연된 이벤트가 올바른 순서로 발행된다', () => {
    const em = new EventManager();
    const engine = new EventEngine(em);
    const log = [];
    em.subscribe('a', () => log.push('a'));
    em.subscribe('b', () => log.push('b'));

    engine.schedule(1, 'a');
    engine.schedule(2, 'b');

    engine.update();
    assert.deepStrictEqual(log, ['a']);
    engine.update();
    assert.deepStrictEqual(log, ['a', 'b']);
  });
});
