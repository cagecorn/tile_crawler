import { MonsterManager } from '../src/managers/monsterManager.js';
import { MapManager } from '../src/map.js';
import { CharacterFactory } from '../src/factory.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

const assets = { monster: {} };

describe('MonsterManager', () => {
  test('_spawnMonsters 기본 경험치 적용', () => {
    const eventManager = new EventManager();
    const mapManager = new MapManager(1);
    const factory = new CharacterFactory(assets);
    const mm = new MonsterManager(eventManager, mapManager, assets, factory);
    mm._spawnMonsters(1);
    assert.strictEqual(mm.monsters.length, 1);
    const monster = mm.monsters[0];
    assert.strictEqual(monster.stats.get('expValue'), 5);
  });
});
