import { CharacterFactory } from '../src/factory.js';
import { FAITHS } from '../src/data/faiths.js';
import { describe, test, assert } from './helpers.js';

const assets = {};
const faithKeys = Object.keys(FAITHS);

describe('Faith assignment', () => {
  test('player does not get faith', () => {
    const factory = new CharacterFactory(assets);
    const player = factory.create('player', { x:0, y:0, tileSize:1, groupId:'g' });
    assert.ok(!player.properties.faith);
  });

  test('mercenary gets valid faith', () => {
    const factory = new CharacterFactory(assets);
    const merc = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g' });
    assert.ok(faithKeys.includes(merc.properties.faith));
  });

  test('monster gets valid faith', () => {
    const factory = new CharacterFactory(assets);
    const mon = factory.create('monster', { x:0, y:0, tileSize:1, groupId:'g' });
    assert.ok(faithKeys.includes(mon.properties.faith));
  });
});
