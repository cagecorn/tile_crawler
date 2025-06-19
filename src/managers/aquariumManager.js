// src/managers/aquariumManager.js
// Manages patches and features placed on the Aquarium map
import { TRAITS } from '../data/traits.js';
export class AquariumManager {
    constructor(eventManager, monsterManager, itemManager, mapManager, charFactory, itemFactory, vfxManager = null, traitManager = null) {
        this.eventManager = eventManager;
        this.monsterManager = monsterManager;
        this.itemManager = itemManager;
        this.mapManager = mapManager;
        this.charFactory = charFactory;
        this.itemFactory = itemFactory;
        this.vfxManager = vfxManager;
        this.traitManager = traitManager;
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
                if (this.traitManager) {
                    this.traitManager.applyTraits(monster, TRAITS);
                }
                this.monsterManager.monsters.push(monster);
            }
        } else if (feature.type === 'item') {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const item = this.itemFactory.create(feature.itemId, pos.x, pos.y, this.mapManager.tileSize);
                if (item) this.itemManager.addItem(item);
            }
        } else if (feature.type === 'bubble' && this.vfxManager) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const emitter = this.vfxManager.addEmitter(
                    pos.x + this.mapManager.tileSize / 2,
                    pos.y + this.mapManager.tileSize / 2,
                    {
                        spawnRate: feature.spawnRate || 2,
                        duration: -1,
                        particleOptions: {
                            color: feature.color || 'rgba(200,200,255,0.7)',
                            gravity: feature.gravity !== undefined ? feature.gravity : -0.05,
                            speed: feature.speed || 0.5,
                        },
                    }
                );
                feature.emitter = emitter;
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

