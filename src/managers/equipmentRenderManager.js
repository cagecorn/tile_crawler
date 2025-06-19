export class EquipmentRenderManager {
    constructor(eventManager = null, assets = null, factory = null) {
        console.log('[EquipmentRenderManager] Initialized');
    }

    getWeaponDrawParams(entity) {
        return {
            x: entity.x + entity.width * 0.3,
            y: entity.y + entity.height * 0.3,
            width: entity.width * 0.8,
            height: entity.height * 0.8,
        };
    }

    drawWeapon(ctx, entity) {
        const weapon = entity.equipment?.weapon;
        if (!weapon || !weapon.image) return;
        const { x, y, width, height } = this.getWeaponDrawParams(entity);
        ctx.drawImage(weapon.image, x, y, width, height);
    }
}
