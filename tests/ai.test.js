import { CombatBehavior } from '../src/ai/behaviors/combat.js';
import { HealBehavior } from '../src/ai/behaviors/heal.js';
import { describe, test, assert } from './helpers.js';

const mapStub = { tileSize: 1, isWallAt: () => false };

describe('Behavior AI', () => {
  test('CombatBehavior attacks enemy in range', () => {
    const beh = new CombatBehavior();
    const self = { x:0, y:0, attackRange:10, visionRange:30, equipment:{}, properties:{} };
    const enemy = { x:5, y:0, hp:10 };
    const action = beh.decideAction(self, { enemies:[enemy], allies:[], player:{}, mapManager:mapStub });
    assert.strictEqual(action.type, 'attack');
    assert.strictEqual(action.target, enemy);
  });

  test('CombatBehavior idles when target is far', () => {
    const beh = new CombatBehavior();
    const self = { x:0, y:0, attackRange:2, visionRange:30, equipment:{}, properties:{} };
    const enemy = { x:25, y:0, hp:10 };
    const action = beh.decideAction(self, { enemies:[enemy], allies:[], player:{}, mapManager:mapStub });
    assert.strictEqual(action.type, 'idle');
  });

  test('Ranged unit attacks when enemy is too close to retreat', () => {
    const beh = new CombatBehavior();
    const self = {
      x: 0,
      y: 0,
      tileSize: 1,
      attackRange: 6,
      visionRange: 20,
      equipment: { weapon: { tags: ['ranged', 'bow'] } },
      properties: { mbti: 'ISTJ' }
    };
    const enemy = { x: 0.5, y: 0, hp: 10 };
    const action = beh.decideAction(self, { enemies:[enemy], allies:[], player:{}, mapManager:mapStub });
    assert.strictEqual(action.type, 'attack');
  });

  test('HealBehavior heals wounded ally', () => {
    const beh = new HealBehavior();
    const self = { x:0, y:0, attackRange:10, mp:20, skills:['heal'], skillCooldowns:{}, properties:{ mbti:'ENFP' } };
    const ally = { x:5, y:0, hp:5, maxHp:10 };
    const action = beh.decideAction(self, { allies:[self, ally], mapManager:mapStub });
    assert.strictEqual(action.type, 'skill');
    assert.strictEqual(action.target, ally);
  });
});
