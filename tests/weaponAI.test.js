import { BowAI, SpearAI } from '../src/micro/WeaponAI.js';
import { describe, test, assert } from './helpers.js';

const mapStub = { tileSize: 1, isWallAt: () => false };

describe('WeaponAI', () => {
  test('BowAI uses charge shot at mid range', () => {
    const ai = new BowAI();
    const wielder = { x: 0, y: 0, attackRange: 20, effects: [] };
    const weapon = { weaponStats: { canUseSkill: () => true } };
    const enemy = { x: 15, y: 0 };
    const action = ai.decideAction(wielder, weapon, { enemies: [enemy], mapManager: mapStub });
    assert.strictEqual(action.type, 'weapon_skill');
    assert.strictEqual(action.skillId, 'charge_shot');
  });

  test('SpearAI charges when enemy out of range', () => {
    const ai = new SpearAI();
    const wielder = { x: 0, y: 0, attackRange: 10 };
    const weapon = { weaponStats: { canUseSkill: () => true } };
    const enemy = { x: 25, y: 0 };
    const action = ai.decideAction(wielder, weapon, { enemies: [enemy], mapManager: mapStub });
    assert.strictEqual(action.type, 'weapon_skill');
    assert.strictEqual(action.skillId, 'charge');
  });
});
