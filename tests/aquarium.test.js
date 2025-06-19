import { AquariumMapManager } from '../src/aquariumMap.js';
import { AquariumManager, AquariumInspector } from '../src/managers/aquariumManager.js';
import { CharacterFactory } from '../src/factory.js';
import { EventManager } from '../src/managers/eventManager.js';
import { MonsterManager, ItemManager } from '../src/managers/managers.js';
import { describe, test, assert } from './helpers.js';

const assets = { monster:{} };

describe('Aquarium', () => {
    test('Aquarium map uses a wide maze layout', () => {
        const m = new AquariumMapManager(1);
        assert.ok(m.corridorWidth >= 8, 'corridor width should be wide');
        const wallCount = m.countTiles(m.tileTypes.WALL);
        assert.ok(wallCount > 0 && wallCount < m.width * m.height, 'maze should contain walls and floors');
    });

    test('Manager adds feature and inspector passes', () => {
        const eventManager = new EventManager();
        const monsterManager = new MonsterManager(0, new AquariumMapManager(), assets, eventManager, new CharacterFactory(assets));
        const itemManager = new ItemManager();
        const factory = new CharacterFactory(assets);
        const aquariumManager = new AquariumManager(eventManager, monsterManager, itemManager, monsterManager.mapManager, factory, { create(){return null;} });
        aquariumManager.addTestingFeature({ type:'monster', image:{} });
        const inspector = new AquariumInspector(aquariumManager);
        assert.ok(inspector.run(), 'inspection fails');
        assert.strictEqual(monsterManager.monsters.length, 1);
    });
});
