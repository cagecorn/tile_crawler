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

        const mbti = self.properties?.mbti || '';
        const range = item.range || 64;

        // MBTI 로직 추가: 'I' (내향형)은 자신만 치유합니다.
        if (mbti.includes('I')) {
            if (self.hp / self.maxHp < 0.5) {
                this._useItem(self, item, self);
            }
            return;
        }

        // MBTI 로직 추가: 'E' (외향형)은 아군을 먼저 확인합니다.
        if (mbti.includes('E')) {
            const ally = allEntities.find(e => 
                e !== self &&
                e.isFriendly === self.isFriendly &&
                e.hp > 0 &&
                e.hp / e.maxHp < 0.5 &&
                Math.hypot(e.x - self.x, e.y - self.y) <= range
            );
            if (ally) {
                this._useItem(self, item, ally);
                return;
            }
        }
        
        // 기본 행동 또는 E타입이 아군을 찾지 못했을 경우: 자신을 치유
        if (self.hp / self.maxHp < 0.5) {
            this._useItem(self, item, self);
            return;
        }

        // 기본 행동: 자신은 괜찮고, 주변에 다친 아군이 있다면 치유
        const ally = allEntities.find(e => 
            e !== self &&
            e.isFriendly === self.isFriendly &&
            e.hp > 0 &&
            e.hp / e.maxHp < 0.5 &&
            Math.hypot(e.x - self.x, e.y - self.y) <= range
        );
        if (ally) {
            this._useItem(self, item, ally);
        }
    }

    _useItem(user, item, target) {
        if (!item || (item.quantity && item.quantity <= 0)) return;

        const heal = 5; // 아이템의 회복량 (나중에 데이터 기반으로 수정 가능)
        target.hp = Math.min(target.maxHp, target.hp + heal);

        if (this.vfxManager) this.vfxManager.addItemUseEffect(target, item.image);
        
        // 자신에게 사용하는 것이 아니라면 아이템을 던집니다.
        if (this.projectileManager && user !== target) {
            this.projectileManager.throwItem(user, target, item);
        }

        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            const inv = user.consumables || user.inventory;
            const idx = inv.indexOf(item);
            if (idx >= 0) inv.splice(idx, 1);
        }

        if (this.eventManager) {
            this.eventManager.publish('log', { message: `${user.constructor.name} uses ${item.name}` });
        }
    }
}
