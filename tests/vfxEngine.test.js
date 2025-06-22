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

  test('skill_used with vfxKey triggers sprite effect', () => {
    const em = new EventManager();
    const calls = [];
    const vfxManager = {
      castEffect: () => {},
      addTextPopup: () => {},
      addSpriteEffect: (...args) => calls.push(args)
    };
    const assets = { heal: 'img' };
    new VFXEngine(em, vfxManager, assets);
    const ent = { x: 0, y: 0, width: 10, height: 10, stats: { get: () => 1 } };
    em.publish('skill_used', { caster: ent, target: ent, skill: { vfxKey: 'heal' } });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0][0], assets.heal);
  });
});
