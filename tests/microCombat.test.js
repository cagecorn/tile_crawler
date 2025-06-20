import { MicroCombatManager } from '../src/micro/MicroCombatManager.js';
import { EventManager } from '../src/managers/eventManager.js';
import { Item } from '../src/entities.js';
import { describe, test, assert } from './helpers.js';

describe('Micro Combat', () => {
  test('장비 내구도 손상과 이벤트 발생', () => {
    const eventManager = new EventManager();
    const microCombat = new MicroCombatManager(eventManager);

    const weaponImage = {};
    const armorImage = {};
    const weapon = new Item(0, 0, 1, 'sword', weaponImage);
    weapon.type = 'weapon';
    weapon.tier = 'normal';
    weapon.durability = 1;
    weapon.weight = 5;
    weapon.toughness = 1;

    const armor = new Item(0, 0, 1, 'armor', armorImage);
    armor.type = 'armor';
    armor.tier = 'normal';
    armor.durability = 1;
    armor.weight = 2;
    armor.toughness = 0;

    const attacker = { equipment: { weapon } };
    const defender = { equipment: { armor } };

    let disarmed = false;
    let broken = false;
    eventManager.subscribe('weapon_disarmed', () => { disarmed = true; });
    eventManager.subscribe('armor_broken', () => { broken = true; });

    microCombat.resolveAttack(attacker, defender);

    assert.ok(disarmed, '무기 무장해제 이벤트가 발생해야 합니다');
    assert.ok(broken, '방어구 파괴 이벤트가 발생해야 합니다');
    assert.strictEqual(weapon.durability, 0);
    assert.ok(armor.durability <= 0);
  });
});
