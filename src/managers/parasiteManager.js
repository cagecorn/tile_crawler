export class ParasiteManager {
    constructor(eventManager = null) {
        this.eventManager = eventManager;
        console.log('[ParasiteManager] Initialized');
    }

    equip(entity, parasite) {
        if (!entity.consumables) entity.consumables = [];
        if (entity.consumables.length >= (entity.consumableCapacity || 0)) return false;
        parasite.quantity = 1;
        entity.consumables.push(parasite);
        return true;
    }

    hasParasite(entity) {
        return Array.isArray(entity.consumables) && entity.consumables.some(i => i.type === 'parasite' || i.tags?.includes('parasite'));
    }
}
