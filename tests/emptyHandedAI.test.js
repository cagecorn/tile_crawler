import { Mercenary, Item } from '../src/entities.js';
import { EquipmentManager } from '../src/managers/equipmentManager.js';
import { ItemManager } from '../src/managers/itemManager.js';
import { EventManager } from '../src/managers/eventManager.js';
import { EmptyHandedAI } from '../src/empty-handed-ai.js';
import { describe, test, assert } from './helpers.js';

describe('EmptyHandedAI', () => {
  test('picks up weapon when enemy nearby', () => {
    const ev = new EventManager();
    const eq = new EquipmentManager(ev);
    const items = new ItemManager();
    const merc = new Mercenary({ x:0, y:0, tileSize:1, groupId:'g', stats:{} });
    merc.ai = new EmptyHandedAI();
    const sword = new Item(0, 0, 1, 'sword', null);
    sword.tags = ['weapon','melee'];
    items.addItem(sword);
    const enemy = { x:0.5, y:0.5 };
    merc.equipment.weapon = null;

    merc.ai.decideAction(merc, { enemies:[enemy], itemManager:items, equipmentManager:eq, mapManager:{ tileSize:1 } });

    assert.strictEqual(merc.equipment.weapon, sword);
    assert.strictEqual(items.items.length, 0);
  });

  test('picks up consumable if slot free', () => {
    const ev = new EventManager();
    const eq = new EquipmentManager(ev);
    const items = new ItemManager();
    const merc = new Mercenary({ x:0, y:0, tileSize:1, groupId:'g', stats:{} });
    merc.ai = new EmptyHandedAI();
    merc.consumables = [];
    merc.consumableCapacity = 2;
    const potion = new Item(0, 0, 1, 'potion', null);
    potion.tags = ['consumable'];
    items.addItem(potion);
    const enemy = { x:0.5, y:0.5 };

    merc.ai.decideAction(merc, { enemies:[enemy], itemManager:items, equipmentManager:eq, mapManager:{ tileSize:1 } });

    assert.strictEqual(merc.consumables.length, 1);
    assert.strictEqual(items.items.length, 0);
  });
});
