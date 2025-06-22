import { SkillEngine } from '../src/engines/skillEngine.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('SkillEngine', () => {
  test('skill_used 이벤트로 스킬 효과가 적용된다', () => {
    const em = new EventManager();
    let called = false;
    const sm = { applySkillEffects: () => { called = true; } };
    new SkillEngine(em, sm);
    em.publish('skill_used', { caster:{}, skill:{}, target:{} });
    assert.ok(called);
  });

  test('update가 SkillManager.update를 호출한다', () => {
    const em = new EventManager();
    let called = false;
    const sm = { update: () => { called = true; } };
    const engine = new SkillEngine(em, sm);
    engine.update();
    assert.ok(called);
  });
});
