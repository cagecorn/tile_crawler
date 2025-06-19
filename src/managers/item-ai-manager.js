export class ItemAIManager {
    constructor(eventManager = null, projectileManager = null, vfxManager = null) {
        this.eventManager = eventManager;
        this.projectileManager = projectileManager;
        this.vfxManager = vfxManager;
    }

    update(context) {
        const { player, mercenaryManager, monsterManager } = context;
        const entities = [
            player,
            ...(mercenaryManager?.mercenaries || []),
            ...(monsterManager?.monsters || [])
        ];
        for (const ent of entities) {
            this._handleHealingItems(ent, entities);
        }
    }

    _handleHealingItems(self, allEntities) {
        const inventory = self.consumables || self.inventory;
        if (!Array.isArray(inventory) || inventory.length === 0) return;
        const item = inventory.find(i => i.tags?.includes('healing_item') || i.tags?.includes('체력 회복 아이템'));
        if (!item) return;
        const range = item.range || 64;
        if (self.hp / self.maxHp < 0.5) {
            this._useItem(self, item, self);
            return;
        }
        const ally = allEntities.find(e => e !== self && e.isFriendly === self.isFriendly && e.hp > 0 && e.hp / e.maxHp < 0.5 && Math.hypot(e.x - self.x, e.y - self.y) <= range);
        if (ally) {
            this._useItem(self, item, ally);
        }
    }

    _useItem(user, item, target) {
        if (!item || item.quantity <= 0) return;
        const heal = 5;
        target.hp = Math.min(target.maxHp, target.hp + heal);
        if (this.vfxManager) this.vfxManager.addItemUseEffect(target, item.image);
        if (this.projectileManager && user !== target) {
            this.projectileManager.throwItem(user, target, item);
        }
        if (item.quantity > 1) item.quantity -= 1; else {
            const inv = user.consumables || user.inventory;
            const idx = inv.indexOf(item);
            if (idx >= 0) inv.splice(idx, 1);
        }
        if (this.eventManager) {
            this.eventManager.publish('log', { message: `${user.constructor.name} uses ${item.name}` });
        }
    }
}
