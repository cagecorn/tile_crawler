export class MotionManager {
    constructor(mapManager, pathfindingManager) {
        this.mapManager = mapManager;
        this.pathfindingManager = pathfindingManager;
        console.log("[MotionManager] Initialized");
    }

    dashTowards(entity, target, maxTiles = 1) {
        const tileSize = this.mapManager.tileSize;
        const startX = Math.floor(entity.x / tileSize);
        const startY = Math.floor(entity.y / tileSize);
        const endX = Math.floor(target.x / tileSize);
        const endY = Math.floor(target.y / tileSize);

        const path = this.pathfindingManager.findPath(startX, startY, endX, endY, () => false);
        if (path.length < 2) return;

        const stepIndex = Math.min(maxTiles, path.length - 2);
        const dest = path[stepIndex];
        const destX = dest.x * tileSize;
        const destY = dest.y * tileSize;

        if (!this.mapManager.isWallAt(destX, destY, entity.width, entity.height)) {
            entity.x = destX;
            entity.y = destY;
        }
    }
}
