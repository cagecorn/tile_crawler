import { ProjectileEngine } from '../src/engines/projectileEngine.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('ProjectileEngine', () => {
  test('skill_used 이벤트로 투사체가 생성된다', () => {
    const em = new EventManager();
    const calls = [];
    const pm = { create: (c,t,s)=>calls.push({c,t,s}), update: ()=>{} };
    new ProjectileEngine(em, pm);
    const caster = {};
    const target = {};
    const skill = { projectile:'fireball' };
    em.publish('skill_used', { caster, skill, target });
    assert.strictEqual(calls.length,1);
    assert.strictEqual(calls[0].c,caster);
    assert.strictEqual(calls[0].t,target);
    assert.strictEqual(calls[0].s,skill);
  });

  test('update가 ProjectileManager.update를 호출한다', () => {
    const em = new EventManager();
    let called = false;
    const pm = { update: () => { called = true; } };
    const engine = new ProjectileEngine(em, pm);
    engine.update([]);
    assert.ok(called);
  });
});
