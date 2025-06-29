import { TRAITS } from '../data/traits.js';
import { adjustMonsterStatsForAquarium } from '../utils/aquariumUtils.js';
import { debugLog } from '../utils/logger.js';

const DEFAULT_EXP_VALUE = 5;

export class MonsterManager {
    constructor(eventManager, mapManager, assets, factory) {
        this.eventManager = eventManager;
        this.mapManager = mapManager;
        this.assets = assets;
        this.factory = factory;
        this.monsters = [];
        this.traitManager = null;
        this.equipmentRenderManager = null;
        console.log("[MonsterManager] Initialized");
        debugLog("[MonsterManager] Initialized");

        if (this.eventManager) {
            this.eventManager.subscribe('entity_removed', (data) => {
                this.monsters = this.monsters.filter(m => m.id !== data.victimId);
            });
        }
    }

    setTraitManager(traitManager) {
        this.traitManager = traitManager;
    }

    _spawnMonsters(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                let stats = { expValue: DEFAULT_EXP_VALUE };
                if (this.mapManager.name === 'aquarium') {
                    stats = adjustMonsterStatsForAquarium(stats);
                }
                const monster = this.factory.create('monster', {
                    x: pos.x,
                    y: pos.y,
                    tileSize: this.mapManager.tileSize,
                    groupId: 'dungeon_monsters',
                    image: this.assets?.monster,
                    baseStats: stats
                });
                if (this.equipmentRenderManager) {
                    monster.equipmentRenderManager = this.equipmentRenderManager;
                }
                this.monsters.push(monster);
            }
        }
    }

    removeMonster(monsterId) {
        this.monsters = this.monsters.filter(m => m.id !== monsterId);
    }

    update() {
        for (const monster of this.monsters) {
            if (typeof monster.update === 'function') {
                monster.update();
            }
        }
    }

    getMonsterAt(x, y) {
        for (const monster of this.monsters) {
            if (
                x >= monster.x && x < monster.x + monster.width &&
                y >= monster.y && y < monster.y + monster.height
            ) {
                return monster;
            }
        }
        return null;
    }

    render(ctx) {
        for (const monster of this.monsters.filter(m => !m.isDying)) {
            if (monster.render) monster.render(ctx);
        }
    }
}
