import { VFXEngine } from '../src/engines/vfxEngine.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('VFXEngine', () => {
  test('MBTI trait popup fires', () => {
    const em = new EventManager();
    const calls = [];
    const vfxManager = { addTextPopup: (t,e)=>calls.push({t,e}) };
    new VFXEngine(em, vfxManager, {});
    const ent = {};
    em.publish('ai_mbti_trait_triggered', { trait:'E', entity:ent });
    assert.strictEqual(calls.length,1);
    assert.strictEqual(calls[0].t,'E');
    assert.strictEqual(calls[0].e,ent);
  });
});
