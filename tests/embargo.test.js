import { MapManager } from '../src/map.js';
import { CharacterFactory, ItemFactory } from '../src/factory.js';
import { EventManager } from '../src/managers/eventManager.js';
import { MetaAIManager, STRATEGY } from '../src/managers/ai-managers.js';
import { PathfindingManager } from '../src/managers/pathfindingManager.js';
import { ItemManager, EquipmentManager } from '../src/managers/managers.js';
import { TagManager } from '../src/managers/tagManager.js';
import { CombatCalculator } from '../src/combat.js';
import { MeleeAI } from '../src/ai.js';
import { test, assert } from './helpers.js';

console.log("--- Running Embargo Test ---");

class AutoPlayerAI extends MeleeAI {
    decideAction(self, context) {
        const { enemies, itemManager } = context;

        // 아이템이 가까이 있으면 먼저 이동
        for (const item of itemManager.items) {
            const dist = Math.hypot(item.x - self.x, item.y - self.y);
            if (dist < self.tileSize * 2) {
                return { type: 'move', target: item };
            }
        }

        // 가장 가까운 적을 항상 추적
        let nearest = null;
        let minDist = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - self.x, e.y - self.y);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        }
        if (nearest) {
            if (minDist <= self.attackRange) return { type: 'attack', target: nearest };
            return { type: 'move', target: nearest };
        }
        return { type: 'idle' };
    }
}

test('맵 순회 자동 플레이', () => {
    const assets = { player:{}, monster:{}, mercenary:{}, gold:{}, potion:{}, sword:{}, leather_armor:{} };
    const mapManager = new MapManager(1);
    const factory = new CharacterFactory(assets);
    const itemFactory = new ItemFactory(assets);
    const eventManager = new EventManager();
    const pathfindingManager = new PathfindingManager(mapManager);
    const aiManager = new MetaAIManager(eventManager);
    const itemManager = new ItemManager(5, mapManager, assets);
    const equipmentManager = new EquipmentManager(eventManager);

    const playerGroup = aiManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
    const monsterGroup = aiManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

    const pPos = mapManager.getRandomFloorPosition();
    const player = factory.create('player', { x:pPos.x, y:pPos.y, tileSize: mapManager.tileSize, groupId: playerGroup.id, baseStats:{ movement: 10 } });
    player.ai = new AutoPlayerAI();
    playerGroup.addMember(player);

    const merc = factory.create('mercenary', { x:pPos.x + mapManager.tileSize, y:pPos.y, tileSize: mapManager.tileSize, groupId: playerGroup.id, jobId:'warrior', image: assets.mercenary, baseStats:{ movement: 10 } });
    merc.ai = new MeleeAI();
    playerGroup.addMember(merc);

    const monsters = [];
    const offsets = [
        {x: mapManager.tileSize, y: 0},
        {x: -mapManager.tileSize, y: 0},
        {x: 0, y: mapManager.tileSize},
        {x: 0, y: -mapManager.tileSize}
    ];
    console.log('player start', pPos);
    for (let i=0;i<2;i++) {
        let mPos = null;
        for (const off of offsets) {
            const candidate = { x: pPos.x + off.x, y: pPos.y + off.y };
            if (!mapManager.isWallAt(candidate.x, candidate.y, mapManager.tileSize, mapManager.tileSize)) {
                mPos = candidate; break;
            }
        }
        if (!mPos) mPos = mapManager.getRandomFloorPosition();
        const m = factory.create('monster', {
            x: mPos.x,
            y: mPos.y,
            tileSize: mapManager.tileSize,
            groupId: monsterGroup.id,
            image: assets.monster
        });
        console.log('monster', i, mPos);
        monsters.push(m);
        monsterGroup.addMember(m);
    }

    // 장비 아이템 몇 개 추가
    const swordPos = mapManager.getRandomFloorPosition();
    itemManager.items.push(itemFactory.create('short_sword', swordPos.x, swordPos.y, mapManager.tileSize));
    const armorPos = mapManager.getRandomFloorPosition();
    itemManager.items.push(itemFactory.create('leather_armor', armorPos.x, armorPos.y, mapManager.tileSize));

    let gold = 200;
    const inventory = [];

    const tagManager = new TagManager();
    const combatCalculator = new CombatCalculator(eventManager, tagManager);

    eventManager.subscribe('entity_attack', data => combatCalculator.handleAttack(data));
    eventManager.subscribe('damage_calculated', data => {
        data.defender.takeDamage(data.damage);
        if (data.defender.hp <= 0) {
            eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
            eventManager.publish('entity_removed', { victimId: data.defender.id });
        }
    });
    eventManager.subscribe('entity_death', ({ attacker, victim }) => {
        if (!victim.isFriendly && (attacker.isPlayer || attacker.isFriendly)) {
            eventManager.publish('exp_gained', { player: attacker, exp: victim.expValue });
        }
    });
    eventManager.subscribe('exp_gained', ({ player, exp }) => {
        player.stats.addExp(exp);
    });

    assert.strictEqual(player.isPlayer, true);
});

