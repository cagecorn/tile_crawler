import { MapManager } from '../src/map.js';
import { CharacterFactory, ItemFactory } from '../src/factory.js';
import { MercenaryManager } from '../src/managers/managers.js';
import { EventManager } from '../src/managers/eventManager.js';
import { monsterDeathWorkflow } from '../src/workflows.js';
import { describe, test, assert } from './helpers.js';

describe('Integration', () => {

test('간단한 게임 흐름', () => {
    const assets = { player:{}, mercenary:{}, monster:{}, sword:{}, leather_armor:{} };
    const mapManager = new MapManager(42);
    assert.ok(mapManager.map && mapManager.map.length > 0, '맵 생성');

    const factory = new CharacterFactory(assets);
    const itemFactory = new ItemFactory(assets);
    const eventManager = new EventManager();
    const mercManager = new MercenaryManager(assets, factory);

    const player = factory.create('player', { x:0, y:0, tileSize:1, groupId:'player_party' });
    assert.ok(player.stats.get('maxHp') > 0, '플레이어 스탯 확인');

    const merc = mercManager.hireMercenary('warrior', 1, 0, 1, 'player_party');
    assert.ok(merc, '용병 고용');

    const archer = mercManager.hireMercenary('archer', 2, 0, 1, 'player_party');
    assert.ok(archer && archer.ai, '궁수 용병 고용');

    const monster = factory.create('monster', { x:2, y:0, tileSize:1, groupId:'dungeon_monsters', baseStats:{ expValue:5 } });
    let expEvent = false;
    eventManager.subscribe('exp_gained', () => { expEvent = true; });

    monsterDeathWorkflow({ eventManager, attacker: merc, victim: monster });

    assert.ok(expEvent, '경험치 이벤트 발생');
    assert.ok(merc.stats.get('exp') > 0, '용병 경험치 증가');

    const weapon = itemFactory.create('short_sword', 0, 0, 1);
    const beforeAtk = merc.stats.get('attackPower');
    merc.equipment.weapon = weapon;
    merc.stats.updateEquipmentStats();
    merc.updateAI();
    assert.ok(merc.stats.get('attackPower') > beforeAtk, '장비 장착 후 스탯 증가');
});

});
