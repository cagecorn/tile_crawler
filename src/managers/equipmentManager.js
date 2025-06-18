export class EquipmentManager {
    constructor(eventManager = null) {
        this.eventManager = eventManager;
        console.log('[EquipmentManager] Initialized');
    }

    equip(entity, item, inventory) {
        const slot = this._getSlotForItem(item);
        if (!slot) return;

        const oldItem = entity.equipment[slot];
        if (oldItem && inventory) {
            inventory.push(oldItem);
        }

        entity.equipment[slot] = item;

        if (entity.stats && typeof entity.stats.updateEquipmentStats === 'function') {
            entity.stats.updateEquipmentStats();
        }
        if (typeof entity.updateAI === 'function') {
            entity.updateAI();
        }

        if (this.eventManager) {
            this.eventManager.publish('log', { message: `${entity.constructor.name}(이)가 ${item.name} (을)를 장착했습니다.` });
        }
    }

    _getSlotForItem(item) {
        if (!item) return null;
        if ((item.tags && item.tags.includes('weapon')) || item.type === 'weapon') return 'weapon';
        if ((item.tags && item.tags.includes('armor')) || item.type === 'armor') return 'armor';
        return null;
    }
}
