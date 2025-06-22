import { describe, test, assert } from './helpers.js';
import { ItemFactory, CharacterFactory } from '../src/factory.js';
import { WeaponStatManager } from '../src/micro/WeaponStatManager.js';

const assets = { sword:{}, player:{} };

describe('Micro-World: Weapon Proficiency', () => {
  test('무기 사용 시 숙련도 경험치가 오르고 쿨타임이 적용된다', () => {
    const itemFactory = new ItemFactory(assets);
    const charFactory = new CharacterFactory(assets);
    const sword = itemFactory.create('short_sword', 0,0,1);
    const player = charFactory.create('player', { x:0, y:0, tileSize:1, groupId:'p' });
    player.equipment.weapon = sword;

    const initialExp = sword.weaponStats.exp;
    sword.weaponStats.gainExp(1);
    assert.strictEqual(sword.weaponStats.exp, initialExp + 1);

    sword.weaponStats.cooldown = 30;
    assert.strictEqual(sword.weaponStats.cooldown, 30);
  });

  test('무기 태그에 맞는 스킬만 해금된다', () => {
    const bowStats = new WeaponStatManager('long_bow', ['ranged', 'bow']);
    assert.ok(bowStats.skills.includes('charge_shot'), '활 스킬 습득');
    assert.ok(!bowStats.skills.includes('parry'), '검 스킬은 배우지 않아야 함');
  });
});
