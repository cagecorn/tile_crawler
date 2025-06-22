import { EffectEngine } from '../src/engines/effectEngine.js';
import { EffectManager } from '../src/managers/effectManager.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('EffectEngine', () => {
  test('apply_effect 이벤트로 효과가 추가된다', () => {
    const em = new EventManager();
    const effectManager = new EffectManager(em);
    new EffectEngine(em, effectManager);
    const target = { effects: [], stats: { recalculate: ()=>{}, increaseBaseStat: ()=>{} }, shield:0, damageBonus:0 };

    em.publish('apply_effect', { target, effectId: 'strength_buff' });

    assert.strictEqual(target.effects.length, 1);
    assert.strictEqual(target.effects[0].id, 'strength_buff');
  });

  test('remove_effect 이벤트로 효과가 제거된다', () => {
    const em = new EventManager();
    const effectManager = new EffectManager(em);
    new EffectEngine(em, effectManager);
    const target = { effects: [], stats: { recalculate: ()=>{}, increaseBaseStat: ()=>{} }, shield:0, damageBonus:0 };
    effectManager.addEffect(target, 'strength_buff');
    const eff = target.effects[0];
    em.publish('remove_effect', { target, effect: eff });
    assert.strictEqual(target.effects.length, 0);
  });

  test('update가 EffectManager.update를 호출한다', () => {
    const em = new EventManager();
    let called = false;
    const effectManager = { update: () => { called = true; } };
    const engine = new EffectEngine(em, effectManager);
    engine.update([]);
    assert.ok(called);
  });
});
