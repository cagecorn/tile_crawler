import { CoreLinkEngine } from '../src/engines/coreLinkEngine.js';
import { describe, test, assert } from './helpers.js';

describe('CoreLinkEngine', () => {
  test('register and get returns same instance', () => {
    const engine = new CoreLinkEngine();
    const dummy = {};
    engine.register('dummy', dummy);
    assert.strictEqual(engine.get('dummy'), dummy);
  });

  test('registerMany registers all engines', () => {
    const engine = new CoreLinkEngine();
    const a = {}, b = {};
    engine.registerMany({ a, b });
    assert.strictEqual(engine.get('a'), a);
    assert.strictEqual(engine.get('b'), b);
  });

  test('get on missing engine returns null', () => {
    const engine = new CoreLinkEngine();
    assert.strictEqual(engine.get('missing'), null);
  });

  test('has and unregister work as expected', () => {
    const engine = new CoreLinkEngine();
    const obj = {};
    engine.register('obj', obj);
    assert.strictEqual(engine.has('obj'), true);
    engine.unregister('obj');
    assert.strictEqual(engine.has('obj'), false);
    assert.strictEqual(engine.get('obj'), null);
  });
});

