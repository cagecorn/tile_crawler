export class MercenaryManager {
    constructor(eventManager = null, assets = null, factory = null) {
        this.eventManager = eventManager;
        this.assets = assets;
        this.factory = factory;
        this.mercenaries = [];
        this.equipmentRenderManager = null;
        console.log("[MercenaryManager] Initialized");
    }

    hireMercenary(jobId, x, y, tileSize, groupId) {
        if (!this.factory || !this.assets) {
            return null;
        }
        const imageKey = this.assets[jobId] ? jobId : 'mercenary';
        const merc = this.factory.create('mercenary', {
            x,
            y,
            tileSize,
            groupId,
            jobId,
            image: this.assets[imageKey],
        });
        if (merc) {
            if (this.equipmentRenderManager) {
                merc.equipmentRenderManager = this.equipmentRenderManager;
            }
            this.mercenaries.push(merc);
        }
        return merc;
    }

    render(ctx) {
        for (const merc of this.mercenaries) {
            if (merc.render) merc.render(ctx);
        }
    }
}
