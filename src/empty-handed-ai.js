import { MeleeAI } from './ai.js';

export class EmptyHandedAI extends MeleeAI {
    decideAction(self, context) {
        const { enemies = [], itemManager, equipmentManager, mapManager, itemAIManager } = context;
        let nearest = null;
        let minDist = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - self.x, e.y - self.y);
            if (d < minDist) { minDist = d; nearest = e; }
        }
        if (nearest && minDist <= self.visionRange) {
            const range = mapManager?.tileSize || self.tileSize;
            if (!self.equipment.weapon && itemManager) {
                const weapon = itemManager.items.find(it =>
                    (it.tags?.includes('weapon') || it.type === 'weapon') &&
                    Math.hypot(it.x - self.x, it.y - self.y) <= range
                );
                if (weapon) {
                    itemManager.removeItem(weapon);
                    if (equipmentManager) equipmentManager.equip(self, weapon, null);
                    else {
                        self.equipment.weapon = weapon;
                        if (typeof self.updateAI === 'function') self.updateAI();
                    }
                }
            }

            if (Array.isArray(self.consumables) &&
                self.consumables.length < (self.consumableCapacity || Infinity) &&
                itemManager) {
                const consumable = itemManager.items.find(it =>
                    it.tags?.includes('consumable') &&
                    Math.hypot(it.x - self.x, it.y - self.y) <= range
                );
                if (consumable) {
                    itemManager.removeItem(consumable);
                    if (typeof self.addConsumable === 'function') self.addConsumable(consumable);
                    if (itemAIManager && typeof itemAIManager._useItem === 'function') {
                        itemAIManager._useItem(self, consumable, self);
                    }
                }
            }
        }
        return super.decideAction(self, context);
    }
}
