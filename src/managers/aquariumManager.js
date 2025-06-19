// src/managers/aquariumManager.js
// Manages patches and features placed on the Aquarium map
export class AquariumManager {
    constructor(eventManager, monsterManager, itemManager, mapManager, charFactory, itemFactory) {
        this.eventManager = eventManager;
        this.monsterManager = monsterManager;
        this.itemManager = itemManager;
        this.mapManager = mapManager;
        this.charFactory = charFactory;
        this.itemFactory = itemFactory;
        this.features = [];
    }

    addTestingFeature(feature) {
        this.features.push(feature);
        if (feature.type === 'monster') {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const monster = this.charFactory.create('monster', {
                    x: pos.x,
                    y: pos.y,
                    tileSize: this.mapManager.tileSize,
                    groupId: 'dungeon_monsters',
                    image: feature.image,
                    baseStats: feature.baseStats || {}
                });
                this.monsterManager.monsters.push(monster);
            }
        } else if (feature.type === 'item') {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const item = this.itemFactory.create(feature.itemId, pos.x, pos.y, this.mapManager.tileSize);
                if (item) this.itemManager.addItem(item);
            }
        }
    }

    inspectFeatures() {
        return this.features.length > 0;
    }
}

export class AquariumInspector {
    constructor(aquariumManager) {
        this.aquariumManager = aquariumManager;
    }

    run() {
        return this.aquariumManager.inspectFeatures();
    }
}

