import { EventManager } from '../src/eventManager.js';
import { test, assert } from './helpers.js';

console.log("--- Running EventManager Tests ---");

test('publish가 구독자 호출', () => {
    const em = new EventManager();
    let called = false;
    em.subscribe('test', () => { called = true; });
    em.publish('test', {});
    assert.ok(called);
});
