import { TRAITS } from '../data/traits.js';

export class MonsterManager {
    constructor(eventManager = null, assets = null, factory = null) {
        this.eventManager = eventManager;
        this.assets = assets;
        this.factory = factory;
        this.monsters = [];
        this.traitManager = null;
        console.log("[MonsterManager] Initialized");

        if (this.eventManager) {
            this.eventManager.subscribe('entity_removed', (data) => {
                this.monsters = this.monsters.filter(m => m.id !== data.victimId);
            });
        }
    }

    setTraitManager(traitManager) {
        this.traitManager = traitManager;
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
