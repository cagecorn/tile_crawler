import { Item } from '../entities.js';
import { debugLog } from '../utils/logger.js';

export class ItemManager {
    constructor(eventManager, mapManager, assets) {
        this.items = [];
        this.eventManager = eventManager;
        this.mapManager = mapManager;
        this.assets = assets;
        console.log("[ItemManager] Initialized");
        debugLog("[ItemManager] Initialized");
    }

    _spawnItems(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                if (Math.random() < 0.5) {
                    this.items.push(new Item(pos.x, pos.y, this.mapManager.tileSize, 'gold', this.assets.gold));
                } else {
                    this.items.push(new Item(pos.x, pos.y, this.mapManager.tileSize, 'potion', this.assets.potion));
                }
            }
        }
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        const idx = this.items.indexOf(item);
        if (idx !== -1) {
            this.items.splice(idx, 1);
        }
    }

    update() {
        for (const item of this.items) {
            if (typeof item.update === 'function') {
                item.update();
            }
        }
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }
}
